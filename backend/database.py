import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "manager")
DB_NAME = os.getenv("DB_NAME", "parknow")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Performance tuning for serverless (Vercel)
connect_args = {}
if "ssl" in SQLALCHEMY_DATABASE_URL:
    # Example for Aiven/DigitalOcean which require SSL
    connect_args["ssl"] = {"ca": "/etc/ssl/certs/ca-certificates.crt"}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
