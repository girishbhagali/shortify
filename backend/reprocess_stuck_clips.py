"""
Re-run processing for clips stuck in 'processing' status.
Usage:
  python reprocess_stuck_clips.py
  python reprocess_stuck_clips.py --user-id <uuid>
"""
import argparse
import asyncio
import json
import os
import sys

from dotenv import load_dotenv

load_dotenv(override=True)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from supabase import create_client
from clip_generator import find_viral_segments
from services.clip_processor import process_and_store_clip
import yt_dlp
import uuid
import re

DEFAULT_USER = "57a57a3b-9ad5-49b8-9b28-0c1a8775acde"


def parse_segment_bounds(transcript_raw) -> tuple[float, float] | None:
    if not transcript_raw:
        return None
    if isinstance(transcript_raw, dict):
        data = transcript_raw
    else:
        try:
            data = json.loads(transcript_raw)
        except (json.JSONDecodeError, TypeError):
            return None
    if isinstance(data, dict) and "start_time" in data and "end_time" in data:
        return float(data["start_time"]), float(data["end_time"])
    return None


def download_youtube(url: str, base_dir: str) -> str:
    os.makedirs(base_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    ydl_opts = {
        "format": "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "outtmpl": f"{base_dir}/{file_id}_%(title)s.%(ext)s",
        "noplaylist": True,
        "quiet": False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return ydl.prepare_filename(info)


async def main(user_id: str) -> None:
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    stuck = (
        sb.table("clips")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "processing")
        .execute()
        .data
    )

    if not stuck:
        print("No stuck clips found.")
        return

    print(f"Found {len(stuck)} stuck clip(s) for user {user_id}")

    source_url = stuck[0].get("source_url")
    if not source_url or source_url == "uploaded_file":
        print("Cannot reprocess: source video was an upload and is no longer on disk. Generate again from the dashboard.")
        return

    base_dir = os.path.abspath(os.path.join("/tmp/shortifyai", "reprocess", user_id))
    print(f"Downloading source video: {source_url}")
    video_path = download_youtube(source_url, base_dir)
    print("Downloaded video OK")

    segments = find_viral_segments(video_path, len(stuck), 30)
    segments = sorted(segments, key=lambda s: s["score"], reverse=True)[: len(stuck)]

    settings = {"aiFeatures": {"autoCaptions": stuck[0].get("has_captions", False)}, "exportSettings": {}}

    for clip, segment in zip(stuck, segments):
        clip_id = clip["id"]
        bounds = parse_segment_bounds(clip.get("transcript"))
        start = bounds[0] if bounds else segment["start_time"]
        end = bounds[1] if bounds else segment["end_time"]
        print(f"\nReprocessing {clip_id} ({start}s -> {end}s)...")
        result = await process_and_store_clip(
            video_path, user_id, clip_id, start, end, settings
        )
        print(f"  -> {result.get('status', result)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--user-id", default=DEFAULT_USER)
    args = parser.parse_args()
    asyncio.run(main(args.user_id))
