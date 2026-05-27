import os
import re
import uuid
import asyncio
import yt_dlp
import shutil
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, status, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
import json
import zipfile
from typing import Literal
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

APP_ENV = os.getenv("APP_ENV", "development")  # Set to "production" in hosting platform
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000").rstrip("/")  # Public-facing backend URL

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI App
# Disable API docs in production — they expose the full API surface publicly
app = FastAPI(
    title="YouTube to Shorts API",
    docs_url="/docs" if APP_ENV != "production" else None,
    redoc_url="/redoc" if APP_ENV != "production" else None,
)

# ─── Security Headers Middleware ──────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers.pop("X-Powered-By", None)
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Load origins from env for production. Comma-separated list.
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Restricted — no PUT/DELETE/PATCH
    allow_headers=["Content-Type", "Authorization"],
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
    resolution: Literal["720p", "1080p", "4K"] = "1080p"
    fps: Literal["24", "30", "60"] = "60"
    watermark: bool = False

class SettingsModel(BaseModel):
    duration: int = Field(default=60, ge=5, le=300)       # 5s–5 min
    aspectRatio: Literal["9:16", "16:9", "1:1", "4:5"] = "9:16"
    numClips: int = Field(default=1, ge=1, le=10)          # 1–10 clips max
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
# Endpoints
# -----------------
@app.get("/")
def read_root():
    return {"message": "Welcome to the YouTube Shorts API"}


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
        'quiet': APP_ENV == "production",  # Suppress yt-dlp noise in production
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

            # Note: file_path is intentionally omitted — never expose server paths to clients
            return {
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
        'quiet': APP_ENV == "production",  # Suppress yt-dlp noise in production
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
                clip["video_url"] = f"{BASE_URL}/static_clips/{filename}"

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

# ─── Allowed upload types ────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
# MIME type signatures (magic bytes) for common video formats
ALLOWED_MIME_SIGNATURES: dict[bytes, str] = {
    b"\x00\x00\x00\x18ftyp": "mp4",
    b"\x00\x00\x00\x20ftyp": "mp4",
    b"\x1aE\xdf\xa3": "mkv/webm",
    b"RIFF": "avi",
    b"\x00\x00\x00\x14ftyp": "mov",
    b"\x00\x00\x00\x08ftyp": "mp4",
}

def _is_valid_video_file(file_path: str) -> bool:
    """Check magic bytes to verify the file is actually a video."""
    try:
        with open(file_path, "rb") as f:
            header = f.read(32)
        for sig in ALLOWED_MIME_SIGNATURES:
            if header[: len(sig)] == sig or (sig == b"RIFF" and header[:4] == b"RIFF"):
                return True
        # Fallback: ftyp box can appear at different offsets in some MP4 variants
        return b"ftyp" in header or b"moov" in header
    except Exception:
        return False


@app.post("/api/upload")
@limiter.limit("5/hour", error_message="Please wait 1 hour before uploading again.")
async def upload_video_clips(
    request: Request, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    settings: str = Form("{}"),
    db: Session = Depends(get_db)
):
    # ── Extension whitelist check (before saving) ─────────────────────────
    original_ext = os.path.splitext(file.filename or "")[1].lower()
    if original_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{original_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    user_id = sanitize_filename(get_remote_address(request))
    base_dir = f"/tmp/shortifyai/{user_id}"
    os.makedirs(base_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    # Always use the validated extension — never trust the raw filename
    saved_file_path = f"{base_dir}/{file_id}{original_ext}"
    
    try:
        with open(saved_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ── MIME / magic-byte validation (after saving) ───────────────────
        if not _is_valid_video_file(saved_file_path):
            os.remove(saved_file_path)
            raise HTTPException(
                status_code=400,
                detail="File content does not match a valid video format."
            )
            
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
            clip["video_url"] = f"{BASE_URL}/static_clips/{filename}"

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

@app.post("/api/zip")
@limiter.limit("10/hour", error_message="Too many zip requests. Please wait before trying again.")
async def create_zip_archive(request: Request, body: ZipRequest, background_tasks: BackgroundTasks):
    if not body.files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Cap the number of files to prevent abuse
    if len(body.files) > 50:
        raise HTTPException(status_code=400, detail="Too many files. Maximum 50 per zip.")

    zip_id = str(uuid.uuid4())
    zip_path = f"/tmp/clips/shorts_{zip_id}.zip"
    clips_base = os.path.realpath("/tmp/clips")

    try:
        with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
            for file_url in body.files:
                # ── Path traversal protection ─────────────────────────────────
                # Extract just the basename — reject anything with path separators
                raw_name = file_url.split("/")[-1]
                filename = os.path.basename(raw_name)  # strips any remaining path components

                if not filename or "." not in filename:
                    continue  # skip empty or suspicious names

                local_path = os.path.realpath(os.path.join("/tmp/clips", filename))

                # Confirm resolved path is still inside /tmp/clips — prevents symlink attacks
                if not local_path.startswith(clips_base + os.sep):
                    continue

                if os.path.isfile(local_path):
                    zipf.write(local_path, arcname=filename)

        background_tasks.add_task(delete_file_after_delay, zip_path, 3600)
        return {"zip_url": f"{BASE_URL}/static_clips/shorts_{zip_id}.zip"}
    except Exception as e:
        print(f"Error creating ZIP: {e}")
        raise HTTPException(status_code=500, detail="Failed to create ZIP archive")
