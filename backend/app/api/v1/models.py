from fastapi import APIRouter, Query
from app.core.groq_client import groq_service

router = APIRouter(prefix="/models", tags=["models"])

@router.get("", response_model=list[str])
def list_available_models(refresh: bool = Query(False)):
    return groq_service.get_available_models(refresh=refresh)
