import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from database import get_db
from models import ConnectedAccount
from slowapi.util import get_remote_address

router = APIRouter(prefix="/api/auth", tags=["auth"])

FRONTEND_URL = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")[0]
BACKEND_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000").rstrip("/")

# OAuth Credentials
INSTAGRAM_CLIENT_ID = os.getenv("INSTAGRAM_CLIENT_ID", "")
INSTAGRAM_CLIENT_SECRET = os.getenv("INSTAGRAM_CLIENT_SECRET", "")
TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "")
YOUTUBE_CLIENT_ID = os.getenv("YOUTUBE_CLIENT_ID", "")
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET", "")

def get_user_id(request: Request) -> str:
    # For local development, hardcode the user_id so it matches perfectly
    # between OAuth callbacks (browser) and frontend API requests (fetch)
    return "test_user_123"

# ---------------------------------------------------------
# INSTAGRAM OAUTH
# ---------------------------------------------------------
@router.get("/instagram/connect")
async def connect_instagram():
    redirect_uri = f"{BACKEND_URL}/api/auth/instagram/callback"
    auth_url = (
        f"https://api.instagram.com/oauth/authorize"
        f"?client_id={INSTAGRAM_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=user_profile,user_media"
        f"&response_type=code"
    )
    return RedirectResponse(auth_url)

@router.get("/instagram/callback")
async def instagram_callback(request: Request, code: str, db: Session = Depends(get_db)):
    redirect_uri = f"{BACKEND_URL}/api/auth/instagram/callback"
    user_id = get_user_id(request)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": INSTAGRAM_CLIENT_ID,
                "client_secret": INSTAGRAM_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code": code,
            }
        )
        data = response.json()
        
    if "access_token" not in data:
        raise HTTPException(status_code=400, detail="Failed to get Instagram token")

    # In reality, you'd exchange this for a long-lived token
    access_token = data["access_token"]
    platform_user_id = str(data.get("user_id", ""))

    # Save to DB
    account = db.query(ConnectedAccount).filter_by(user_id=user_id, platform="instagram").first()
    if not account:
        account = ConnectedAccount(user_id=user_id, platform="instagram")
        db.add(account)
    
    account.access_token = access_token
    account.handle = platform_user_id # Could fetch real handle using IG Graph API
    db.commit()
    
    return RedirectResponse(f"{FRONTEND_URL}/?connected=instagram")

# ---------------------------------------------------------
# TIKTOK OAUTH
# ---------------------------------------------------------
@router.get("/tiktok/connect")
async def connect_tiktok():
    redirect_uri = f"{BACKEND_URL}/api/auth/tiktok/callback"
    auth_url = (
        f"https://www.tiktok.com/v2/auth/authorize/"
        f"?client_key={TIKTOK_CLIENT_KEY}"
        f"&response_type=code"
        f"&scope=user.info.basic,video.upload"
        f"&redirect_uri={redirect_uri}"
        f"&state=tiktok"
    )
    return RedirectResponse(auth_url)

@router.get("/tiktok/callback")
async def tiktok_callback(request: Request, code: str, state: str = None, db: Session = Depends(get_db)):
    redirect_uri = f"{BACKEND_URL}/api/auth/tiktok/callback"
    user_id = get_user_id(request)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data={
                "client_key": TIKTOK_CLIENT_KEY,
                "client_secret": TIKTOK_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code": code,
            }
        )
        data = response.json()

    if "access_token" not in data:
        raise HTTPException(status_code=400, detail="Failed to get TikTok token")

    account = db.query(ConnectedAccount).filter_by(user_id=user_id, platform="tiktok").first()
    if not account:
        account = ConnectedAccount(user_id=user_id, platform="tiktok")
        db.add(account)
    
    account.access_token = data["access_token"]
    account.refresh_token = data.get("refresh_token")
    expires_in = data.get("expires_in", 3600)
    account.expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    db.commit()
    
    return RedirectResponse(f"{FRONTEND_URL}/?connected=tiktok")

# ---------------------------------------------------------
# YOUTUBE OAUTH
# ---------------------------------------------------------
@router.get("/youtube/connect")
async def connect_youtube():
    redirect_uri = f"{BACKEND_URL}/api/auth/youtube/callback"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={YOUTUBE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope=https://www.googleapis.com/auth/youtube.upload"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return RedirectResponse(auth_url)

@router.get("/youtube/callback")
async def youtube_callback(request: Request, code: str, db: Session = Depends(get_db)):
    redirect_uri = f"{BACKEND_URL}/api/auth/youtube/callback"
    user_id = get_user_id(request)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": YOUTUBE_CLIENT_ID,
                "client_secret": YOUTUBE_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code": code,
            }
        )
        data = response.json()

    if "access_token" not in data:
        raise HTTPException(status_code=400, detail="Failed to get YouTube token")

    account = db.query(ConnectedAccount).filter_by(user_id=user_id, platform="youtube").first()
    if not account:
        account = ConnectedAccount(user_id=user_id, platform="youtube")
        db.add(account)
    
    account.access_token = data["access_token"]
    if data.get("refresh_token"):
        account.refresh_token = data["refresh_token"]
    expires_in = data.get("expires_in", 3599)
    account.expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # Fetch the YouTube channel name
    try:
        async with httpx.AsyncClient() as client:
            channel_resp = await client.get(
                "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
                headers={"Authorization": f"Bearer {account.access_token}"}
            )
            if channel_resp.status_code == 200:
                channel_data = channel_resp.json()
                if "items" in channel_data and len(channel_data["items"]) > 0:
                    title = channel_data["items"][0]["snippet"]["title"]
                    custom_url = channel_data["items"][0]["snippet"].get("customUrl")
                    account.handle = custom_url if custom_url else title
    except Exception as e:
        print(f"Failed to fetch YouTube channel info: {e}")

    db.commit()
    
    return RedirectResponse(f"{FRONTEND_URL}/?connected=youtube")


# ---------------------------------------------------------
# DISCONNECT ACCOUNT
# ---------------------------------------------------------
@router.delete("/{platform}/disconnect")
def disconnect_account(platform: str, request: Request, db: Session = Depends(get_db)):
    """Remove a connected social account."""
    user_id = get_user_id(request)
    
    account = db.query(ConnectedAccount).filter_by(user_id=user_id, platform=platform).first()
    if account:
        db.delete(account)
        db.commit()
    
    return {"status": "disconnected", "platform": platform}


# ---------------------------------------------------------
# TOKEN REFRESH HELPERS (used by cron_jobs.py)
# ---------------------------------------------------------
def refresh_youtube_token(account: "ConnectedAccount", db: "Session") -> str:
    """Refresh a YouTube access token using the stored refresh_token.

    Returns the fresh access_token, or raises if refresh fails.
    """
    import httpx

    if not account.refresh_token:
        raise ValueError("No refresh token stored for this YouTube account")

    with httpx.Client() as client:
        response = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": YOUTUBE_CLIENT_ID,
                "client_secret": YOUTUBE_CLIENT_SECRET,
                "grant_type": "refresh_token",
                "refresh_token": account.refresh_token,
            },
        )
        data = response.json()

    if "access_token" not in data:
        raise ValueError(f"YouTube token refresh failed: {data}")

    account.access_token = data["access_token"]
    expires_in = data.get("expires_in", 3599)
    account.expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    # Google may rotate the refresh token
    if data.get("refresh_token"):
        account.refresh_token = data["refresh_token"]
    db.commit()

    return account.access_token
