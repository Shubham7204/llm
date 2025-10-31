"""
Podcast generation routes
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from models import PodcastRequest
from db import mongodb, file_manager
from services import llm_service, tts_service
from utils.id_generator import generate_podcast_id
from datetime import datetime
import os

router = APIRouter(tags=["Podcast"])


@router.post("/generate_podcast")
async def generate_podcast(req: PodcastRequest):
    """Generate podcast from PDF content"""
    # Get project
    project = await mongodb.get_project(req.project_id)
    
    if not project or not project.get("pdf_text"):
        raise HTTPException(
            status_code=400,
            detail="Please upload PDF first"
        )
    
    try:
        # Generate script using LLM
        script = await llm_service.generate_podcast_script(
            pdf_text=project["pdf_text"],
            topic=req.topic,
            duration=req.duration
        )
        
        # Generate audio from script
        podcast_path, segments_count = await tts_service.create_podcast_audio(
            script=script,
            project_id=req.project_id
        )
        
        # Create podcast metadata
        podcast_data = {
            "podcast_id": generate_podcast_id(),
            "created_at": datetime.utcnow(),
            "topic": req.topic,
            "duration": req.duration,
            "script": script,
            "audio_path": podcast_path,
            "audio_filename": os.path.basename(podcast_path),
            "segments_count": segments_count
        }
        
        # Save podcast to project
        await mongodb.add_podcast_to_project(req.project_id, podcast_data)
        
        return {
            "status": "success",
            "podcast_id": podcast_data["podcast_id"],
            "podcast_url": f"/audio/{os.path.basename(podcast_path)}",
            "script": script,
            "segments_count": segments_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Podcast generation failed: {str(e)}"
        )


@router.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve audio file"""
    path = file_manager.get_audio_path(filename)
    
    if not file_manager.audio_file_exists(filename):
        raise HTTPException(status_code=404, detail="Audio not found")
    
    return FileResponse(path, media_type="audio/mpeg")
