from app.workflows.basic_rag import basic_rag_app
from app.workflows.fusion_rag import fusion_rag_app
from app.workflows.hyde_rag import hyde_rag_app
from app.workflows.state import RAGState

def test_basic_rag_workflow_execution():
    state: RAGState = {
        "query": "What are transformer models?",
        "workspace_id": "test-ws",
        "document_ids": [],
        "llm_model": "",
        "top_k": 3,
        "rrf_k": 60,
        "hypothetical_doc": "",
        "sub_queries": [],
        "retrieved_chunks": [],
        "final_answer": "",
        "citations": [],
        "latency_ms": 0.0,
    }
    result = basic_rag_app.invoke(state)
    assert "final_answer" in result
    assert isinstance(result["citations"], list)

def test_hyde_rag_workflow_execution():
    state: RAGState = {
        "query": "How does self-attention mechanism work?",
        "workspace_id": "test-ws",
        "document_ids": [],
        "llm_model": "",
        "top_k": 3,
        "rrf_k": 60,
        "hypothetical_doc": "",
        "sub_queries": [],
        "retrieved_chunks": [],
        "final_answer": "",
        "citations": [],
        "latency_ms": 0.0,
    }
    result = hyde_rag_app.invoke(state)
    assert "hypothetical_doc" in result
    assert "final_answer" in result

def test_fusion_rag_workflow_execution():
    state: RAGState = {
        "query": "Explain reciprocal rank fusion",
        "workspace_id": "test-ws",
        "document_ids": [],
        "llm_model": "",
        "top_k": 3,
        "rrf_k": 60,
        "hypothetical_doc": "",
        "sub_queries": [],
        "retrieved_chunks": [],
        "final_answer": "",
        "citations": [],
        "latency_ms": 0.0,
    }
    result = fusion_rag_app.invoke(state)
    assert "sub_queries" in result
    assert len(result["sub_queries"]) >= 1
    assert "final_answer" in result
