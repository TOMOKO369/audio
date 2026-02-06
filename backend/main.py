from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import speech
from google.oauth2 import service_account
import json
import io
import os

app = FastAPI()

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    credentials_json: str = Form(...)
):
    try:
        # Load credentials from JSON string
        try:
            creds_dict = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(creds_dict)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON credentials format")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error loading credentials: {str(e)}")

        # Create Speech Client with credentials
        client = speech.SpeechClient(credentials=credentials)

        # Read file content
        content = await file.read()
        
        # Audio configuration
        # Detect standard formats based on extension or content-type could be done here
        # For now, default to linear16 or mp3 handling if possible, or just AUTO
        # Google Speech API handles some formats automatically, but often requires configuration
        
        audio = speech.RecognitionAudio(content=content)
        
        # Determine encoding roughly (Enhancement: pass config from details)
        # Note: MP3 support is in v1p1beta1 or v1 standard with specific config.
        # We will try default configuration.
        
        config = speech.RecognitionConfig(
            language_code="ja-JP", # Defaulting to Japanese as per request context
            enable_automatic_punctuation=True,
        )

        # Detect if it's MP3/WAV to set encoding if necessary
        # Simplified: Just try to recognize.
        
        # For robust MP3 support, we might need to specify encoding=speech.RecognitionConfig.AudioEncoding.MP3
        # if the file is definitely mp3.
        
        filename = file.filename.lower()
        if filename.endswith(".mp3"):
             config.encoding = speech.RecognitionConfig.AudioEncoding.MP3
             config.sample_rate_hertz = 16000 # Common default, but might need adjustment or removal to let API detect
        elif filename.endswith(".wav"):
             config.encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
             # Wav header usually handles it, or linear16
        
        # To strictly support MP3 and WAV without converting, we rely on the API features.
        # If encoding is unspecified, it might fail for RAW info, but for WAV it's often fine.
        
        response = client.recognize(config=config, audio=audio)

        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + "\n"

        return {"transcript": transcript}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
