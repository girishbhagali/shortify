import os
import re
import uuid
import asyncio
import traceback
from concurrent.futures import ThreadPoolExecutor
import yt_dlp
import shutil
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, status, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse, PlainTextResponse
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

from services.clip_processor import supabase, process_and_store_clip
from database import engine, Base, get_db
from models import Job, Clip
from dotenv import load_dotenv
from auth_routes import router as auth_router
from scheduler_routes import router as scheduler_router

load_dotenv(override=True)

# --- Env Var Validation ---
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_url.startswith("https://"):
    print("[FATAL] SUPABASE_URL is missing or invalid. It must be a valid HTTPS URL.")
    sys.exit(1)

if not supabase_key:
    print("[FATAL] SUPABASE_SERVICE_KEY is missing from environment variables.")
    sys.exit(1)

# Dedicated pool for FFmpeg/Whisper clip jobs (BackgroundTasks were not running on Windows)
_clip_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="clip-worker")

APP_ENV = os.getenv("APP_ENV", "development")  # Set to "production" in hosting platform
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000").rstrip("/")  # Public-facing backend URL

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

from contextlib import asynccontextmanager
from cron_jobs import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield

# Initialize FastAPI App
# Disable API docs in production — they expose the full API surface publicly
app = FastAPI(
    title="YouTube to Shorts API",
    docs_url="/docs" if APP_ENV != "production" else None,
    redoc_url="/redoc" if APP_ENV != "production" else None,
    lifespan=lifespan,
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
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.include_router(auth_router)
app.include_router(scheduler_router)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Load origins from env for production. Comma-separated list.
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "HEAD", "DELETE", "PUT", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Range"],
    expose_headers=["Accept-Ranges", "Content-Range", "Content-Length", "Content-Type"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# -----------------
# Input Models
# -----------------
class AIFeaturesModel(BaseModel):
    autoCaptions: bool = True
    captionsStyle: str = "viral-yellow"
    emojiCaptions: bool = True
    emojiAnimations: bool = True
    emojiFrequency: str = "medium"
    autoZoom: bool = False
    zoomIntensity: str = "medium"
    viralHook: bool = True
    viralHooks: bool = True
    hooksStyle: str = "bold-statement"
    faceTracking: bool = True
    faceSensitivity: str = "medium"
    silenceRemoval: bool = True
    silenceThreshold: str = "0.5s"
    backgroundMusic: bool = False
    bgMusicTrack: str = "Lofi Beats"
    bgMusicVolume: int = 40
    bgMusicFade: bool = True
    introOutro: bool = False
    introLogo: str | None = None
    introColor: str = "#534AB7"
    introDuration: int = 3
    autoTranslate: bool = False
    translateLanguage: str = "Hindi"

    class Config:
        extra = "ignore"

class ExportSettingsModel(BaseModel):
    resolution: str = "1080p"
    fps: str = "60"
    format: str = "mp4"
    compression: str = "balanced"
    watermark: bool = False
    watermarkLogo: str | None = None
    watermarkPosition: str = "bottom-right"
    watermarkOpacity: int = 50
    deliveryZip: bool = True
    deliveryGDrive: bool = False
    deliverySocialDirect: bool = False
    deliveryEmailTick: bool = True

    class Config:
        extra = "ignore"

class SettingsModel(BaseModel):
    duration: int = Field(default=60, ge=5, le=300)       # 5s–5 min
    aspectRatio: str = "9:16"
    numClips: int = Field(default=1, ge=1, le=10)          # 1–10 clips max
    targetPlatform: str = "all"
    aiFeatures: AIFeaturesModel = AIFeaturesModel()
    exportSettings: ExportSettingsModel = ExportSettingsModel()

class InfoRequest(BaseModel):
    url: str = Field(..., max_length=500, description="The YouTube video URL to get info for.")

class DownloadRequest(BaseModel):
    url: str = Field(..., max_length=500, description="The YouTube video URL to download.")
    settings: SettingsModel = Field(default_factory=SettingsModel)
    userId: str | None = None

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

def segment_transcript_json(segment: dict) -> str:
    """Persist transcript text plus segment bounds for retries and the UI."""
    return json.dumps({
        "text": segment.get("transcript", ""),
        "start_time": segment["start_time"],
        "end_time": segment["end_time"],
    })


def _get_yt_dlp_cookie_opts() -> dict:
    """Return the best available cookie option for yt-dlp.

    Priority:
    1. backend/cookies.txt  (Netscape format — export from browser extension)
    2. No cookies           (YouTube may block bot-like requests)

    Browser DB extraction is intentionally skipped: on Windows the cookies
    are encrypted with DPAPI and can only be decrypted by the same user
    session that owns the browser — which doesn't work reliably from a
    background server process.
    """
    cookies_file = os.path.join(os.path.dirname(__file__), "cookies.txt")
    if os.path.isfile(cookies_file):
        print(f"[YT-DLP] Using cookies.txt: {cookies_file}")
        return {'cookiefile': cookies_file}
    print("[YT-DLP] No cookies.txt found — proceeding without cookies (YouTube may require auth)")
    return {}


def schedule_clip_processing(
    video_path: str,
    user_id: str,
    clip_id: str,
    start_time: float,
    end_time: float,
    settings: dict,
) -> None:
    """Queue clip cut/upload on a background thread (reliable on Windows)."""
    abs_video = os.path.abspath(video_path)

    def _worker() -> None:
        try:
            print(
                f"[CLIP BG] Starting clip_id={clip_id} ({start_time}s -> {end_time}s)",
                flush=True,
            )
            if not os.path.exists(abs_video):
                raise FileNotFoundError(f"Source video missing: {abs_video}")
            asyncio.run(
                process_and_store_clip(
                    abs_video,
                    user_id,
                    clip_id,
                    start_time,
                    end_time,
                    settings,
                )
            )
            print(f"[CLIP BG] Finished clip_id={clip_id}", flush=True)
        except Exception as e:
            print(f"[CLIP BG] FAILED clip_id={clip_id}: {e}", flush=True)
            traceback.print_exc()

    _clip_executor.submit(_worker)
    print(f"[CLIP BG] Queued clip_id={clip_id}", flush=True)


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


@app.get("/api/clips/{clip_id}/stream")
async def stream_clip(clip_id: str, request: Request):
    """Stream a clip's video from local disk with HTTP Range support.

    Videos are stored locally in tmp_clips/. They are never uploaded to
    Supabase Storage.  A cron job expires files older than 24 h.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    # 1. Look up the clip record
    try:
        result = supabase.table("clips").select("clip_storage_path, status").eq("id", clip_id).single().execute()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Clip not found: {e}")

    clip = result.data
    if not clip or not clip.get("clip_storage_path"):
        raise HTTPException(status_code=404, detail="Clip has no storage path")

    # 2. Reject clips that aren't ready yet
    clip_status = clip.get("status", "")
    if clip_status == "processing":
        raise HTTPException(status_code=202, detail="Clip is still processing. Please wait.")
    if clip_status == "failed":
        raise HTTPException(status_code=422, detail="Clip processing failed. Please regenerate.")
    if clip_status == "expired":
        raise HTTPException(status_code=410, detail="Clip has expired. Please regenerate.")

    storage_path = clip["clip_storage_path"]

    # 3. File is missing (cleaned up by cron or never created)
    if not os.path.isabs(storage_path):
        raise HTTPException(status_code=404, detail="Video file not found. It may not have been processed yet.")
    if not os.path.isfile(storage_path):
        raise HTTPException(status_code=410, detail="Video file has expired and was cleaned up. Please regenerate the clip.")

    # 4. Serve with proper HTTP Range support so browsers can seek/buffer
    file_size = os.path.getsize(storage_path)
    range_header = request.headers.get("Range")

    def iter_file(path: str, start: int, end: int, chunk: int = 1024 * 256):
        with open(path, "rb") as f:
            f.seek(start)
            remaining = end - start + 1
            while remaining > 0:
                data = f.read(min(chunk, remaining))
                if not data:
                    break
                remaining -= len(data)
                yield data

    common_headers = {
        "Accept-Ranges": "bytes",
        "Content-Disposition": f'inline; filename="{clip_id}.mp4"',
        "Cache-Control": "no-cache",
    }

    if range_header:
        # Parse "bytes=start-end"
        try:
            range_val = range_header.strip().replace("bytes=", "")
            range_start, range_end = range_val.split("-")
            start = int(range_start)
            end = int(range_end) if range_end else file_size - 1
        except Exception:
            raise HTTPException(status_code=416, detail="Invalid Range header")

        if start >= file_size or end >= file_size:
            raise HTTPException(
                status_code=416,
                detail="Range Not Satisfiable",
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        content_length = end - start + 1
        return StreamingResponse(
            iter_file(storage_path, start, end),
            status_code=206,
            media_type="video/mp4",
            headers={
                **common_headers,
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(content_length),
            },
        )

    # Full file response
    return StreamingResponse(
        iter_file(storage_path, 0, file_size - 1),
        status_code=200,
        media_type="video/mp4",
        headers={
            **common_headers,
            "Content-Length": str(file_size),
        },
    )


@app.get("/api/clips/{clip_id}/thumbnail")
async def get_clip_thumbnail(clip_id: str):
    """Serve a clip's thumbnail from local disk."""
    tmp_clips_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "tmp_clips"))

    cors_origin = ",".join(_allowed_origins)
    thumb_headers = {
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": f'inline; filename="{clip_id}.jpg"',
        "Access-Control-Allow-Origin": cors_origin,
    }

    # 1. Try the DB-stored path first (new clips store an absolute local path)
    if supabase:
        try:
            result = supabase.table("clips").select("thumbnail_storage_path").eq("id", clip_id).single().execute()
            thumb_path = (result.data or {}).get("thumbnail_storage_path", "")
            if thumb_path and os.path.isabs(thumb_path) and os.path.isfile(thumb_path):
                return FileResponse(thumb_path, media_type="image/jpeg", headers=thumb_headers)
        except Exception:
            pass

    # 2. Fallback: find thumbnail on disk by clip_id convention
    fallback_path = os.path.join(tmp_clips_dir, f"{clip_id}_thumb.jpg")
    if os.path.isfile(fallback_path):
        return FileResponse(fallback_path, media_type="image/jpeg", headers=thumb_headers)

    raise HTTPException(status_code=404, detail="Thumbnail not found")


