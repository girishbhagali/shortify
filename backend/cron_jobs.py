import os
import asyncio
import httpx
import time
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
from models import ScheduledPost, ConnectedAccount

scheduler = AsyncIOScheduler()

async def post_to_instagram(post: ScheduledPost, account: ConnectedAccount):
    print(f"Posting to Instagram: {post.caption} with media {post.media_url}")
    # Placeholder for actual Graph API call
    # e.g., POST https://graph.facebook.com/v18.0/{ig_user_id}/media
    return True

async def post_to_tiktok(post: ScheduledPost, account: ConnectedAccount):
    print(f"Posting to TikTok: {post.caption} with media {post.media_url}")
    # Placeholder for TikTok API call
    return True

async def post_to_youtube(post: ScheduledPost, account: ConnectedAccount, db: Session) -> bool:
    """Upload a video to YouTube as a Short using YouTube Data API v3.

    Uses resumable upload for reliable large-file transfers.
    The video's description includes #Shorts to trigger Shorts treatment.
    """
    from auth_routes import refresh_youtube_token

    video_path = post.media_url  # local absolute path to the MP4 file
    if not video_path or not os.path.isfile(video_path):
        print(f"[YOUTUBE] Video file not found: {video_path}")
        raise Exception("Video file not found or has expired.")

    # Refresh token if expired
    try:
        now = datetime.now(timezone.utc)
        if account.expires_at:
            exp = account.expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp <= now:
                print("[YOUTUBE] Access token expired, refreshing...")
                refresh_youtube_token(account, db)
    except Exception as e:
        print(f"[YOUTUBE] Token refresh failed: {e}")
        raise Exception(f"YouTube authentication failed: {e}")

    access_token = account.access_token

    # Build video metadata
    # Append #Shorts to the description to ensure YouTube treats it as a Short
    caption = post.caption or ""
    if "#Shorts" not in caption and "#shorts" not in caption:
        caption = f"{caption}\n\n#Shorts".strip()

    # Extract a title from the first line of the caption, or use a default
    title_text = caption.split("\n")[0][:100] or "Short Video"

    metadata = {
        "snippet": {
            "title": title_text,
            "description": caption,
            "tags": ["Shorts", "ShortifyAI"],
            "categoryId": "22",  # "People & Blogs"
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
        },
    }

    try:
        import json

        file_size = os.path.getsize(video_path)

        # Step 1: Initiate resumable upload
        async with httpx.AsyncClient(timeout=120) as client:
            init_resp = await client.post(
                "https://www.googleapis.com/upload/youtube/v3/videos"
                "?uploadType=resumable&part=snippet,status",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Upload-Content-Type": "video/mp4",
                    "X-Upload-Content-Length": str(file_size),
                },
                content=json.dumps(metadata),
            )

            if init_resp.status_code not in (200, 308):
                print(f"[YOUTUBE] Init upload failed ({init_resp.status_code}): {init_resp.text}")
                if "youtubeSignupRequired" in init_resp.text:
                    raise Exception("Your Google account doesn't have a YouTube channel. Please go to youtube.com, create a channel, and try again.")
                raise Exception(f"YouTube upload failed: {init_resp.text}")

            upload_url = init_resp.headers.get("Location")
            if not upload_url:
                print("[YOUTUBE] No upload URL in response headers")
                return False

        # Step 2: Upload the video file
        async with httpx.AsyncClient(timeout=600) as client:
            with open(video_path, "rb") as f:
                video_bytes = f.read()

            upload_resp = await client.put(
                upload_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "video/mp4",
                    "Content-Length": str(file_size),
                },
                content=video_bytes,
            )

            if upload_resp.status_code in (200, 201):
                resp_data = upload_resp.json()
                video_id = resp_data.get("id", "unknown")
                print(f"[YOUTUBE] ✅ Upload successful! Video ID: {video_id}")
                print(f"[YOUTUBE]    URL: https://www.youtube.com/shorts/{video_id}")
                return True
            else:
                print(f"[YOUTUBE] Upload failed ({upload_resp.status_code}): {upload_resp.text}")
                raise Exception(f"YouTube upload failed: {upload_resp.text}")

    except Exception as e:
        print(f"[YOUTUBE] Upload error: {e}")
        import traceback
        traceback.print_exc()
        raise e


