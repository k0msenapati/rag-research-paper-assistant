from collections.abc import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.workspace import Workspace

def get_workspace_or_404(
    workspace_id: str,
    db: Session = Depends(get_db),
) -> Workspace:
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{workspace_id}' not found",
        )
    return ws
