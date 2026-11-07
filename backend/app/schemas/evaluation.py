from pydantic import BaseModel, Field

class EvaluationRunRequest(BaseModel):
    workspace_id: str
    document_ids: list[str] = Field(default_factory=list)
    sample_queries: list[str] = Field(default_factory=list)
    llm_model: str | None = None

class StrategyMetric(BaseModel):
    strategy: str
    retrieval_relevance: float
    context_precision: float
    answer_faithfulness: float
    citation_validity: float
    average_latency_ms: float

class EvaluationDashboardResponse(BaseModel):
    workspace_id: str
    total_evaluations: int
    metrics: list[StrategyMetric]
    detailed_results: list[dict]
