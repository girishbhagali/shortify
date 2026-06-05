import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import ConnectedAccount

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))
Session = sessionmaker(bind=engine)
db = Session()

accounts = db.query(ConnectedAccount).all()
print("Total connected accounts:", len(accounts))
for a in accounts:
    print(f"ID: {a.id}, User ID: '{a.user_id}', Platform: {a.platform}")
