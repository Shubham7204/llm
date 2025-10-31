"""
Routes initialization
"""
from .project_routes import router as project_router
from .chat_routes import router as chat_router
from .podcast_routes import router as podcast_router

__all__ = ['project_router', 'chat_router', 'podcast_router']
