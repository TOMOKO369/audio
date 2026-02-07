from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import whisper
import os
import tempfile
import shutil
import sys

# --- CONFIGURATION & SETUP ---

# Explicitly add FFmpeg to PATH for Windows if not found
# The path discovered previously:
ffmpeg_path_dir = r"C:\Users\minib\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin"
if os.path.exists(ffmpeg_path_dir):
    os.environ["PATH"] += os.pathsep + ffmpeg_path_dir
    print(f"Added FFmpeg to PATH: {ffmpeg_path_dir}")
else:
    print("Warning: Hardcoded FFmpeg path not found.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
current_model_name = "base"
model = None

def load_verification_model(name: str):
    global model, current_model_name
    print(f"Loading Whisper model '{name}'...")
    try:
        model = whisper.load_model(name)
        current_model_name = name
        print(f"Whisper model '{name}' loaded successfully.")
    except Exception as e:
        print(f"CRITICAL ERROR loading model: {e}")
        raise e

# Initial load
try:
    load_verification_model(current_model_name)
except:
    pass # Will be handled in request if needed

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    model_size: str = Form("base"),
    language: str = Form(None)
):
    global model, current_model_name
    
    print(f"Received transcription request for file: {file.filename} | Model: {model_size} | Lang: {language}")
    
    # Reload model if needed
    if model is None or model_size != current_model_name:
        try:
            load_verification_model(model_size)
        except Exception as e:
             raise HTTPException(status_code=500, detail=f"Failed to load model {model_size}: {str(e)}")

    tmp_path = None
    try:
        # Save uploaded file
        suffix = os.path.splitext(file.filename)[1]
        if not suffix:
            suffix = ".tmp"
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        print(f"File saved temporarily at: {tmp_path}")
        
        # Check size
        fsize = os.path.getsize(tmp_path)
        print(f"File size: {fsize / 1024 / 1024:.2f} MB")

        # Run transcription
        print("Starting Whisper transcription... (This may take time)")
        
        options = {"fp16": False}
        if language and language != "auto":
            options["language"] = language
            
        result = model.transcribe(tmp_path, **options)
        print("Transcription complete.")
        
        transcript = result["text"]
        return {"transcript": transcript}
            
    except Exception as e:
        print(f"Error during transcription: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")
        
    finally:
        # Clean up
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except:
                pass


from pydantic import BaseModel
from openai import OpenAI
import json

class GenerationRequest(BaseModel):
    transcript: str
    api_key: str = None
    base_url: str = None
    model: str = "gpt-3.5-turbo"


@app.post("/refine_text")
async def refine_text(request: GenerationRequest):
    print(f"Received refine request for model: {request.model}")
    
    # Validation (Reuse logic)
    api_key = request.api_key or os.environ.get("OPENAI_API_KEY")
    base_url = request.base_url or os.environ.get("OPENAI_BASE_URL")
    
    if not api_key and not base_url:
         raise HTTPException(status_code=400, detail="API Key or Base URL required.")
    
    if not api_key: api_key = "dummy"

    try:
        client = OpenAI(api_key=api_key, base_url=base_url)
        
        system_prompt = """
        You are a helpful editor. Your task is to rewrite the provided text to be softer, more polite, and conversational in Japanese.
        
        Tone guidelines:
        - Use "〜ですよね (desu-yone)", "〜だと思うんです (to omou-n-desu)", "〜ます (masu)" style.
        - Make it sound like a friendly, empathetic person talking.
        - Avoid stiff or academic language.
        - Keep the original meaning but improve readability.
        - Output ONLY the rewritten text.
        """
        
        user_prompt = f"Rewrite this text:\n\n{request.transcript[:15000]}"
        
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        
        refined_text = response.choices[0].message.content
        return {"refined_text": refined_text}
            
    except Exception as e:
        print(f"Error during refinement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_note")
async def generate_note(request: GenerationRequest):
    print(f"Received generation request for model: {request.model}")
    
    # Validation
    api_key = request.api_key or os.environ.get("OPENAI_API_KEY")
    base_url = request.base_url or os.environ.get("OPENAI_BASE_URL")
    
    # If no API key provided and not using a local endpoint that might not need one (like some local setups),
    # we should check. But some local servers (like Ollama) don't strictly require a key, or use "gsk_..." etc.
    # We will try to proceed if base_url is set, otherwise require key.
    if not api_key and not base_url:
         # Check if using a local model that might not need a key, otherwise warn
         # For simplicity, if no key and no base_url, we can't hit OpenAI.
         raise HTTPException(status_code=400, detail="API Key is required for OpenAI, or Base URL for local models.")
    
    if not api_key: 
        api_key = "dummy" # Some local servers need a non-empty string
        
    try:
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        system_prompt = """
        You are a professional editor for the Japanese media platform 'note'.
        Your task is to take the provided text and structure it into a perfect Note article.
        
        Rules:
        1. Create a catchy Title based on the content.
        2. Create a well-structured Body with headings (##), bullet points, and clear paragraphs.
        3. The content must be in Japanese.
        4. Maintain the soft, friendly tone ("〜ですよね", "〜ます") of the input text.
        5. IMPORTANT: Output strictly valid JSON with keys: "title" and "content".
        6. Do not include markdown code blocks (```json) in the response, just the raw JSON string.
        """
        
        user_prompt = f"Here is the text to format into a Note article:\n\n{request.transcript[:15000]}" # Truncate if too long
        
        # Checking if it's likely a local model that might not support JSON mode
        is_local = "localhost" in (base_url or "") or "127.0.0.1" in (base_url or "")
        
        completion_args = {
            "model": request.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
        }
        
        # Only add json_object enforcement if likely OpenAI or compatible
        if not is_local and "gpt" in request.model:
             completion_args["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**completion_args)
        
        content = response.choices[0].message.content
        print("Generation complete.")
        
        # Clean up code blocks if local model included them
        clean_content = content.replace("```json", "").replace("```", "").strip()
        
        try:
            return json.loads(clean_content)
        except json.JSONDecodeError:
            print(f"JSON Parse Error. Raw content: {content}")
            # Fallback: Try to simplistic extraction or just return as content
            return {
                "title": "Generated Note (Raw Output)",
                "content": content
            }
            
    except Exception as e:
        print(f"Error during generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
