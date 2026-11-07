import json
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, field_validator

class BoundingBox(BaseModel):
    ymin: float
    xmin: float
    ymax: float
    xmax: float

class ChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    page_number: int
    chunk_index: int
    text: str
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

class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    title: str
    file_name: str
    file_path: str
    file_hash: str
    arxiv_id: str | None = None
    total_pages: int
    chunk_count: int
    status: str
    created_at: datetime
