from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None

class WorkspaceRead(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
    document_count: int = 0
    conversation_count: int = 0
