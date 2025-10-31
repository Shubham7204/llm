"""
Configuration for PDF to Podcast Application
All API keys, paths, and model initialization
"""
import os
from dotenv import load_dotenv

# Load .env file FIRST before importing anything else
load_dotenv()

from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from cartesia import Cartesia

# ========== Directories ==========
UPLOAD_DIR = "uploads"
AUDIO_DIR = "outputs"

# Create directories if they don't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

# ========== Database ==========
MONGO_URL = "mongodb://localhost:27017"
DATABASE_NAME = "pdf_podcast_db"
COLLECTION_NAME = "projects"

# ========== API Configuration ==========
# Load API keys from environment
CANDIDATE_KEYS = [
    os.getenv("GOOGLE_API_KEY"),
    os.getenv("GEMINI_API_KEY"),
    os.getenv("GENAI_API_KEY"),
    os.getenv("GOOGLE_API_KEY_JSON"),
]

# Pick the first non-empty key
GEMINI_API_KEY = next((k for k in CANDIDATE_KEYS if k and len(k) > 0), "")
CARTESIA_API_KEY = os.getenv("CARTESIA_API_KEY", "")

# ========== AI Models ==========
# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    # Leave unconfigured; API calls will surface clear errors
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

# Default model (will error later if not configured)
gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Embedding model for semantic search
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Configure Cartesia TTS client
cartesia_client = Cartesia(api_key=CARTESIA_API_KEY)

# ========== Voice Configuration ==========
# Cartesia Voice IDs
CARTESIA_VOICE_ALEX = "6ccbfb76-1fc6-48f7-b71d-91ac6298247b"
CARTESIA_VOICE_SAM = "00967b2f-88a6-4a31-8153-110a92134b9f"

# ========== Text Processing ==========
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
TEXT_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

# ========== Podcast Settings ==========
DURATION_MAP = {
    "short": "3-5 minutes with 15-20 dialogue exchanges",
    "medium": "5-8 minutes with 30-40 dialogue exchanges",
    "long": "10-15 minutes with 60-80 dialogue exchanges"
}

# Maximum characters for LLM context
MAX_CONTEXT_CHARS = 100000

# ========== Audio Settings ==========
TTS_MODEL = "sonic-3"
SAMPLE_RATE = 44100
AUDIO_ENCODING = "pcm_s16le"
AUDIO_FORMAT = "wav"
EXPORT_BITRATE = "256k"
PAUSE_DURATION_MS = 500  # Pause between segments
FADE_DURATION_MS = 10     # Fade in/out duration

# ========== CORS Configuration ==========
ALLOWED_ORIGINS = ["http://localhost:3000"]

# ========== Helper Functions ==========
def check_cartesia_setup():
    """Check if Cartesia API is configured"""
    return bool(CARTESIA_API_KEY)

def check_gemini_setup():
    """Check if Gemini API is configured"""
    return bool(GEMINI_API_KEY)
