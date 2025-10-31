from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import faiss
import numpy as np
import fitz  # PyMuPDF
import uuid
import os
import re
from typing import List, Optional
import google.generativeai as genai
from pydub import AudioSegment
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import hashlib

# Cartesia TTS
from cartesia import Cartesia

app = FastAPI(title="PDF to Podcast - Chat & Audio Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Configuration ==========
UPLOAD_DIR = "uploads"
AUDIO_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

# MongoDB Connection
MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.pdf_podcast_db
projects_collection = db.projects

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Configure Cartesia TTS
cartesia_client = Cartesia(api_key=os.getenv("CARTESIA_API_KEY", ""))

# Embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Cartesia Voice IDs
CARTESIA_VOICE_ALEX = "6ccbfb76-1fc6-48f7-b71d-91ac6298247b"
CARTESIA_VOICE_SAM = "00967b2f-88a6-4a31-8153-110a92134b9f"

# ========== Helper Functions ==========

def generate_project_id():
    """Generate unique project ID"""
    return f"project_{hashlib.md5(str(uuid.uuid4()).encode()).hexdigest()}"

def check_cartesia_setup():
    """Check if Cartesia API is configured"""
    api_key = os.getenv("CARTESIA_API_KEY", "")
    return bool(api_key)

# ========== API Models ==========

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ChatRequest(BaseModel):
    project_id: str
    query: str
    top_k: int = 3

class PodcastRequest(BaseModel):
    project_id: str
    topic: Optional[str] = None
    duration: str = "medium"

# ========== PDF Processing ==========

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF with page numbers"""
    doc = fitz.open(file_path)
    text_with_pages = []
    for page_num, page in enumerate(doc, 1):
        page_text = page.get_text()
        text_with_pages.append(f"[PAGE {page_num}]\n{page_text}")
    doc.close()
    return "\n\n".join(text_with_pages)

def build_faiss_index(text: str):
    """Build FAISS vector store with metadata"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = []
    for chunk_text in splitter.split_text(text):
        page_match = re.search(r'\[PAGE (\d+)\]', chunk_text)
        page_num = int(page_match.group(1)) if page_match else 1
        
        chunks.append({
            "text": re.sub(r'\[PAGE \d+\]', '', chunk_text).strip(),
            "page": page_num
        })
    
    chunk_texts = [c["text"] for c in chunks]
    embeddings = embedder.encode(chunk_texts, show_progress_bar=True)
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype('float32'))
    
    return index, chunks, embeddings

# ========== Retrieval & Chat ==========

async def retrieve_with_references(project_id: str, query: str, top_k: int = 3):
    """Retrieve relevant chunks with page references"""
    project = await projects_collection.find_one({"project_id": project_id})
    
    if not project or not project.get("faiss_index_path"):
        raise HTTPException(status_code=400, detail="No PDF processed for this project")
    
    # Load FAISS index
    index = faiss.read_index(project["faiss_index_path"])
    chunks = project["chunks"]
    
    # Encode query
    query_embedding = embedder.encode([query])[0]
    
    # Search FAISS
    distances, indices = index.search(
        query_embedding.reshape(1, -1).astype('float32'), 
        top_k
    )
    
    results = []
    for idx, distance in zip(indices[0], distances[0]):
        chunk = chunks[idx]
        results.append({
            "text": chunk["text"],
            "page": chunk["page"],
            "relevance_score": float(1 / (1 + distance))
        })
    
    return results

async def chat_with_gemini(query: str, context_chunks: List[dict]):
    """Use Gemini to answer with context"""
    context = "\n\n".join([
        f"[Page {c['page']}]: {c['text']}" 
        for c in context_chunks
    ])
    
    prompt = f"""You are a helpful assistant analyzing a PDF document. Answer the user's question based on the provided context.

CONTEXT FROM PDF:
{context}

USER QUESTION: {query}

Instructions:
- Answer based on the context provided
- Cite page numbers when referencing information (e.g., "According to page 5...")
- If the context doesn't contain the answer, say so clearly
- Be concise but thorough

ANSWER:"""

    response = gemini_model.generate_content(prompt)
    return response.text

# ========== Podcast Generation ==========

