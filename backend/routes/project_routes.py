"""
Project management routes
"""
from fastapi import APIRouter, UploadFile, HTTPException
from models import ProjectCreate
from db import mongodb, file_manager
from services import pdf_service, vector_service
from utils.id_generator import generate_project_id

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("")
async def create_project(project: ProjectCreate):
    """Create a new project"""
    project_id = generate_project_id()
    
    await mongodb.create_project(
        project_id=project_id,
        name=project.name,
        description=project.description
    )
    
    return {
        "status": "success",
        "project_id": project_id,
        "name": project.name
    }


@router.get("")
async def get_projects():
    """Get all projects"""
    projects = await mongodb.get_all_projects()
    return {"projects": projects}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get project details"""
    project = await mongodb.get_project(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    project = await mongodb.delete_project(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated files
    await file_manager.cleanup_project_files(project)
    
    return {"status": "success", "message": "Project deleted"}


@router.post("/{project_id}/upload_pdf")
async def upload_pdf(project_id: str, file: UploadFile):
    """Upload and process PDF for a project"""
    project = await mongodb.get_project(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Save uploaded file
    file_content = await file.read()
    file_path = await file_manager.save_uploaded_pdf(
        file_content=file_content,
        project_id=project_id,
        filename=file.filename
    )
    
    # Process PDF
    full_text, chunks, total_pages = await pdf_service.process_pdf(file_path)
    
    # Build FAISS index
    index, embeddings = vector_service.build_faiss_index(chunks)
    
    # Save FAISS index
    index_path = vector_service.save_faiss_index(index, project_id)
    
    # Update project in database
    await mongodb.update_project_pdf(
        project_id=project_id,
        pdf_filename=file.filename,
        pdf_path=file_path,
        pdf_text=full_text,
        chunks=chunks,
        faiss_index_path=index_path
    )
    
    return {
        "status": "success",
        "filename": file.filename,
        "total_chunks": len(chunks),
        "total_pages": total_pages,
        "word_count": len(full_text.split())
    }


@router.get("/{project_id}/podcasts")
async def get_podcasts(project_id: str):
    """Get all podcasts for a project"""
    project = await mongodb.get_project(project_id)
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"podcasts": project.get("podcasts", [])}
