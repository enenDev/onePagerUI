import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus
load_dotenv()

DATABASE_URL = os.getenv("APP_DATABASE_URL")
INSTANCE_CONNECTION_NAME = os.getenv("DB_INSTANCE")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
DB_SCHEMA = os.getenv("DB_SCHEMA")
DB_HOST = os.getenv("DB_HOST")
PROJECT_ID =os.getenv("GCP_PROJECT_ID")
DB_REGION =os.getenv("DB_REGION")
DB_PORT =os.getenv("DB_PORT")
safe_password = quote_plus(DB_PASS)
# INSTANCE_CONNECTION_NAME=coe-landing-zone-18-ats-2246:us-central1:fractal-gcp-postgresql

# Detect Cloud Run (K_SERVICE is set automatically in Cloud Run)
if os.getenv("K_SERVICE"):
    scoket_path= f"/cloudsql/{PROJECT_ID}:{DB_REGION}:{DB_HOST}"
    DATABASE_URL = (
        f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{scoket_path}/{DB_NAME}"
        f"?options=-csearch_path%3D{DB_SCHEMA}"
    )
# DATABASE_URL="postgresql+psycopg2://postgres:Fractal@2026@127.0.0.1:5432/cop-dev?options=-csearch_path%3Dtest_dev"
DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?options=-csearch_path%3D{DB_SCHEMA}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()