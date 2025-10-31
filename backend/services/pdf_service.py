"""
PDF text extraction and chunking service
"""
import fitz  # PyMuPDF
import re
from typing import List, Dict
from langchain.text_splitter import RecursiveCharacterTextSplitter
import config


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from PDF with page numbers
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        Extracted text with page markers
    """
    doc = fitz.open(file_path)
    text_with_pages = []
    
    for page_num, page in enumerate(doc, 1):
        page_text = page.get_text()
        text_with_pages.append(f"[PAGE {page_num}]\n{page_text}")
    
    doc.close()
    return "\n\n".join(text_with_pages)


def chunk_text(text: str) -> List[Dict[str, any]]:
    """
    Split text into chunks with metadata
    
    Args:
        text: Full text to chunk
        
    Returns:
        List of chunks with text and page number
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE,
        chunk_overlap=config.CHUNK_OVERLAP,
        separators=config.TEXT_SEPARATORS
    )
    
    chunks = []
    for chunk_text in splitter.split_text(text):
        # Extract page number from chunk
        page_match = re.search(r'\[PAGE (\d+)\]', chunk_text)
        page_num = int(page_match.group(1)) if page_match else 1
        
        # Remove page markers from actual text
        clean_text = re.sub(r'\[PAGE \d+\]', '', chunk_text).strip()
        
        chunks.append({
            "text": clean_text,
            "page": page_num
        })
    
    return chunks


async def process_pdf(file_path: str) -> tuple[str, List[Dict], int]:
    """
    Process PDF: extract text and create chunks
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        Tuple of (full_text, chunks, total_pages)
    """
    # Extract text
    full_text = extract_text_from_pdf(file_path)
    
    # Create chunks
    chunks = chunk_text(full_text)
    
    # Get total pages
    total_pages = max(c["page"] for c in chunks) if chunks else 0
    
    return full_text, chunks, total_pages
