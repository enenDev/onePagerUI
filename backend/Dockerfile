FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps for common wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (includes alembic + psycopg2-binary)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend code (includes alembic.ini and migrations folder)
COPY . /app

ENV PORT=8080
ENV PYTHONPATH=/app

# Expose port for Cloud Run service
EXPOSE 8080

# Default CMD runs FastAPI, but Cloud Run Job will override with ["alembic", "upgrade", "head"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
