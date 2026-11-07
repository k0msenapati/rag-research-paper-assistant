from pydantic import BaseModel, Field
from app.schemas.chat import CitationRead

class SummaryRequest(BaseModel):
    document_id: str
    llm_model: str | None = None

class SummaryResponse(BaseModel):
    document_id: str
    document_title: str
    objective: str
    problem: str
    methodology: str
    models_and_technologies: str
    dataset: str
    results: str
    limitations: str
    future_scope: str
    citations: list[CitationRead] = Field(default_factory=list)

class ComparisonRequest(BaseModel):
    document_ids: list[str] = Field(..., min_length=2)
    llm_model: str | None = None

class PaperComparisonRow(BaseModel):
    aspect: str
    paper_analyses: dict[str, str]

class ComparisonResponse(BaseModel):
    documents: list[dict[str, str]]
    comparison_table: list[PaperComparisonRow]
    synthesis: str
    citations: list[CitationRead] = Field(default_factory=list)

class LitReviewRequest(BaseModel):
    workspace_id: str
    document_ids: list[str] = Field(default_factory=list)
    topic: str | None = None
    llm_model: str | None = None

class LitReviewResponse(BaseModel):
    topic: str
    synthesis: str
    review_matrix: list[dict[str, str]]
    citations: list[CitationRead] = Field(default_factory=list)
