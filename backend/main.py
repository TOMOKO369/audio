from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import speech
from google.oauth2 import service_account
from dotenv import load_dotenv
import json
import io
import os

# Load environment variables
load_dotenv()

app = FastAPI()

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_credentials(json_str: str = None):
    """
    Resolve credentials in the following order:
    1. Direct JSON string provided by frontend (highest priority for user override)
    2. GOOGLE_APPLICATION_CREDENTIALS_JSON env var (raw JSON string)
    3. GOOGLE_APPLICATION_CREDENTIALS env var (path to file) - handled by default Google libs if we pass nothing,
       but here we want explicit control or validation.
    """
    # 1. Frontend provided string
    if json_str and json_str.strip():
        try:
            creds_dict = json.loads(json_str)
            return service_account.Credentials.from_service_account_info(creds_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON in settings: {str(e)}")

    # 2. Env var with raw JSON
    env_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if env_json and env_json.strip():
        try:
            creds_dict = json.loads(env_json)
            return service_account.Credentials.from_service_account_info(creds_dict)
        except Exception as e:
            print(f"Server-side credentials error: {e}")
            # Fallthrough

    # 3. Standard Google Env Var (Path)
    # If GOOGLE_APPLICATION_CREDENTIALS is set, returning None causes Client to use default search path.
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        return None # Let Google Client Library find it

    # If we reached here, we have no credentials
    return None

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    credentials_json: str = Form(None) # Made optional
):
    try:
        credentials = get_credentials(credentials_json)
        
        # If credentials is None, it might mean we rely on ADP (Application Default Credentials)
        # We try to instantiate client. If it fails, we know we lack auth.
        try:
            if credentials:
                client = speech.SpeechClient(credentials=credentials)
            else:
                client = speech.SpeechClient() # Looks for GOOGLE_APPLICATION_CREDENTIALS or default auth
        except Exception as e:
            raise HTTPException(status_code=401, detail="Authentication failed. Please check server logs or provide credentials.")

        # Read file content
        content = await file.read()
        
        audio = speech.RecognitionAudio(content=content)
        
        config = speech.RecognitionConfig(
            language_code="ja-JP",
            enable_automatic_punctuation=True,
        )

        filename = file.filename.lower()
        if filename.endswith(".mp3"):
             config.encoding = speech.RecognitionConfig.AudioEncoding.MP3
             config.sample_rate_hertz = 16000
        elif filename.endswith(".wav"):
             config.encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16

        response = client.recognize(config=config, audio=audio)

        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + "\n"

        return {"transcript": transcript}

    except Exception as e:
        print(f"Error: {e}")
        # Return generic error if not already HTTP exception
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
