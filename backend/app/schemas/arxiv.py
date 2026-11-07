from pydantic import BaseModel, Field

class ArxivSearchQuery(BaseModel):
    query: str = Field(..., min_length=1)
    category: str | None = None
    max_results: int = Field(default=10, ge=1, le=50)
    sort_by: str = Field(default="relevance", pattern="^(relevance|submittedDate|lastUpdatedDate)$")

class ArxivPaperResult(BaseModel):
    arxiv_id: str
    title: str
    authors: list[str]
    summary: str
    published: str
    updated: str
    pdf_url: str
    primary_category: str
    categories: list[str]

class ArxivIngestRequest(BaseModel):
    workspace_id: str
    arxiv_id: str
    title: str
    pdf_url: str
