"""
MongoDB connection and CRUD operations
"""
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import Optional, List, Dict, Any
import config

# MongoDB client (singleton pattern)
_mongo_client: Optional[AsyncIOMotorClient] = None
_db = None
_projects_collection = None


def get_mongo_client():
    """Get or create MongoDB client"""
    global _mongo_client, _db, _projects_collection
    
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(config.MONGO_URL)
        _db = _mongo_client[config.DATABASE_NAME]
        _projects_collection = _db[config.COLLECTION_NAME]
    
    return _mongo_client


def get_projects_collection():
    """Get projects collection"""
    get_mongo_client()  # Ensure initialized
    return _projects_collection


async def create_project(project_id: str, name: str, description: str = ""):
    """Create a new project in database"""
    collection = get_projects_collection()
    
    project_data = {
        "project_id": project_id,
        "name": name,
        "description": description,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "pdf_filename": None,
        "pdf_path": None,
        "pdf_text": None,
        "chunks": [],
        "faiss_index_path": None,
        "podcasts": []
    }
    
    await collection.insert_one(project_data)
    return project_data


async def get_all_projects():
    """Get all projects"""
    collection = get_projects_collection()
    projects = []
    
    async for project in collection.find():
        projects.append({
            "project_id": project["project_id"],
            "name": project["name"],
            "description": project["description"],
            "created_at": project["created_at"],
            "pdf_filename": project.get("pdf_filename"),
            "podcast_count": len(project.get("podcasts", []))
        })
    
    return projects


async def get_project(project_id: str):
    """Get a single project by ID"""
    collection = get_projects_collection()
    project = await collection.find_one({"project_id": project_id})
    
    if project:
        project["_id"] = str(project["_id"])
    
    return project


async def update_project_pdf(
    project_id: str,
    pdf_filename: str,
    pdf_path: str,
    pdf_text: str,
    chunks: List[Dict],
    faiss_index_path: str
):
    """Update project with PDF processing results"""
    collection = get_projects_collection()
    
    await collection.update_one(
        {"project_id": project_id},
        {
            "$set": {
                "pdf_filename": pdf_filename,
                "pdf_path": pdf_path,
                "pdf_text": pdf_text,
                "chunks": chunks,
                "faiss_index_path": faiss_index_path,
                "updated_at": datetime.utcnow()
            }
        }
    )


async def add_podcast_to_project(project_id: str, podcast_data: Dict[str, Any]):
    """Add a podcast to project"""
    collection = get_projects_collection()
    
    await collection.update_one(
        {"project_id": project_id},
        {
            "$push": {"podcasts": podcast_data},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )


async def delete_project(project_id: str):
    """Delete a project"""
    collection = get_projects_collection()
    project = await get_project(project_id)
    
    if project:
        await collection.delete_one({"project_id": project_id})
        return project
    
    return None


async def get_project_count():
    """Get total number of projects"""
    collection = get_projects_collection()
    return await collection.count_documents({})


async def check_connection():
    """Check if MongoDB connection is working"""
    try:
        client = get_mongo_client()
        await client.admin.command('ping')
        return True
    except Exception:
        return False
