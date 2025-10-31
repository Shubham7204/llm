"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectCreate(BaseModel):
    """Request model for creating a new project"""
    name: str
    description: Optional[str] = ""


class ChatRequest(BaseModel):
    """Request model for chat with PDF"""
    project_id: str
    query: str
    top_k: int = 3


class PodcastRequest(BaseModel):
    """Request model for generating podcast"""
    project_id: str
    topic: Optional[str] = None
    duration: str = "medium"


class ChatResponse(BaseModel):
    """Response model for chat"""
    answer: str
    references: List[dict]


class PodcastResponse(BaseModel):
    """Response model for podcast generation"""
    status: str
    podcast_id: str
    podcast_url: str
    script: str
    segments_count: int


class ProjectResponse(BaseModel):
    """Response model for project details"""
    project_id: str
    name: str
    description: str
    created_at: datetime
    pdf_filename: Optional[str]
    podcast_count: int


class PDFUploadResponse(BaseModel):
    """Response model for PDF upload"""
    status: str
    filename: str
    total_chunks: int
    total_pages: int
    word_count: int


class StatusResponse(BaseModel):
    """Response model for system status"""
    status: str
    mongodb_connected: bool
    project_count: int
    cartesia_configured: bool
