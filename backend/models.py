from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # IP address or identifier
    original_video_url = Column(String, nullable=True) # YouTube URL or Local File
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Clip(Base):
    __tablename__ = "clips"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    
    # Video info
    title = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    source_title = Column(String, nullable=True)
    
    # Storage paths (permanent)
    clip_storage_path = Column(String, nullable=False)
    thumbnail_storage_path = Column(String, nullable=True)
    caption_storage_path = Column(String, nullable=True)
    
    # Video metadata
    duration_seconds = Column(Integer, nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    resolution = Column(String, default="1080x1920")
    aspect_ratio = Column(String, default="9:16")
    fps = Column(Integer, default=30)
    
    # AI data
    viral_score = Column(Integer, default=0)
    transcript = Column(JSONB, default=list)
    ai_titles = Column(ARRAY(String), default=list)
    ai_hashtags = Column(ARRAY(String), default=list)
    ai_caption = Column(String, nullable=True)
    
    # Platform features applied
    has_captions = Column(Boolean, default=False)
    has_music = Column(Boolean, default=False)
    has_hook = Column(Boolean, default=False)
    platforms = Column(ARRAY(String), default=list)
    
    # Status
    status = Column(String, default="processing")
    error_message = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)
    last_viewed_at = Column(DateTime, nullable=True)

    scheduled_posts = relationship("ScheduledPost", back_populates="clip")

class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    platform = Column(String, index=True)
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    handle = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    clip_id = Column(UUID(as_uuid=True), ForeignKey("clips.id"), nullable=True)
    platform = Column(String, index=True)
    scheduled_time = Column(DateTime, index=True)
    caption = Column(String, nullable=True)
    status = Column(String, default="scheduled", index=True) # scheduled, posted, failed
    media_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    clip = relationship("Clip", back_populates="scheduled_posts")