async def generate_podcast_script(pdf_text: str, topic: Optional[str], duration: str):
    """Generate conversational podcast script"""
    duration_map = {
        "short": "3-5 minutes with 15-20 dialogue exchanges",
        "medium": "5-8 minutes with 30-40 dialogue exchanges",
        "long": "10-15 minutes with 60-80 dialogue exchanges"
    }
    
    max_chars = 100000
    
    if len(pdf_text) > max_chars:
        chunk_size = max_chars // 3
        text_sample = (
            pdf_text[:chunk_size] + 
            "\n\n[... middle section ...]\n\n" +
            pdf_text[len(pdf_text)//2 - chunk_size//2 : len(pdf_text)//2 + chunk_size//2] +
            "\n\n[... later section ...]\n\n" +
            pdf_text[-chunk_size:]
        )
        coverage_note = f"(Covering key sections from {len(pdf_text)} characters total)"
    else:
        text_sample = pdf_text
        coverage_note = "(Full document included)"
    
    prompt = f"""Create an engaging podcast script between two hosts discussing this ENTIRE document {coverage_note}.

DOCUMENT:
{text_sample}

PODCAST REQUIREMENTS:
- Duration: {duration_map[duration]}
- Host 1 (Alex): Curious, asks insightful questions, reacts naturally
- Host 2 (Sam): Knowledgeable, explains concepts clearly, uses analogies
{f'- Special focus on: {topic}' if topic else ''}
- COVER THE WHOLE DOCUMENT systematically from beginning to end
- Discuss all major topics, sections, and key points

STYLE GUIDELINES:
✓ Natural conversation with interruptions ("Oh!", "Wait, that's interesting!", "So you're saying...")
✓ Build on each other's points
✓ Use analogies and real-world examples
✓ Show enthusiasm and curiosity
✓ Ask clarifying questions
✓ Summarize key insights

FORMAT (STRICT):
Alex: [dialogue]
Sam: [dialogue]
Alex: [dialogue]
...

Make it feel like two friends excitedly discussing fascinating ideas from the ENTIRE document!"""

    response = gemini_model.generate_content(prompt)
    return response.text

def parse_podcast_script(script: str):
    """Parse script into speaker segments"""
    segments = []
    lines = script.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        match = re.match(r'^(Alex|Sam):\s*(.+)$', line, re.IGNORECASE)
        if match:
            speaker = match.group(1).lower()
            text = match.group(2).strip()
            
            text = re.sub(r'\[.*?\]', '', text)
            text = re.sub(r'\s+', ' ', text).strip()
            
            if text:
                segments.append({
                    "speaker": speaker,
                    "text": text,
                    "voice_id": CARTESIA_VOICE_ALEX if speaker == "alex" else CARTESIA_VOICE_SAM
                })
    
    return segments

async def generate_tts_cartesia(text: str, voice_id: str, output_path: str):
    """Generate speech using Cartesia Sonic-3 TTS"""
    try:
        chunk_iter = cartesia_client.tts.bytes(
            model_id="sonic-3",
            transcript=text,
            voice={
                "mode": "id",
                "id": voice_id,
            },
            output_format={
                "container": "wav",
                "sample_rate": 44100,
                "encoding": "pcm_s16le",
            },
        )
        
        with open(output_path, "wb") as f:
            for chunk in chunk_iter:
                f.write(chunk)
        
        return output_path
        
    except Exception as e:
        print(f"Cartesia TTS error: {e}")
        raise Exception(f"TTS generation failed: {str(e)}")

async def create_podcast(segments: List[dict], project_id: str):
    """Generate complete podcast audio"""
    audio_files = []
    
    for i, segment in enumerate(segments):
        temp_path = os.path.join(AUDIO_DIR, f"{project_id}_temp_{i}.wav")
        
        try:
            actual_path = await generate_tts_cartesia(
                text=segment["text"],
                voice_id=segment["voice_id"],
                output_path=temp_path
            )
            audio_files.append(actual_path)
        except Exception as e:
            print(f"TTS error for segment {i}: {e}")
            continue
    
    combined = AudioSegment.empty()
    pause = AudioSegment.silent(duration=500)
    
    for audio_file in audio_files:
        try:
            audio = AudioSegment.from_wav(audio_file)
            audio = audio.normalize()
            audio = audio.fade_in(duration=10).fade_out(duration=10)
            combined += audio + pause
        except Exception as e:
            print(f"Error loading audio {audio_file}: {e}")
    
    final_path = os.path.join(AUDIO_DIR, f"{project_id}_podcast.mp3")
    combined.export(
        final_path, 
        format="mp3", 
        bitrate="256k",
        parameters=["-q:a", "0"]
    )
    
    for temp_file in audio_files:
        try:
            os.remove(temp_file)
        except:
            pass
    
    return final_path

# ========== API ROUTES ==========

@app.post("/projects")
async def create_project(project: ProjectCreate):
    """Create a new project"""
    project_id = generate_project_id()
    
    project_data = {
        "project_id": project_id,
        "name": project.name,
        "description": project.description,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "pdf_filename": None,
        "pdf_path": None,
        "pdf_text": None,
        "chunks": [],
        "faiss_index_path": None,
        "podcasts": []
    }
    
    await projects_collection.insert_one(project_data)
    
    return {
        "status": "success",
        "project_id": project_id,
        "name": project.name
    }

@app.get("/projects")
async def get_projects():
    """Get all projects"""
    projects = []
    async for project in projects_collection.find():
        projects.append({
            "project_id": project["project_id"],
            "name": project["name"],
            "description": project["description"],
            "created_at": project["created_at"],
            "pdf_filename": project.get("pdf_filename"),
            "podcast_count": len(project.get("podcasts", []))
        })
    
    return {"projects": projects}

@app.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get project details"""
    project = await projects_collection.find_one({"project_id": project_id})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project["_id"] = str(project["_id"])
    return project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    project = await projects_collection.find_one({"project_id": project_id})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated files
    if project.get("pdf_path") and os.path.exists(project["pdf_path"]):
        os.remove(project["pdf_path"])
    
    if project.get("faiss_index_path") and os.path.exists(project["faiss_index_path"]):
        os.remove(project["faiss_index_path"])
    
    for podcast in project.get("podcasts", []):
        if os.path.exists(podcast["audio_path"]):
            os.remove(podcast["audio_path"])
    
    await projects_collection.delete_one({"project_id": project_id})
    
    return {"status": "success", "message": "Project deleted"}

@app.post("/projects/{project_id}/upload_pdf")
async def upload_pdf(project_id: str, file: UploadFile):
    """Upload and process PDF for a project"""
    project = await projects_collection.find_one({"project_id": project_id})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{project_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Extract text
    text = extract_text_from_pdf(file_path)
    
    # Build FAISS index
    index, chunks, embeddings = build_faiss_index(text)
    
    # Save FAISS index
    index_path = os.path.join(UPLOAD_DIR, f"{project_id}.faiss")
    faiss.write_index(index, index_path)
    
    # Update project
    await projects_collection.update_one(
        {"project_id": project_id},
        {
            "$set": {
                "pdf_filename": file.filename,
                "pdf_path": file_path,
                "pdf_text": text,
                "chunks": chunks,
                "faiss_index_path": index_path,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "status": "success",
        "filename": file.filename,
        "total_chunks": len(chunks),
        "total_pages": max(c["page"] for c in chunks),
        "word_count": len(text.split())
    }

@app.post("/chat")
async def chat(req: ChatRequest):
    """Chat with PDF"""
    try:
        relevant_chunks = await retrieve_with_references(req.project_id, req.query, req.top_k)
        answer = await chat_with_gemini(req.query, relevant_chunks)
        
        return {
            "answer": answer,
            "references": [
                {
                    "page": chunk["page"],
                    "text_preview": chunk["text"][:200] + "...",
                    "relevance": chunk["relevance_score"]
                }
                for chunk in relevant_chunks
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_podcast")
async def generate_podcast(req: PodcastRequest):
    """Generate podcast from PDF"""
    project = await projects_collection.find_one({"project_id": req.project_id})
    
    if not project or not project.get("pdf_text"):
        raise HTTPException(status_code=400, detail="Please upload PDF first")
    
    try:
        script = await generate_podcast_script(
            pdf_text=project["pdf_text"],
            topic=req.topic,
            duration=req.duration
        )
        
        segments = parse_podcast_script(script)
        
        if not segments:
            raise HTTPException(status_code=500, detail="Failed to parse script")
        
        podcast_path = await create_podcast(segments, req.project_id)
        
        # Save podcast info to project
        podcast_data = {
            "podcast_id": str(uuid.uuid4()),
            "created_at": datetime.utcnow(),
            "topic": req.topic,
            "duration": req.duration,
            "script": script,
            "audio_path": podcast_path,
            "audio_filename": os.path.basename(podcast_path),
            "segments_count": len(segments)
        }
        
        await projects_collection.update_one(
            {"project_id": req.project_id},
            {
                "$push": {"podcasts": podcast_data},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return {
            "status": "success",
            "podcast_id": podcast_data["podcast_id"],
            "podcast_url": f"/audio/{os.path.basename(podcast_path)}",
            "script": script,
            "segments_count": len(segments)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Podcast generation failed: {str(e)}")

@app.get("/projects/{project_id}/podcasts")
async def get_podcasts(project_id: str):
    """Get all podcasts for a project"""
    project = await projects_collection.find_one({"project_id": project_id})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"podcasts": project.get("podcasts", [])}

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve audio file"""
    path = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(path, media_type="audio/mpeg")

@app.get("/status")
async def status():
    """Check system status"""
    project_count = await projects_collection.count_documents({})
    
    return {
        "status": "online",
        "mongodb_connected": True,
        "project_count": project_count,
        "cartesia_configured": check_cartesia_setup()
    }

@app.get("/")
def home():
    return {
        "message": "PDF to Podcast API with MongoDB",
        "features": ["Project Management", "Chat with PDF", "Generate Podcast"],
        "endpoints": {
            "create_project": "POST /projects",
            "get_projects": "GET /projects",
            "upload": "POST /projects/{project_id}/upload_pdf",
            "chat": "POST /chat",
            "podcast": "POST /generate_podcast",
            "status": "GET /status"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)