def send_notification_email(user_email: str, post: ScheduledPost, success: bool):
    # This is a stub for an email dispatch (e.g., via Resend or SendGrid)
    status = "SUCCESS" if success else "FAILED"
    print(f"[EMAIL MOCK] Sent to {user_email}: Post to {post.platform} was {status}.")
    
async def check_scheduled_posts():
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # Find posts that are scheduled and their time is <= now
        posts = db.query(ScheduledPost).filter(
            ScheduledPost.status == "scheduled",
            ScheduledPost.scheduled_time <= now
        ).all()
        
        if not posts:
            return

        print(f"Found {len(posts)} posts to publish.")

        for post in posts:
            try:
                # Get the user's connected account for this platform
                account = db.query(ConnectedAccount).filter_by(
                    user_id=post.user_id, 
                    platform=post.platform
                ).first()
                
                if not account or not account.access_token:
                    print(f"No connected account for user {post.user_id} on {post.platform}")
                    post.status = "failed"
                    send_notification_email("user@example.com", post, False)
                    continue

                success = False
                if post.platform == "instagram":
                    success = await post_to_instagram(post, account)
                elif post.platform == "tiktok":
                    success = await post_to_tiktok(post, account)
                elif post.platform == "youtube":
                    success = await post_to_youtube(post, account, db)
                
                if success:
                    post.status = "posted"
                else:
                    post.status = "failed"
                
                send_notification_email("user@example.com", post, success)
                    
            except Exception as e:
                print(f"Error posting ID {post.id}: {e}")
                post.status = "failed"
                send_notification_email("user@example.com", post, False)
                
        db.commit()
    finally:
        db.close()


async def cleanup_old_clips():
    """Delete local clip files older than 24 hours and mark them expired in the DB.

    Clips are stored temporarily in backend/tmp_clips/.  This cron runs every
    hour and removes any _processed.mp4 / _thumb.jpg / _temp_cut.mp4 files
    that are older than CLIP_TTL_HOURS hours, then marks the corresponding
    DB record as 'expired' so the frontend can show a friendly message.
    """
    CLIP_TTL_HOURS = 24
    CLIP_TTL_SECONDS = CLIP_TTL_HOURS * 3600

    tmp_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "tmp_clips")
    )
    if not os.path.isdir(tmp_dir):
        return

    now = time.time()
    deleted_count = 0

    try:
        for fname in os.listdir(tmp_dir):
            fpath = os.path.join(tmp_dir, fname)
            if not os.path.isfile(fpath):
                continue
            age_seconds = now - os.path.getmtime(fpath)
            if age_seconds >= CLIP_TTL_SECONDS:
                try:
                    os.remove(fpath)
                    deleted_count += 1
                except Exception as rm_err:
                    print(f"[CLEANUP] Could not delete {fpath}: {rm_err}")
    except Exception as e:
        print(f"[CLEANUP] Error scanning tmp_clips: {e}")
        return

    if deleted_count:
        print(f"[CLEANUP] Removed {deleted_count} expired file(s) from tmp_clips/")

    # Mark DB records whose local file no longer exists as 'expired'
    try:
        from dotenv import load_dotenv
        load_dotenv(override=True)
        from supabase import create_client
        supa_url = os.environ.get("SUPABASE_URL")
        supa_key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not supa_url or not supa_key:
            return
        sb = create_client(supa_url, supa_key)

        # Fetch all 'ready' clips whose storage path looks like a local absolute path
        res = sb.table("clips").select("id, clip_storage_path").eq("status", "ready").execute()
        expired_ids = []
        for row in (res.data or []):
            path = row.get("clip_storage_path", "")
            # Local path = absolute path that no longer exists on disk
            if path and os.path.isabs(path) and not os.path.isfile(path):
                expired_ids.append(row["id"])

        for clip_id in expired_ids:
            try:
                sb.table("clips").update({"status": "expired"}).eq("id", clip_id).execute()
            except Exception as upd_err:
                print(f"[CLEANUP] Could not mark clip {clip_id} expired: {upd_err}")

        if expired_ids:
            print(f"[CLEANUP] Marked {len(expired_ids)} clip(s) as 'expired' in DB")
    except Exception as e:
        print(f"[CLEANUP] DB update error: {e}")


def start_scheduler():
    scheduler.add_job(check_scheduled_posts, 'interval', minutes=1)
    scheduler.add_job(cleanup_old_clips, 'interval', hours=1)
    scheduler.start()
    print("APScheduler started: checking for scheduled posts every minute, clip cleanup every hour.")
