import json
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, field_validator

class CitationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    citation_index: int
    document_id: str
    document_title: str | None = None
    chunk_id: str
    page_number: int
    quoted_text: str
    bounding_box: list[float]

    @field_validator("bounding_box", mode="before")
    @classmethod
    def parse_bounding_box(cls, v: Any) -> list[float]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [0.0, 0.0, 0.0, 0.0]
        return v

class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    rag_strategy: str
    latency_ms: float
    created_at: datetime
    citations: list[CitationRead] = Field(default_factory=list)

class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    title: str
    rag_strategy: str
    llm_model: str
    created_at: datetime
    messages: list[MessageRead] = Field(default_factory=list)

class ChatRequest(BaseModel):
    workspace_id: str
    conversation_id: str | None = None
    query: str = Field(..., min_length=1)
    rag_strategy: str = Field(default="basic", pattern="^(basic|hyde|fusion)$")
    llm_model: str | None = None
    document_ids: list[str] = Field(default_factory=list)
    top_k: int = Field(default=5, ge=1, le=20)
    rrf_k: int = Field(default=60, ge=1, le=200)

class ChatStreamPayload(BaseModel):
    event: str
    data: str
