from typing import TypedDict

class RAGState(TypedDict):
    query: str
    workspace_id: str
    document_ids: list[str]
    llm_model: str
    top_k: int
    rrf_k: int
    hypothetical_doc: str
    sub_queries: list[str]
    retrieved_chunks: list[dict]
    final_answer: str
    citations: list[dict]
    latency_ms: float