@app.get("/api/clips/{clip_id}/captions")
async def get_clip_captions(clip_id: str):
    """Serve a clip's captions as WebVTT for HTML5 video tracks.

    Captions are generated as SRT during clip processing, but browsers
    generally expect WebVTT for <track> elements. This endpoint converts
    the stored SRT file to VTT on the fly.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    # 1. Look up the caption storage path
    try:
        result = supabase.table("clips").select("caption_storage_path").eq("id", clip_id).single().execute()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Clip not found: {e}")

    clip = result.data
    if not clip or not clip.get("caption_storage_path"):
        raise HTTPException(status_code=404, detail="No captions available for this clip")

    caption_path = clip["caption_storage_path"]

    # 2. Validate the path exists
    if not os.path.isabs(caption_path) or not os.path.isfile(caption_path):
        raise HTTPException(status_code=404, detail="Caption file not found or has expired")

    # 3. Convert SRT to WebVTT text and return it
    try:
        with open(caption_path, "r", encoding="utf-8") as f:
            srt_text = f.read()
    except Exception as read_err:
        raise HTTPException(status_code=500, detail="Failed to read caption file")

    vtt_lines = ["WEBVTT", ""]
    for line in srt_text.splitlines():
        if "-->" in line:
            # Convert SRT comma decimals to VTT dot decimals.
            vtt_lines.append(line.replace(",", "."))
        else:
            vtt_lines.append(line)

    vtt_text = "\n".join(vtt_lines)

    return PlainTextResponse(
        content=vtt_text,
        status_code=200,
        media_type="text/vtt",
        headers={
            "Cache-Control": "public, max-age=86400",
        },
    )


class CleanupRequest(BaseModel):
    userId: str


@app.post("/api/clips/cleanup")
async def cleanup_user_clips(body: CleanupRequest):
    """Mark all existing clips for a user as 'deleted' and remove local files.

    Called by the frontend on page load so users start with a fresh library
    each session.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    user_id = body.userId
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")

    try:
        # Fetch all non-deleted clips for this user (including stale 'processing' ones)
        result = (
            supabase.table("clips")
            .select("id, clip_storage_path, thumbnail_storage_path")
            .eq("user_id", user_id)
            .neq("status", "deleted")
            .execute()
        )

        clip_ids = []
        for row in (result.data or []):
            clip_ids.append(row["id"])

            # Delete local video file
            vid_path = row.get("clip_storage_path", "")
            if vid_path and os.path.isabs(vid_path) and os.path.isfile(vid_path):
                try:
                    os.remove(vid_path)
                except Exception:
                    pass

            # Delete local thumbnail file
            thumb_path = row.get("thumbnail_storage_path", "")
            if thumb_path and os.path.isabs(thumb_path) and os.path.isfile(thumb_path):
                try:
                    os.remove(thumb_path)
                except Exception:
                    pass

        # Mark all as deleted in DB
        if clip_ids:
            supabase.table("clips").update({"status": "deleted"}).in_("id", clip_ids).execute()

        return {"deleted": len(clip_ids)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CLEANUP] Error: {e}")
        raise HTTPException(status_code=500, detail="Cleanup failed")




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
        **_get_yt_dlp_cookie_opts(),
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
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if "sign in" in error_msg or "bot" in error_msg or "cookies" in error_msg:
            raise HTTPException(status_code=403, detail="YouTube requires authentication. Please log into YouTube in your browser and try again.")
        if "video unavailable" in error_msg or "private" in error_msg:
            raise HTTPException(status_code=404, detail="This video does not exist or is private")
        raise HTTPException(status_code=500, detail="Failed to fetch video info")
    except Exception as e:
        print(f"[INFO] Unexpected error fetching info: {e}")
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

    # Extract real Supabase User UUID
    real_user_id = body.userId
    if not real_user_id:
        try:
            res = supabase.table("clips").select("user_id").limit(1).execute()
            if res.data:
                real_user_id = res.data[0]["user_id"]
        except:
            pass
    if not real_user_id:
        real_user_id = "00000000-0000-0000-0000-000000000000"
    
    print(f"[GENERATE] userId from frontend: {body.userId}, resolved user_id: {real_user_id}")

    user_id = sanitize_filename(get_remote_address(request))
    base_dir = f"/tmp/shortifyai/{user_id}"
    os.makedirs(base_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': f'{base_dir}/{file_id}_%(title)s.%(ext)s',
        'noplaylist': True,
        'quiet': APP_ENV == "production",
        'no_warnings': True,
        **_get_yt_dlp_cookie_opts(),
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
            downloaded_file_path = os.path.abspath(ydl.prepare_filename(info))

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
            duration_preset = settings_dict.get("duration", 35)

            # 1. Analyze and find viral moments
            from clip_generator import find_viral_segments
            top_segments = await asyncio.to_thread(find_viral_segments, downloaded_file_path, num_clips, duration_preset)
            
            # 2. Extract source title
            source_title = info.get("title", "YouTube Video")
            
            # 3. Create DB records and start background processing
            generated_clips = []
            for i, segment in enumerate(top_segments):
                const_platform = settings_dict.get("targetPlatform", "all")
                platform_tags = ["tiktok", "reels", "shorts"] if const_platform == "all" else [const_platform]
                clip_data = {
                    "user_id": real_user_id,
                    "title": f"{source_title} - Clip {i+1}",
                    "source_url": url,
                    "source_title": source_title,
                    "clip_storage_path": f"{real_user_id}/clips/placeholder.mp4",
                    "thumbnail_storage_path": f"{real_user_id}/placeholder.jpg",
                    "duration_seconds": 0,
                    "file_size_bytes": 0,
                    "has_captions": settings_dict.get("aiFeatures", {}).get("autoCaptions", False),
                    "viral_score": segment["score"],
                    "transcript": segment_transcript_json(segment),
                    "status": "processing",
                    "aspect_ratio": settings_dict.get("aspectRatio", "9:16"),
                    "platforms": platform_tags
                }
                
                try:
                    res = supabase.table("clips").insert(clip_data).execute()
                    if res.data:
                        clip_db_id = res.data[0]["id"]
                    else:
                        continue
                except Exception as ex:
                    print(f"Error inserting clip: {ex}")
                    continue

                storage_paths = {
                    "clip_storage_path": f"{real_user_id}/clips/{clip_db_id}.mp4",
                    "thumbnail_storage_path": f"{real_user_id}/{clip_db_id}.jpg",
                }
                try:
                    supabase.table("clips").update(storage_paths).eq("id", clip_db_id).execute()
                except Exception as ex:
                    print(f"Error updating clip paths: {ex}")
                
                schedule_clip_processing(
                    downloaded_file_path,
                    real_user_id,
                    clip_db_id,
                    segment["start_time"],
                    segment["end_time"],
                    settings_dict,
                )
                
                generated_clips.append({
                    "id": clip_db_id,
                    "clip_number": i + 1,
                    "status": "processing",
                    "score": segment["score"],
                    "start_time": segment["start_time"],
                    "end_time": segment["end_time"],
                    "transcript": segment["transcript"]
                })
                
            return {"clips": generated_clips}

    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e).lower()
        if "video unavailable" in error_msg or "private" in error_msg:
            raise HTTPException(status_code=404, detail="This video does not exist or is private")
        elif "age-restricted" in error_msg or "sign in" in error_msg or "bot" in error_msg or "cookies" in error_msg:
            raise HTTPException(status_code=403, detail="YouTube requires sign-in verification. Please make sure you are logged into YouTube in Chrome and try again.")
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
    userId: str = Form(None),
    db: Session = Depends(get_db)
):
    # ── Extension whitelist check (before saving) ─────────────────────────
    original_ext = os.path.splitext(file.filename or "")[1].lower()
    if original_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{original_ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Extract real Supabase User UUID
    real_user_id = userId
    if not real_user_id:
        try:
            res = supabase.table("clips").select("user_id").limit(1).execute()
            if res.data:
                real_user_id = res.data[0]["user_id"]
        except:
            pass
    if not real_user_id:
        real_user_id = "00000000-0000-0000-0000-000000000000"

    user_id = sanitize_filename(get_remote_address(request))
    base_dir = f"/tmp/shortifyai/{user_id}"
    os.makedirs(base_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    # Always use the validated extension — never trust the raw filename
    saved_file_path = os.path.abspath(f"{base_dir}/{file_id}{original_ext}")
    
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
        duration_preset = settings_dict.get("duration", 35)

        # 1. Analyze and find viral moments
        top_segments = await asyncio.to_thread(find_viral_segments, saved_file_path, num_clips, duration_preset)
        
        # 2. Extract source title
        source_title = file.filename or "Uploaded Video"
        
        # 3. Create DB records and start background processing
        generated_clips = []
        for i, segment in enumerate(top_segments):
            clip_data = {
                "user_id": real_user_id,
                "title": f"{source_title} - Clip {i+1}",
                "source_url": "uploaded_file",
                "source_title": source_title,
                "clip_storage_path": f"{real_user_id}/clips/placeholder.mp4",
                "thumbnail_storage_path": f"{real_user_id}/placeholder.jpg",
                "duration_seconds": 0,
                "file_size_bytes": 0,
                "has_captions": settings_dict.get("aiFeatures", {}).get("autoCaptions", False),
                "viral_score": segment["score"],
                "transcript": segment_transcript_json(segment),
                "status": "processing",
                "aspect_ratio": settings_dict.get("aspectRatio", "9:16"),
                "platforms": ["tiktok", "reels"]
            }
            
            try:
                res = supabase.table("clips").insert(clip_data).execute()
                if res.data:
                    clip_db_id = res.data[0]["id"]
                else:
                    continue
            except Exception as ex:
                print(f"Error inserting clip: {ex}")
                continue

            storage_paths = {
                "clip_storage_path": f"{real_user_id}/clips/{clip_db_id}.mp4",
                "thumbnail_storage_path": f"{real_user_id}/{clip_db_id}.jpg",
            }
            try:
                supabase.table("clips").update(storage_paths).eq("id", clip_db_id).execute()
            except Exception as ex:
                print(f"Error updating clip paths: {ex}")
            
            schedule_clip_processing(
                saved_file_path,
                real_user_id,
                clip_db_id,
                segment["start_time"],
                segment["end_time"],
                settings_dict,
            )
            
            generated_clips.append({
                "id": clip_db_id,
                "clip_number": i + 1,
                "status": "processing",
                "score": segment["score"],
                "start_time": segment["start_time"],
                "end_time": segment["end_time"],
                "transcript": segment["transcript"]
            })
            
        return {"clips": generated_clips}

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
