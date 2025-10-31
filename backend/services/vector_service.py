"""
FAISS vector store service for semantic search
"""
import faiss
import numpy as np
from typing import List, Dict
import config
from db.file_manager import get_faiss_index_path


def build_faiss_index(chunks: List[Dict[str, any]]) -> tuple[faiss.Index, np.ndarray]:
    """
    Build FAISS index from text chunks
    
    Args:
        chunks: List of chunks with 'text' field
        
    Returns:
        Tuple of (faiss_index, embeddings)
    """
    # Extract text from chunks
    chunk_texts = [c["text"] for c in chunks]
    
    # Generate embeddings
    embeddings = config.embedder.encode(chunk_texts, show_progress_bar=True)
    
    # Create FAISS index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype('float32'))
    
    return index, embeddings


def save_faiss_index(index: faiss.Index, project_id: str) -> str:
    """
    Save FAISS index to disk
    
    Args:
        index: FAISS index to save
        project_id: Project ID for filename
        
    Returns:
        Path where index was saved
    """
    index_path = get_faiss_index_path(project_id)
    faiss.write_index(index, index_path)
    return index_path


def load_faiss_index(index_path: str) -> faiss.Index:
    """
    Load FAISS index from disk
    
    Args:
        index_path: Path to saved index
        
    Returns:
        Loaded FAISS index
    """
    return faiss.read_index(index_path)


def search_similar_chunks(
    index: faiss.Index,
    chunks: List[Dict[str, any]],
    query: str,
    top_k: int = 3
) -> List[Dict[str, any]]:
    """
    Search for similar chunks using FAISS
    
    Args:
        index: FAISS index
        chunks: Original chunks with metadata
        query: Search query
        top_k: Number of results to return
        
    Returns:
        List of relevant chunks with relevance scores
    """
    # Encode query
    query_embedding = config.embedder.encode([query])[0]
    
    # Search FAISS
    distances, indices = index.search(
        query_embedding.reshape(1, -1).astype('float32'),
        top_k
    )
    
    # Build results with relevance scores
    results = []
    for idx, distance in zip(indices[0], distances[0]):
        chunk = chunks[idx]
        results.append({
            "text": chunk["text"],
            "page": chunk["page"],
            "relevance_score": float(1 / (1 + distance))  # Convert distance to similarity
        })
    
    return results
