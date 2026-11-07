from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_v1_router
from app.config import settings
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.ensure_directories()
    init_db()
    yield

app = FastAPI(
    title="PaperPilot AI API",
    version="1.0.0",
    description="Production-minded AI Research Paper Assistant Backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "PaperPilot AI", "version": "1.0.0"}

@app.get("/")
def root():
    return {"message": "PaperPilot AI Backend API. Explore documentation at /docs"}
