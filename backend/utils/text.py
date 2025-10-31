"""
Text processing utilities
"""
import re
from typing import List, Dict
import config


def parse_podcast_script(script: str) -> List[Dict[str, str]]:
    """
    Parse podcast script into speaker segments
    
    Args:
        script: Raw script text with Alex/Sam dialogue
        
    Returns:
        List of segments with speaker and text
    """
    segments = []
    lines = script.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Match pattern: "Alex: text" or "Sam: text"
        match = re.match(r'^(Alex|Sam):\s*(.+)$', line, re.IGNORECASE)
        if match:
            speaker = match.group(1).lower()
            text = match.group(2).strip()
            
            # Remove stage directions in brackets
            text = re.sub(r'\[.*?\]', '', text)
            
            # Clean up whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            
            if text:
                segments.append({
                    "speaker": speaker,
                    "text": text
                })
    
    return segments


def clean_text(text: str) -> str:
    """
    Clean text by removing extra whitespace and special characters
    
    Args:
        text: Raw text
        
    Returns:
        Cleaned text
    """
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    return text


def truncate_text(text: str, max_length: int = 200, suffix: str = "...") -> str:
    """
    Truncate text to maximum length
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add when truncated
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length] + suffix


def extract_page_number(text: str) -> int:
    """
    Extract page number from text with [PAGE X] marker
    
    Args:
        text: Text with page marker
        
    Returns:
        Page number or 1 if not found
    """
    match = re.search(r'\[PAGE (\d+)\]', text)
    return int(match.group(1)) if match else 1


def remove_page_markers(text: str) -> str:
    """
    Remove [PAGE X] markers from text
    
    Args:
        text: Text with page markers
        
    Returns:
        Text without markers
    """
    return re.sub(r'\[PAGE \d+\]', '', text).strip()
