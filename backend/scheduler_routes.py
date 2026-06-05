from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from models import ScheduledPost, ConnectedAccount, Clip
from services.clip_processor import supabase
from slowapi.util import get_remote_address

router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])

def get_user_id(request: Request) -> str:
    return "test_user_123"

class ScheduledPostCreate(BaseModel):
    clip_id: str  # UUID string from Supabase clips table
    platform: str
    scheduled_time: datetime
    caption: str

@router.get("/accounts")
def get_connected_accounts(request: Request, db: Session = Depends(get_db)):
    user_id = get_user_id(request)
    accounts = db.query(ConnectedAccount).filter(ConnectedAccount.user_id == user_id).all()
    
    # We want to return a standard list of the 4 platforms whether connected or not
    platforms = ["instagram", "tiktok", "youtube", "twitter"]
    
    result = []
    for p in platforms:
        acc = next((a for a in accounts if a.platform == p), None)
        result.append({
            "id": f"acc_{p}",
            "platform": p,
            "isConnected": acc is not None,
            "handle": acc.handle if acc else None
        })
    return result

@router.get("/posts")
def get_scheduled_posts(request: Request, db: Session = Depends(get_db)):
    user_id = get_user_id(request)
    posts = db.query(ScheduledPost).filter(ScheduledPost.user_id == user_id).order_by(desc(ScheduledPost.scheduled_time)).all()
    
    result = []
    for p in posts:
        # Get title from Supabase clips table
        title = f"Clip {p.clip_id}"
        try:
            if supabase and p.clip_id:
                clip_data = supabase.table("clips").select("title").eq("id", str(p.clip_id)).single().execute()
                if clip_data.data:
                    title = clip_data.data.get("title", title)
        except Exception:
            pass

        result.append({
            "id": str(p.id),
            "clipId": str(p.clip_id) if p.clip_id else "",
            "title": title,
            "platform": p.platform,
            "date": p.scheduled_time.isoformat(),
            "status": p.status,
            "caption": p.caption,
            "thumbnail": "",
            "mediaUrl": p.media_url
        })
    return result

@router.post("/posts")
def create_scheduled_post(post: ScheduledPostCreate, request: Request, db: Session = Depends(get_db)):
    user_id = get_user_id(request)
    
    # Look up the clip from Supabase to get its local file path
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    try:
        clip_data = supabase.table("clips").select("clip_storage_path, title, status").eq("id", post.clip_id).single().execute()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Clip not found: {e}")

    if not clip_data.data:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip_info = clip_data.data
    if clip_info.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Clip is not ready for posting")

    media_url = clip_info.get("clip_storage_path", "")

    new_post = ScheduledPost(
        user_id=user_id,
        clip_id=post.clip_id,
        platform=post.platform,
        scheduled_time=post.scheduled_time,
        caption=post.caption,
        status="scheduled",
        media_url=media_url  # local absolute path to the video file
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {"status": "success", "post_id": new_post.id}


class PostNowRequest(BaseModel):
    clip_id: str  # UUID string
    platform: str
    caption: str


@router.post("/posts/now")
async def post_now(body: PostNowRequest, request: Request, db: Session = Depends(get_db)):
    """Immediately upload a clip to the selected platform (no scheduling)."""
    user_id = get_user_id(request)

    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    # Look up the clip
    try:
        clip_data = supabase.table("clips").select("clip_storage_path, title, status").eq("id", body.clip_id).single().execute()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Clip not found: {e}")

    if not clip_data.data:
        raise HTTPException(status_code=404, detail="Clip not found")

    clip_info = clip_data.data
    if clip_info.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Clip is not ready for posting")

    media_url = clip_info.get("clip_storage_path", "")

    # Get connected account
    account = db.query(ConnectedAccount).filter_by(
        user_id=user_id,
        platform=body.platform
    ).first()

    if not account or not account.access_token:
        raise HTTPException(
            status_code=400,
            detail=f"No connected {body.platform} account. Please connect it first in Settings."
        )

    # Create the post record
    from datetime import timezone
    now = datetime.now(timezone.utc)

    new_post = ScheduledPost(
        user_id=user_id,
        clip_id=body.clip_id,
        platform=body.platform,
        scheduled_time=now,
        caption=body.caption,
        status="posting",
        media_url=media_url,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Immediately upload
    success = False
    error_detail = f"Upload to {body.platform} failed"
    try:
        if body.platform == "youtube":
            from cron_jobs import post_to_youtube
            success = await post_to_youtube(new_post, account, db)
        elif body.platform == "instagram":
            from cron_jobs import post_to_instagram
            success = await post_to_instagram(new_post, account)
        elif body.platform == "tiktok":
            from cron_jobs import post_to_tiktok
            success = await post_to_tiktok(new_post, account)
    except Exception as e:
        print(f"[POST NOW] Upload error: {e}")
        success = False
        error_detail = str(e)

    new_post.status = "posted" if success else "failed"
    db.commit()

    if not success:
        raise HTTPException(status_code=500, detail=error_detail)

    return {"status": "posted", "post_id": new_post.id}
