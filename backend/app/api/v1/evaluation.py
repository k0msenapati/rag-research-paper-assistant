from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.evaluation import EvaluationDashboardResponse, EvaluationRunRequest
from app.services.evaluation_service import evaluation_service

router = APIRouter(prefix="/evaluation", tags=["evaluation"])

@router.post("/run", response_model=EvaluationDashboardResponse)
def run_evaluation(payload: EvaluationRunRequest, db: Session = Depends(get_db)):
    try:
        return evaluation_service.run_benchmark(
            db=db,
            workspace_id=payload.workspace_id,
            document_ids=payload.document_ids if payload.document_ids else None,
            sample_queries=payload.sample_queries if payload.sample_queries else None,
            llm_model=payload.llm_model,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {e}",
        )
