"""
LLM service using Google Gemini for chat and podcast script generation
"""
from typing import List, Dict, Optional
import config


async def chat_with_context(query: str, context_chunks: List[Dict]) -> str:
    """
    Use Gemini to answer questions based on PDF context
    
    Args:
        query: User's question
        context_chunks: Relevant chunks from PDF with page numbers
        
    Returns:
        AI-generated answer
    """
    # Build context from chunks
    context = "\n\n".join([
        f"[Page {c['page']}]: {c['text']}" 
        for c in context_chunks
    ])
    
    prompt = f"""You are a helpful assistant analyzing a PDF document. Answer the user's question based on the provided context.

CONTEXT FROM PDF:
{context}

USER QUESTION: {query}

Instructions:
- Answer based on the context provided
- Cite page numbers when referencing information (e.g., "According to page 5...")
- If the context doesn't contain the answer, say so clearly
- Be concise but thorough

ANSWER:"""

    response = config.gemini_model.generate_content(prompt)
    return response.text


async def generate_podcast_script(
    pdf_text: str,
    topic: Optional[str],
    duration: str
) -> str:
    """
    Generate conversational podcast script from PDF content
    
    Args:
        pdf_text: Full text from PDF
        topic: Optional specific topic to focus on
        duration: Podcast duration (short/medium/long)
        
    Returns:
        Generated podcast script
    """
    # Get duration description
    duration_desc = config.DURATION_MAP[duration]
    
    # Truncate text if too long
    if len(pdf_text) > config.MAX_CONTEXT_CHARS:
        chunk_size = config.MAX_CONTEXT_CHARS // 3
        text_sample = (
            pdf_text[:chunk_size] + 
            "\n\n[... middle section ...]\n\n" +
            pdf_text[len(pdf_text)//2 - chunk_size//2 : len(pdf_text)//2 + chunk_size//2] +
            "\n\n[... later section ...]\n\n" +
            pdf_text[-chunk_size:]
        )
        coverage_note = f"(Covering key sections from {len(pdf_text)} characters total)"
    else:
        text_sample = pdf_text
        coverage_note = "(Full document included)"
    
    # Build prompt
    prompt = f"""Create an engaging podcast script between two hosts discussing this ENTIRE document {coverage_note}.

DOCUMENT:
{text_sample}

PODCAST REQUIREMENTS:
- Duration: {duration_desc}
- Host 1 (Alex): Curious, asks insightful questions, reacts naturally
- Host 2 (Sam): Knowledgeable, explains concepts clearly, uses analogies
{f'- Special focus on: {topic}' if topic else ''}
- COVER THE WHOLE DOCUMENT systematically from beginning to end
- Discuss all major topics, sections, and key points

STYLE GUIDELINES:
✓ Natural conversation with interruptions ("Oh!", "Wait, that's interesting!", "So you're saying...")
✓ Build on each other's points
✓ Use analogies and real-world examples
✓ Show enthusiasm and curiosity
✓ Ask clarifying questions
✓ Summarize key insights

FORMAT (STRICT):
Alex: [dialogue]
Sam: [dialogue]
Alex: [dialogue]
...

Make it feel like two friends excitedly discussing fascinating ideas from the ENTIRE document!"""

    response = config.gemini_model.generate_content(prompt)
    return response.text
