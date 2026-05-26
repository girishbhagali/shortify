import os
import re
import uuid
import asyncio
import random
import time
import yt_dlp
import shutil
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
import json
from pydantic import BaseModel, HttpUrl, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Depends
from sqlalchemy.orm import Session
from clip_generator import generate_clips
from database import engine, Base, get_db
from models import Job, Clip
from dotenv import load_dotenv

load_dotenv()

# Trigger reload after installing twilio dependency


# ─── Twilio SMS OTP Setup ─────────────────────────────────────────────
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

# In-memory OTP store: { phone: { otp, expires_at } }
_otp_store: dict[str, dict] = {}
OTP_EXPIRY_SECONDS = 600  # 10 minutes

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI App
app = FastAPI(title="YouTube to Shorts API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount static files for generated clips with CORS support
class CORSStaticFiles(StaticFiles):
    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

os.makedirs("/tmp/clips", exist_ok=True)
app.mount("/static_clips", CORSStaticFiles(directory="/tmp/clips"), name="static_clips")

# -----------------
# Input Models
# -----------------
class AIFeaturesModel(BaseModel):
    autoCaptions: bool = True
    emojiCaptions: bool = True
    autoZoom: bool = False
    viralHook: bool = True
    faceTracking: bool = True

class ExportSettingsModel(BaseModel):
    resolution: str = "1080p"
    fps: str = "60"
    watermark: bool = False

class SettingsModel(BaseModel):
    duration: int = 60
    aspectRatio: str = "9:16"
    numClips: int = 1
    aiFeatures: AIFeaturesModel = AIFeaturesModel()
    exportSettings: ExportSettingsModel = ExportSettingsModel()

class InfoRequest(BaseModel):
    url: str = Field(..., max_length=500, description="The YouTube video URL to get info for.")

class DownloadRequest(BaseModel):
    url: str = Field(..., max_length=500, description="The YouTube video URL to download.")
    settings: SettingsModel = Field(default_factory=SettingsModel)

class ZipRequest(BaseModel):
    files: list[str]

# -----------------
# Utility Functions
# -----------------
def is_valid_youtube_url(url: str) -> bool:
    """Check if the URL is a valid youtube.com or youtu.be URL and NOT a playlist."""
    if "list=" in url:
        return False
    
    # Regex to match youtube.com and youtu.be URLs
    yt_regex = r'^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$'
    return re.match(yt_regex, url) is not None

def sanitize_filename(title: str) -> str:
    """Remove special characters for a safe filename."""
    return re.sub(r'[^a-zA-Z0-9_\- ]', '', title).replace(' ', '_')

async def delete_file_after_delay(file_path: str, delay_seconds: int = 3600):
    """Background task to delete a file after a specified delay (default 1 hour)."""
    await asyncio.sleep(delay_seconds)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"Cleanup: Deleted file {file_path}")
    except Exception as e:
        print(f"Failed to delete file {file_path}: {e}")

# -----------------
# OTP Models
# -----------------
class OTPSendRequest(BaseModel):
    phone: str = Field(..., description="Full phone number with country code e.g. +919876543210")

class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., description="Full phone number with country code")
    otp: str   = Field(..., min_length=6, max_length=6, description="6-digit OTP")

# -----------------
# Endpoints
# -----------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the YouTube Shorts API"}

