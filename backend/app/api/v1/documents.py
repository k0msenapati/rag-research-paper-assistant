import json
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_workspace_or_404
from app.config import settings
from app.core.database import get_db
from app.core.vector_store import VectorStore
from app.models.chunk import Chunk
from app.models.document import Document
from app.schemas.document import ChunkRead, DocumentRead
from app.services.ingestion import ingestion_service

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("", response_model=list[DocumentRead])
def list_documents(workspace_id: str, db: Session = Depends(get_db)):
    docs = (
        db.query(Document)
        .filter(Document.workspace_id == workspace_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return docs

@router.post("/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def upload_document(
    response: Response,
    background_tasks: BackgroundTasks,
    workspace_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    get_workspace_or_404(workspace_id=workspace_id, db=db)

    file_bytes = file.file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    file_hash = ingestion_service.calculate_file_hash(file_bytes)
    existing_doc = (
        db.query(Document)
        .filter(Document.workspace_id == workspace_id, Document.file_hash == file_hash)
        .first()
    )
    if existing_doc:
        response.status_code = status.HTTP_200_OK
        return existing_doc

    doc_id = str(uuid.uuid4())
    file_ext = Path(file.filename or "paper.pdf").suffix or ".pdf"
    saved_filename = f"{doc_id}{file_ext}"
    dest_path = Path(settings.PDF_STORAGE_PATH) / saved_filename
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    with open(dest_path, "wb") as f:
        f.write(file_bytes)

    clean_title = Path(file.filename or "Research Paper").stem.replace("_", " ").title()
    doc = Document(
        id=doc_id,
        workspace_id=workspace_id,
        title=clean_title,
        file_name=file.filename or "paper.pdf",
        file_path=str(dest_path),
        file_hash=file_hash,
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
            workspace_id=workspace_id,
            file_path=str(dest_path),
        )
    except Exception as e:
        doc.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest PDF: {e}",
        )

    return doc

@router.get("/{document_id}", response_model=DocumentRead)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found",
        )
    return doc

@router.get("/{document_id}/chunks", response_model=list[ChunkRead])
def get_document_chunks(document_id: str, db: Session = Depends(get_db)):
    chunks = (
        db.query(Chunk)
        .filter(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index.asc())
        .all()
    )
    results: list[ChunkRead] = []
    for c in chunks:
        bbox = json.loads(c.bounding_box) if isinstance(c.bounding_box, str) else c.bounding_box
        results.append(
            ChunkRead(
                id=c.id,
                document_id=c.document_id,
                page_number=c.page_number,
                chunk_index=c.chunk_index,
                text=c.text,
                bounding_box=bbox,
            )
        )
    return results

@router.get("/{document_id}/pdf")
def get_document_pdf(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF file does not exist on disk",
        )
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=doc.file_name,
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    try:
        Path(doc.file_path).unlink(missing_ok=True)
    except Exception:
        pass

    VectorStore.delete_document_chunks(document_id=doc.id)
    db.delete(doc)
    db.commit()
    return None
