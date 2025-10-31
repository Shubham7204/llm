import os
from cartesia import Cartesia

# Initialize Cartesia client
client = Cartesia(api_key=os.getenv("CARTESIA_API_KEY", ""))

print("Fetching available Cartesia voices...\n")

output_file = "available_voices.txt"

try:
    # List all available voices
    voices = client.voices.list()
    
    # Prepare output
    output_lines = []
    output_lines.append("Available Cartesia Voices (English only)\n")
    output_lines.append("=" * 80 + "\n")
    
    count = 0
    # Filter for English voices suitable for podcasts
    for voice in voices:
        # Only show public voices in English
        if hasattr(voice, 'is_public') and voice.is_public and hasattr(voice, 'language') and voice.language == 'en':
            count += 1
            output_lines.append(f"\n[{count}] Name: {voice.name}\n")
            output_lines.append(f"    ID: {voice.id}\n")
            output_lines.append(f"    Description: {voice.description}\n")
            output_lines.append("-" * 80 + "\n")
            
            # Also print to console
            print(f"[{count}] {voice.name}")
    
    # Add summary
    summary = f"\n\nFound {count} English voices\n\nTo use a voice, copy its ID and update main.py:\nCARTESIA_VOICE_ALEX = 'paste-id-here'\nCARTESIA_VOICE_SAM = 'paste-id-here'\n"
    output_lines.append(summary)
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)
    
    print(f"\n✅ Saved {count} voices to: {output_file}")
    print("\nTo use a voice, copy its ID from the file and update main.py:")
    print("CARTESIA_VOICE_ALEX = 'paste-id-here'")
    print("CARTESIA_VOICE_SAM = 'paste-id-here'")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    print("\nMake sure CARTESIA_API_KEY is set correctly!")
    print("Get your API key from: https://cartesia.ai/console")