import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# The user provided connection string
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.pweiapgkpexrerhwhjju:Girish%407972%23@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
