import os
import whisper
import openai

# Default API Key from default credentials (leave blank for local-only)
DEFAULT_OPENAI_KEY = ""

# Cache for local Whisper model to prevent reloading on every run
_WHISPER_MODEL = None

def get_local_whisper_model(model_size="tiny"):
    """
    Loads and caches the local Whisper model.
    'tiny' is extremely fast and light on local CPUs.
    """
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        # Load whisper model (will download to ~/.cache/whisper if not present)
        _WHISPER_MODEL = whisper.load_model(model_size)
    return _WHISPER_MODEL

def transcribe_speech(audio_path, provider="Local", api_key=""):
    """
    Transcribes audio path to text.
    Supports:
    - "Local": runs Whisper package locally.
    - "OpenAI": runs Whisper API (requires valid API key).
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
    if provider == "OpenAI":
        # Check for API key override or use default
        key = api_key if api_key.strip() else DEFAULT_OPENAI_KEY
        if not key:
            # Fall back to local if no API key is available
            provider = "Local"
            
    if provider == "OpenAI":
        try:
            client = openai.OpenAI(api_key=key)
            with open(audio_path, "rb") as audio_file:
                transcript_response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            return transcript_response.strip()
        except Exception as e:
            print(f"OpenAI transcription API failed: {e}. Falling back to Local Whisper.")
            # Fallback to local
            provider = "Local"

    # Local Whisper processing
    try:
        import soundfile as sf
        import numpy as np
        import librosa
        
        try:
            # Try to read natively using soundfile to avoid ffmpeg dependency
            audio_data, sr = sf.read(audio_path)
            if len(audio_data.shape) > 1:
                audio_data = np.mean(audio_data, axis=1) # Convert to mono
            audio_data = audio_data.astype(np.float32)
            
            # Whisper expects 16000Hz audio
            if sr != 16000:
                audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=16000)
                
            model = get_local_whisper_model("tiny")
            result = model.transcribe(audio_data, fp16=False)
            return result.get("text", "").strip()
        except Exception as read_err:
            print(f"Direct array loading failed: {read_err}. Falling back to default whisper path load.")
            model = get_local_whisper_model("tiny")
            result = model.transcribe(audio_path, fp16=False)
            return result.get("text", "").strip()
    except Exception as e:
        print(f"Local Whisper transcription failed: {e}")
        # Return fallback text
        raise RuntimeError(f"Transcription failed: {e}")
