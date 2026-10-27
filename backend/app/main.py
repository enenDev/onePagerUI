"""
FastAPI application entry point.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

from app.db import engine, Base

# Import all models so SQLAlchemy registers them before create_all
from app.services.auth_service import verify_bearer_token
# API router
from app.api.v1.router import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan: create tables and seed data on startup (skip in test mode).
    """
    yield  # Application runs here


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=os.getenv("APP_TITLE", "National One-Pager API"),
    description=(
        "Backend API for creating, managing, and publishing National One-Pagers. "
        "Supports a hierarchical Pager → Pillar → Initiative structure with "
        "WEIGHTED/UNWEIGHTED scoring modes."
    ),
    version=os.getenv("APP_VERSION", "1.0.0"),
    # lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dev.onepager.unileverservices.com","http://localhost:3000","http://localhost:5173","https://onepager.unileverservices.com","https://uat.onepager.unileverservices.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include router
# ---------------------------------------------------------------------------

app.include_router(router, dependencies=[Depends(verify_bearer_token)])

@app.get("/health", tags=["Health"], dependencies=[Depends(verify_bearer_token)])
def health_check(request: Request):
    """Service health check endpoint."""
    return {"status": "ok", "service": "National One-Pager API"}