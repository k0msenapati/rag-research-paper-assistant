import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_workspace_or_404
from app.config import settings
from app.core.database import get_db
from app.models.document import Document
from app.schemas.arxiv import ArxivIngestRequest, ArxivPaperResult
from app.schemas.document import DocumentRead
from app.services.arxiv_service import arxiv_service
from app.services.ingestion import ingestion_service

router = APIRouter(prefix="/arxiv", tags=["arxiv"])

@router.get("/search", response_model=list[ArxivPaperResult])
async def search_arxiv(
    query: str = Query(..., min_length=1),
    category: str | None = Query(None),
    max_results: int = Query(10, ge=1, le=50),
    sort_by: str = Query("relevance"),
):
    try:
        return await arxiv_service.search(
            query=query,
            category=category,
            max_results=max_results,
            sort_by=sort_by,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"arXiv API error: {e}",
        )

@router.post("/ingest", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def ingest_from_arxiv(
    payload: ArxivIngestRequest,
    db: Session = Depends(get_db),
):
    get_workspace_or_404(workspace_id=payload.workspace_id, db=db)

    existing = (
        db.query(Document)
        .filter(
            Document.workspace_id == payload.workspace_id,
            Document.arxiv_id == payload.arxiv_id,
        )
        .first()
    )
    if existing:
        return existing

    doc_id = str(uuid.uuid4())
    dest_path = Path(settings.PDF_STORAGE_PATH) / f"{doc_id}.pdf"

    try:
        await arxiv_service.download_pdf(payload.pdf_url, str(dest_path))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to download PDF from arXiv: {e}",
        )

    with open(dest_path, "rb") as f:
        file_bytes = f.read()

    file_hash = ingestion_service.calculate_file_hash(file_bytes)
    doc = Document(
        id=doc_id,
        workspace_id=payload.workspace_id,
        title=payload.title,
        file_name=f"{payload.arxiv_id}.pdf",
        file_path=str(dest_path),
        file_hash=file_hash,
        arxiv_id=payload.arxiv_id,
        total_pages=0,
        chunk_count=0,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        doc = ingestion_service.process_pdf(
            db=db,
            document_id=doc.id,
            workspace_id=payload.workspace_id,
            file_path=str(dest_path),
        )
    except Exception as e:
        doc.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process arXiv document: {e}",
        )

    return doc
