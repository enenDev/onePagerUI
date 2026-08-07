from fastapi import FastAPI

from app.config import APP_NAME

app = FastAPI(title=APP_NAME)

@app.get("/")
def root():
    return {"message":"App is running"}