# ─── SMS OTP: Send ─────────────────────────────────────────────────────────
@app.post("/api/otp/send")
@limiter.limit("5/minute")
async def send_phone_otp(request: Request, body: OTPSendRequest):
    """
    Generates a 6-digit OTP and sends it via Twilio SMS to the given number.
    Falls back to a simulated success when Twilio credentials are missing.
    """
    phone = body.phone.strip()
    if not re.match(r'^\+[1-9]\d{6,14}$', phone):
        raise HTTPException(status_code=400, detail="Invalid phone number. Use international format e.g. +919876543210")

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    _otp_store[phone] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_SECONDS
    }

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print(f"[DEV MODE] SMS OTP for {phone}: {otp}")
        return {"success": True, "message": "OTP sent (dev mode — check console)", "dev_otp": otp}

    try:
        from twilio.rest import Client as TwilioClient
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        message_body = f"{otp} is your verification code. For your security, do not share this code."

        msg = client.messages.create(
            body=message_body,
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        print(f"Twilio SMS OTP sent. SID: {msg.sid}")
        return {"success": True, "message": "OTP sent via SMS"}

    except Exception as e:
        print(f"Twilio error: {e}")
        print(f"[FALLBACK TO DEV MODE] SMS OTP for {phone}: {otp}")
        return {
            "success": True,
            "message": "Twilio error (falling back to dev mode — check console)",
            "dev_otp": otp,
            "error_hint": str(e)
        }


# ─── SMS OTP: Verify ───────────────────────────────────────────────────────
@app.post("/api/otp/verify")
@limiter.limit("10/minute")
async def verify_whatsapp_otp(request: Request, body: OTPVerifyRequest):
    phone = body.phone.strip()
    entered = body.otp.strip()

    record = _otp_store.get(phone)
    if not record:
        raise HTTPException(status_code=400, detail="No OTP was sent to this number. Request a new one.")

    if time.time() > record["expires_at"]:
        _otp_store.pop(phone, None)
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    if record["otp"] != entered:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    _otp_store.pop(phone, None)
    return {"success": True, "message": "Phone verified successfully", "phone": phone}

@app.post("/api/info")
@limiter.limit("20/hour", error_message="Too many requests.")
async def get_video_info(request: Request, body: InfoRequest):
    url = body.url
    if not is_valid_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
    
    ydl_opts = {
        'noplaylist': True,
        'quiet': True,
        'no_warnings': True,
    }
    try:
        def fetch_info():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
                
        info = await asyncio.to_thread(fetch_info)
        if not info:
            raise HTTPException(status_code=404, detail="Video not found")
            
        return {
            "title": info.get("title", "Unknown Title"),
            "thumbnail": info.get("thumbnail", ""),
            "duration": info.get("duration", 0),
            "uploader": info.get("uploader", "Unknown Creator")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch video info")

@app.post("/api/download")
@limiter.limit("5/hour", error_message="Please wait 1 hour before downloading again.")
async def download_video(request: Request, body: DownloadRequest, background_tasks: BackgroundTasks):
    url = body.url
    
    # 1. Input Validation
    if not is_valid_youtube_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid YouTube URL. Playlists are not supported."
        )

    # Temporary directory logic (Using /tmp/shortifyai/{user_id}/)
    # Using the remote address as a mock user_id for now
    user_id = sanitize_filename(get_remote_address(request))
    base_dir = f"/tmp/shortifyai/{user_id}"
    os.makedirs(base_dir, exist_ok=True)

    # UUID for unique naming
    file_id = str(uuid.uuid4())
    
    # yt-dlp Configuration
    ydl_opts = {
        'format': 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': f'{base_dir}/{file_id}_%(title)s.%(ext)s',
        'noplaylist': True,
        'quiet': False, # Show progress in console logs
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 2. Extract Info first to check duration
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise HTTPException(status_code=404, detail="This video does not exist or is private")
                
            duration = info.get('duration', 0)
            
            # Max duration: 60 minutes (3600 seconds)
            if duration > 3600:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Video exceeds the maximum duration of 60 minutes."
                )

            # 3. Proceed with download
            info = ydl.extract_info(url, download=True)
            
            # Get the exact filename generated by yt-dlp
            downloaded_file_path = ydl.prepare_filename(info)

            # 4. Security Check: File Size (max 500MB)
            if os.path.exists(downloaded_file_path):
                file_size_mb = os.path.getsize(downloaded_file_path) / (1024 * 1024)
                if file_size_mb > 500:
                    os.remove(downloaded_file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
                        detail="Video file is too large (exceeds 500MB limit)."
                    )
            
            # 5. Background Task for cleanup (1 hour = 3600 seconds)
            background_tasks.add_task(delete_file_after_delay, downloaded_file_path, 3600)

            return {
                "file_path": downloaded_file_path,
                "title": info.get("title", "Unknown Title"),
                "duration": duration,
                "thumbnail": info.get("thumbnail", "")
            }

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if "video unavailable" in error_msg or "private" in error_msg:
            raise HTTPException(status_code=404, detail="This video does not exist or is private")
        elif "age-restricted" in error_msg or "sign in" in error_msg:
            raise HTTPException(status_code=403, detail="This video is age restricted and cannot be processed")
        elif "copyright" in error_msg or "blocked" in error_msg:
            raise HTTPException(status_code=403, detail="This video is not available in your region due to copyright blocks")
        else:
            raise HTTPException(status_code=500, detail="Download failed, please try again")
            
    except HTTPException as e:
        # Re-raise HTTP exceptions to avoid catching them in the generic block
        raise e
    except Exception as e:
        # Catch all other exceptions and hide exact server errors/paths from the user
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Download failed, please try again")

@app.post("/api/generate")
@limiter.limit("5/hour", error_message="Please wait 1 hour before downloading again.")
async def generate_video_clips(request: Request, body: DownloadRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    url = body.url
    
    if not is_valid_youtube_url(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid YouTube URL. Playlists are not supported."
        )

    user_id = sanitize_filename(get_remote_address(request))
    base_dir = f"/tmp/shortifyai/{user_id}"
    os.makedirs(base_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': f'{base_dir}/{file_id}_%(title)s.%(ext)s',
        'noplaylist': True,
        'quiet': False,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                raise HTTPException(status_code=404, detail="This video does not exist or is private")
                
            duration = info.get('duration', 0)
            if duration > 3600:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Video exceeds the maximum duration of 60 minutes."
                )

            info = ydl.extract_info(url, download=True)
            downloaded_file_path = ydl.prepare_filename(info)

            if os.path.exists(downloaded_file_path):
                file_size_mb = os.path.getsize(downloaded_file_path) / (1024 * 1024)
                if file_size_mb > 500:
                    os.remove(downloaded_file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
                        detail="Video file is too large (exceeds 500MB limit)."
                    )
            
            background_tasks.add_task(delete_file_after_delay, downloaded_file_path, 3600)

            # Generate clips based on user setting
            settings_dict = body.settings.model_dump() if body.settings else {}
            num_clips = settings_dict.get("numClips", 1)
            clips_result = await asyncio.to_thread(generate_clips, downloaded_file_path, num_clips, settings_dict)
            
            if "error" in clips_result:
                raise HTTPException(status_code=500, detail=f"Clip generation failed: {clips_result['error']}")

            # Convert local file paths to static URLs
            for clip in clips_result.get("clips", []):
                filename = os.path.basename(clip["file_path"])
                clip["video_url"] = f"http://127.0.0.1:8000/static_clips/{filename}"

            # Create DB records
            try:
                db_job = Job(user_id=user_id, original_video_url=url, status="completed")
                db.add(db_job)
                db.commit()
                db.refresh(db_job)
                
                for clip in clips_result.get("clips", []):
                    db_clip = Clip(
                        job_id=db_job.id,
                        clip_number=clip["clip_number"],
                        start_time=clip["start_time"],
                        end_time=clip["end_time"],
                        score=clip["score"],
                        transcript=clip["transcript"],
                        file_path=clip["file_path"],
                        video_url=clip["video_url"]
                    )
                    db.add(db_clip)
                db.commit()
            except Exception as db_err:
                print(f"Failed to save to DB: {db_err}")

            return clips_result

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if "video unavailable" in error_msg or "private" in error_msg:
            raise HTTPException(status_code=404, detail="This video does not exist or is private")
        elif "age-restricted" in error_msg or "sign in" in error_msg:
            raise HTTPException(status_code=403, detail="This video is age restricted and cannot be processed")
        elif "copyright" in error_msg or "blocked" in error_msg:
            raise HTTPException(status_code=403, detail="This video is not available in your region due to copyright blocks")
        else:
            raise HTTPException(status_code=500, detail="Download failed, please try again")
            
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Download and clip generation failed, please try again")

@app.post("/api/upload")
@limiter.limit("5/hour", error_message="Please wait 1 hour before uploading again.")
async def upload_video_clips(
    request: Request, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    settings: str = Form("{}"),
    db: Session = Depends(get_db)
):
    user_id = sanitize_filename(get_remote_address(request))
    base_dir = f"/tmp/shortifyai/{user_id}"
    os.makedirs(base_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or ".mp4"
    saved_file_path = f"{base_dir}/{file_id}{ext}"
    
    try:
        with open(saved_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size_mb = os.path.getsize(saved_file_path) / (1024 * 1024)
        if file_size_mb > 500:
            os.remove(saved_file_path)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
                detail="Video file is too large (exceeds 500MB limit)."
            )

        background_tasks.add_task(delete_file_after_delay, saved_file_path, 3600)

        # Generate clips based on user setting
        try:
            settings_dict = json.loads(settings)
        except Exception:
            settings_dict = {}
            
        num_clips = settings_dict.get("numClips", 1)
        clips_result = await asyncio.to_thread(generate_clips, saved_file_path, num_clips, settings_dict)
        
        if "error" in clips_result:
            raise HTTPException(status_code=500, detail=f"Clip generation failed: {clips_result['error']}")

        # Convert local file paths to static URLs
        for clip in clips_result.get("clips", []):
            filename = os.path.basename(clip["file_path"])
            clip["video_url"] = f"http://127.0.0.1:8000/static_clips/{filename}"

        # Create DB records
        try:
            db_job = Job(user_id=user_id, original_video_url="uploaded_file", status="completed")
            db.add(db_job)
            db.commit()
            db.refresh(db_job)
            
            for clip in clips_result.get("clips", []):
                db_clip = Clip(
                    job_id=db_job.id,
                    clip_number=clip["clip_number"],
                    start_time=clip["start_time"],
                    end_time=clip["end_time"],
                    score=clip["score"],
                    transcript=clip["transcript"],
                    file_path=clip["file_path"],
                    video_url=clip["video_url"]
                )
                db.add(db_clip)
            db.commit()
        except Exception as db_err:
            print(f"Failed to save to DB: {db_err}")

        return clips_result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Upload and clip generation failed, please try again")

import zipfile
from fastapi.responses import FileResponse

@app.post("/api/zip")
async def create_zip_archive(body: ZipRequest, background_tasks: BackgroundTasks):
    if not body.files:
        raise HTTPException(status_code=400, detail="No files provided")
        
    zip_id = str(uuid.uuid4())
    zip_path = f"/tmp/clips/shorts_{zip_id}.zip"
    
    try:
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file_url in body.files:
                # file_url is like http://127.0.0.1:8000/static_clips/clip_1.mp4
                # We need the local path
                filename = file_url.split("/")[-1]
                local_path = os.path.join("/tmp/clips", filename)
                if os.path.exists(local_path):
                    zipf.write(local_path, arcname=filename)
                    
        background_tasks.add_task(delete_file_after_delay, zip_path, 3600)
        return {"zip_url": f"http://127.0.0.1:8000/static_clips/shorts_{zip_id}.zip"}
    except Exception as e:
        print(f"Error creating ZIP: {e}")
        raise HTTPException(status_code=500, detail="Failed to create ZIP archive")
