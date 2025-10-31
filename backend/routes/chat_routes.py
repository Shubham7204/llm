"""
Chat routes for interacting with PDF content
"""
from fastapi import APIRouter, HTTPException
from models import ChatRequest
from db import mongodb
from services import vector_service, llm_service

router = APIRouter(tags=["Chat"])


@router.post("/chat")
async def chat_with_pdf(req: ChatRequest):
    """
    Chat with PDF using RAG (Retrieval Augmented Generation)
    """
    try:
        # Get project
        project = await mongodb.get_project(req.project_id)
        
        if not project or not project.get("faiss_index_path"):
            raise HTTPException(
                status_code=400,
                detail="No PDF processed for this project"
            )
        
        # Load FAISS index
        index = vector_service.load_faiss_index(project["faiss_index_path"])
        chunks = project["chunks"]
        
        # Search for relevant chunks
        relevant_chunks = vector_service.search_similar_chunks(
            index=index,
            chunks=chunks,
            query=req.query,
            top_k=req.top_k
        )
        
        # Generate answer using LLM
        answer = await llm_service.chat_with_context(
            query=req.query,
            context_chunks=relevant_chunks
        )
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
