import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

import sys

load_dotenv()

# The user provided connection string
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shortify.db")

# 1. Validation: Prevent using HTTPS URLs as Database URLs
if SQLALCHEMY_DATABASE_URL.startswith("https://") or SQLALCHEMY_DATABASE_URL.startswith("http://"):
    print(f"[FATAL] Invalid DATABASE_URL: {SQLALCHEMY_DATABASE_URL}")
    print("[FATAL] DATABASE_URL must be a PostgreSQL connection string (postgresql://...), not a REST API URL.")
    sys.exit(1)

# SQLAlchemy 1.4+ requires "postgresql://" instead of "postgres://"
# Render provides URLs starting with "postgres://", so we fix it on the fly:
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite requires a special argument
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
