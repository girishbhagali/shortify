from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # IP address or identifier
    original_video_url = Column(String, nullable=True) # YouTube URL or Local File
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    clips = relationship("Clip", back_populates="job")

class Clip(Base):
    __tablename__ = "clips"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    clip_number = Column(Integer)
    start_time = Column(Float)
    end_time = Column(Float)
    score = Column(Integer)
    transcript = Column(String)
    file_path = Column(String)
    video_url = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    job = relationship("Job", back_populates="clips")
