from fastapi import APIRouter
from app.api.v1.analysis import router as analysis_router
from app.api.v1.arxiv import router as arxiv_router
from app.api.v1.chat import router as chat_router
from app.api.v1.documents import router as documents_router
from app.api.v1.evaluation import router as evaluation_router
from app.api.v1.models import router as models_router
from app.api.v1.workspaces import router as workspaces_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(workspaces_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(arxiv_router)
api_v1_router.include_router(models_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(analysis_router)
api_v1_router.include_router(evaluation_router)
