"""
ID generation utilities
"""
import uuid
import hashlib


def generate_project_id() -> str:
    """
    Generate unique project ID
    
    Returns:
        Unique project ID string
    """
    return f"project_{hashlib.md5(str(uuid.uuid4()).encode()).hexdigest()}"


def generate_podcast_id() -> str:
    """
    Generate unique podcast ID
    
    Returns:
        Unique podcast ID string
    """
    return str(uuid.uuid4())
