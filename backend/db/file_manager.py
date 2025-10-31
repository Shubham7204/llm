"""
File management for uploads and audio outputs
"""
import os
from typing import Optional
import config


async def save_uploaded_pdf(file_content: bytes, project_id: str, filename: str) -> str:
    """Save uploaded PDF file"""
    file_path = os.path.join(config.UPLOAD_DIR, f"{project_id}_{filename}")
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    return file_path


def delete_pdf_file(file_path: str) -> bool:
    """Delete PDF file"""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception as e:
        print(f"Error deleting PDF: {e}")
    
    return False


def delete_faiss_index(index_path: str) -> bool:
    """Delete FAISS index file"""
    try:
        if index_path and os.path.exists(index_path):
            os.remove(index_path)
            return True
    except Exception as e:
        print(f"Error deleting FAISS index: {e}")
    
    return False


def delete_audio_file(audio_path: str) -> bool:
    """Delete audio file"""
    try:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
            return True
    except Exception as e:
        print(f"Error deleting audio: {e}")
    
    return False


async def cleanup_project_files(project: dict) -> None:
    """Delete all files associated with a project"""
    # Delete PDF
    if project.get("pdf_path"):
        delete_pdf_file(project["pdf_path"])
    
    # Delete FAISS index
    if project.get("faiss_index_path"):
        delete_faiss_index(project["faiss_index_path"])
    
    # Delete all podcast audio files
    for podcast in project.get("podcasts", []):
        if podcast.get("audio_path"):
            delete_audio_file(podcast["audio_path"])


def get_audio_path(filename: str) -> str:
    """Get full path for audio file"""
    return os.path.join(config.AUDIO_DIR, filename)


def audio_file_exists(filename: str) -> bool:
    """Check if audio file exists"""
    path = os.path.join(config.AUDIO_DIR, filename)
    return os.path.exists(path)


def get_faiss_index_path(project_id: str) -> str:
    """Get path for FAISS index file"""
    return os.path.join(config.UPLOAD_DIR, f"{project_id}.faiss")
