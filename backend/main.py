"""
PDF to Podcast - Main FastAPI Application
Minimal entry point with route registration
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import config
from db import mongodb, file_manager
from routes import project_router, chat_router, podcast_router


# Initialize FastAPI app
app = FastAPI(
    title="PDF to Podcast API",
    description="Convert PDFs to podcasts with RAG-powered chat",
    version="2.0.0"
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(project_router)
app.include_router(chat_router)
app.include_router(podcast_router)


@app.get("/")
def home():
    """API home endpoint"""
    return {
        "message": "PDF to Podcast API with MongoDB",
        "version": "2.0.0",
        "features": [
            "Project Management",
            "Chat with PDF (RAG)",
            "Generate Podcast",
            "PDF Viewer"
        ],
        "endpoints": {
            "create_project": "POST /projects",
            "get_projects": "GET /projects",
            "upload_pdf": "POST /projects/{project_id}/upload_pdf",
            "chat": "POST /chat",
            "generate_podcast": "POST /generate_podcast",
            "get_audio": "GET /audio/{filename}",
            "get_pdf": "GET /pdf/{filename}",
            "status": "GET /status"
        }
    }


@app.get("/status")
async def status():
    """Check system status"""
    project_count = await mongodb.get_project_count()
    mongodb_connected = await mongodb.check_connection()
    
    return {
        "status": "online",
        "mongodb_connected": mongodb_connected,
        "project_count": project_count,
        "cartesia_configured": config.check_cartesia_setup(),
        "gemini_configured": config.check_gemini_setup()
    }


@app.get("/pdf/{filename}")
async def get_pdf(filename: str):
    """Serve PDF file"""
    path = file_manager.get_pdf_path(filename)
    
    if not file_manager.pdf_file_exists(filename):
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return FileResponse(path, media_type="application/pdf")
