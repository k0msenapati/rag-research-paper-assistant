from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analysis import (
    ComparisonRequest,
    ComparisonResponse,
    LitReviewRequest,
    LitReviewResponse,
    SummaryRequest,
    SummaryResponse,
)
from app.services.analysis_service import analysis_service

router = APIRouter(prefix="/analysis", tags=["analysis"])

@router.post("/summary", response_model=SummaryResponse)
def get_paper_summary(payload: SummaryRequest, db: Session = Depends(get_db)):
    try:
        return analysis_service.summarize_paper(
            db=db,
            document_id=payload.document_id,
            llm_model=payload.llm_model,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/compare", response_model=ComparisonResponse)
def compare_papers(payload: ComparisonRequest, db: Session = Depends(get_db)):
    try:
        return analysis_service.compare_papers(
            db=db,
            document_ids=payload.document_ids,
            llm_model=payload.llm_model,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/lit-review", response_model=LitReviewResponse)
def generate_lit_review(payload: LitReviewRequest, db: Session = Depends(get_db)):
    try:
        return analysis_service.generate_literature_review(
            db=db,
            workspace_id=payload.workspace_id,
            document_ids=payload.document_ids if payload.document_ids else None,
            topic=payload.topic,
            llm_model=payload.llm_model,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
