from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_workspace_or_404
from app.core.database import get_db
from app.models.conversation import Conversation
from app.models.document import Document
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceUpdate

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

@router.get("", response_model=list[WorkspaceRead])
def list_workspaces(db: Session = Depends(get_db)):
    workspaces = db.query(Workspace).order_by(Workspace.updated_at.desc()).all()
    results: list[WorkspaceRead] = []
    for ws in workspaces:
        doc_count = db.query(Document).filter(Document.workspace_id == ws.id).count()
        convo_count = db.query(Conversation).filter(Conversation.workspace_id == ws.id).count()
        read_obj = WorkspaceRead.model_validate(ws)
        read_obj.document_count = doc_count
        read_obj.conversation_count = convo_count
        results.append(read_obj)
    return results

@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_workspace(payload: WorkspaceCreate, db: Session = Depends(get_db)):
    ws = Workspace(
        name=payload.name,
        description=payload.description,
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    read_obj = WorkspaceRead.model_validate(ws)
    read_obj.document_count = 0
    read_obj.conversation_count = 0
    return read_obj

@router.get("/{workspace_id}", response_model=WorkspaceRead)
def get_workspace(
    workspace_id: str,
    ws: Workspace = Depends(get_workspace_or_404),
    db: Session = Depends(get_db),
):
    doc_count = db.query(Document).filter(Document.workspace_id == ws.id).count()
    convo_count = db.query(Conversation).filter(Conversation.workspace_id == ws.id).count()
    read_obj = WorkspaceRead.model_validate(ws)
    read_obj.document_count = doc_count
    read_obj.conversation_count = convo_count
    return read_obj

@router.put("/{workspace_id}", response_model=WorkspaceRead)
def update_workspace(
    workspace_id: str,
    payload: WorkspaceUpdate,
    ws: Workspace = Depends(get_workspace_or_404),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        ws.name = payload.name
    if payload.description is not None:
        ws.description = payload.description
    db.commit()
    db.refresh(ws)
    return get_workspace(workspace_id=workspace_id, ws=ws, db=db)

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: str,
    ws: Workspace = Depends(get_workspace_or_404),
    db: Session = Depends(get_db),
):
    db.delete(ws)
    db.commit()
    return None
