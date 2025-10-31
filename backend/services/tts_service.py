"""
Text-to-Speech service using Cartesia and audio merging with pydub
"""
import os
from typing import List, Dict
from pydub import AudioSegment
import config
from utils.text import parse_podcast_script


async def generate_speech(text: str, voice_id: str, output_path: str) -> str:
    """
    Generate speech audio using Cartesia TTS
    
    Args:
        text: Text to convert to speech
        voice_id: Cartesia voice ID
        output_path: Path to save audio file
        
    Returns:
        Path to generated audio file
    """
    try:
        # Generate audio chunks using Cartesia Sonic-3
        chunk_iter = config.cartesia_client.tts.bytes(
            model_id=config.TTS_MODEL,
            transcript=text,
            voice={
                "mode": "id",
                "id": voice_id,
            },
            output_format={
                "container": config.AUDIO_FORMAT,
                "sample_rate": config.SAMPLE_RATE,
                "encoding": config.AUDIO_ENCODING,
            },
        )
        
        # Write audio chunks to file
        with open(output_path, "wb") as f:
            for chunk in chunk_iter:
                f.write(chunk)
        
        return output_path
        
    except Exception as e:
        print(f"Cartesia TTS error: {e}")
        raise Exception(f"TTS generation failed: {str(e)}")


async def create_podcast_audio(script: str, project_id: str) -> tuple[str, int]:
    """
    Create complete podcast audio from script
    
    Args:
        script: Podcast script with Alex/Sam dialogue
        project_id: Project ID for temp files
        
    Returns:
        Tuple of (final_audio_path, segment_count)
    """
    # Parse script into segments
    segments = parse_podcast_script(script)
    
    if not segments:
        raise Exception("Failed to parse script into segments")
    
    # Generate audio for each segment
    audio_files = []
    
    for i, segment in enumerate(segments):
        temp_path = os.path.join(config.AUDIO_DIR, f"{project_id}_temp_{i}.wav")
        
        try:
            # Determine voice ID
            voice_id = (
                config.CARTESIA_VOICE_ALEX 
                if segment["speaker"] == "alex" 
                else config.CARTESIA_VOICE_SAM
            )
            
            # Generate TTS
            actual_path = await generate_speech(
                text=segment["text"],
                voice_id=voice_id,
                output_path=temp_path
            )
            audio_files.append(actual_path)
            
        except Exception as e:
            print(f"TTS error for segment {i}: {e}")
            continue
    
    # Merge audio files
    final_path = await merge_audio_segments(audio_files, project_id)
    
    # Cleanup temp files
    for temp_file in audio_files:
        try:
            os.remove(temp_file)
        except:
            pass
    
    return final_path, len(segments)


async def merge_audio_segments(audio_files: List[str], project_id: str) -> str:
    """
    Merge multiple audio segments into one podcast
    
    Args:
        audio_files: List of audio file paths to merge
        project_id: Project ID for output filename
        
    Returns:
        Path to final merged audio file
    """
    combined = AudioSegment.empty()
    pause = AudioSegment.silent(duration=config.PAUSE_DURATION_MS)
    
    for audio_file in audio_files:
        try:
            # Load audio
            audio = AudioSegment.from_wav(audio_file)
            
            # Normalize volume
            audio = audio.normalize()
            
            # Add fade in/out
            audio = audio.fade_in(
                duration=config.FADE_DURATION_MS
            ).fade_out(
                duration=config.FADE_DURATION_MS
            )
            
            # Add to combined with pause
            combined += audio + pause
            
        except Exception as e:
            print(f"Error loading audio {audio_file}: {e}")
    
    # Export final podcast
    final_path = os.path.join(config.AUDIO_DIR, f"{project_id}_podcast.mp3")
    combined.export(
        final_path,
        format="mp3",
        bitrate=config.EXPORT_BITRATE,
        parameters=["-q:a", "0"]
    )
    
    return final_path
