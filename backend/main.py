from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from pydantic import BaseModel

app = FastAPI(title="Papipoint API", version="0.1.0")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder for Gemini configuration
# You will need to set GOOGLE_API_KEY in your environment variables
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class GenerateRequest(BaseModel):
    topic: str
    custom_api_key: str | None = None # Optional BYOK from frontend

@app.get("/")
def read_root():
    return {"message": "Welcome to the Papipoint API"}

@app.post("/api/upload-pptx")
async def upload_pptx(file: UploadFile = File(...)):
    """
    Endpoint to receive a .pptx file, save it temporarily, and return basic metadata.
    """
    if not file.filename.endswith(".pptx"):
        raise HTTPException(status_code=400, detail="Only .pptx files are supported.")
    
    # In a real app, you would read the PPTX here using python-pptx
    # and extract text to send to the AI.
    
    return {"filename": file.filename, "status": "Uploaded successfully", "message": "Ready for processing."}

@app.post("/api/generate-structure")
async def generate_structure(request: GenerateRequest):
    """
    Endpoint to call Gemini (or another AI) to generate presentation structure.
    """
    # If the user provided their own key, use it. Otherwise use default.
    api_key_to_use = request.custom_api_key if request.custom_api_key else GEMINI_API_KEY
    
    if not api_key_to_use:
        raise HTTPException(status_code=500, detail="No API key available for AI generation.")
    
    # Example AI Call (Placeholder)
    # genai.configure(api_key=api_key_to_use)
    # model = genai.GenerativeModel('gemini-1.5-flash')
    # response = model.generate_content(f"Create a 5 slide presentation outline about {request.topic}")
    
    return {
        "topic": request.topic,
        "slides": [
            {"title": "Introduction", "bullets": ["Point 1", "Point 2"]},
            {"title": "Core Problem", "bullets": ["Point 1", "Point 2"]},
        ]
    }
