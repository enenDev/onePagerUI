import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus
load_dotenv()

DATABASE_URL = os.getenv("APP_DATABASE_URL")
INSTANCE_CONNECTION_NAME = os.getenv("DB_INSTANCE")
DB_USER = os.getenv("DB_USER")
# support either DB_PASSWORD or DB_PASS in env
DB_PASS = os.getenv("DB_PASSWORD") or os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_SCHEMA = os.getenv("DB_SCHEMA")
DB_HOST = os.getenv("DB_HOST")
PROJECT_ID =os.getenv("GCP_PROJECT_ID")
DB_REGION =os.getenv("DB_REGION")
DB_PORT =os.getenv("DB_PORT")
# URL-encode password if present
safe_password = quote_plus(DB_PASS) if DB_PASS else ""
# INSTANCE_CONNECTION_NAME=coe-landing-zone-18-ats-2246:us-central1:fractal-gcp-postgresql

# Detect Cloud Run (K_SERVICE is set automatically in Cloud Run)


# If a full DATABASE_URL is provided (e.g. injected from Secret Manager), use it.
if DATABASE_URL:
    print("Using DATABASE_URL from environment")
else:
    # Prefer Cloud Run / Cloud SQL socket when instance connection name is available
    if os.getenv("K_SERVICE") and INSTANCE_CONNECTION_NAME:
        DATABASE_URL = (
            f"postgresql+psycopg2://{DB_USER}:{safe_password}@/{DB_NAME}"
            f"?host=/cloudsql/{INSTANCE_CONNECTION_NAME}&options=-csearch_path%3D{DB_SCHEMA}"
        )
        print("Using Cloud SQL Unix socket via INSTANCE_CONNECTION_NAME")
    else:
        # Fallback to TCP connection (local dev or external DB)
        DATABASE_URL = (
            f"postgresql+psycopg2://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
            f"?options=-csearch_path%3D{DB_SCHEMA}"
        )
        print("Using TCP DB host/port connection")
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