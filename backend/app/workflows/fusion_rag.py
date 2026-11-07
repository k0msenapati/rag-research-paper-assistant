from collections import defaultdict
from langgraph.graph import END, StateGraph
from app.core.embeddings import embedding_service
from app.core.groq_client import groq_service
from app.core.vector_store import VectorStore
from app.services.citation_service import citation_service
from app.workflows.state import RAGState

def compute_rrf(
    ranked_result_lists: list[list[dict]],
    rrf_k: int = 60,
) -> list[dict]:
    scores: dict[str, float] = defaultdict(float)
    chunk_map: dict[str, dict] = {}

    for result_list in ranked_result_lists:
        for rank, chunk in enumerate(result_list, start=1):
            cid = chunk["chunk_id"]
            scores[cid] += 1.0 / (rrf_k + rank)
            if cid not in chunk_map:
                chunk_map[cid] = chunk

    sorted_ids = sorted(scores.keys(), key=lambda cid: scores[cid], reverse=True)
    fused_chunks: list[dict] = []
    for cid in sorted_ids:
        item = dict(chunk_map[cid])
        item["score"] = scores[cid]
        fused_chunks.append(item)
    return fused_chunks

def generate_queries_node(state: RAGState) -> dict:
    prompt = (
        "Generate 3 diverse search queries related to the following academic research question. "
        "Each query should explore a different aspect or terminology of the topic. "
        "Output each query on a new line without numbering or bullet points.\n\n"
        f"Original Question: {state['query']}"
    )
    response = groq_service.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        model=state.get("llm_model"),
        temperature=0.6,
        max_tokens=300,
    )
    lines = [line.strip() for line in response.splitlines() if line.strip()]
    sub_queries = [state["query"]] + lines[:3]
    return {"sub_queries": sub_queries}

def multiquery_retrieve_and_rrf_node(state: RAGState) -> dict:
    queries = state.get("sub_queries", [state["query"]])
    top_k = state.get("top_k", 5)
    rrf_k = state.get("rrf_k", 60)

    ranked_lists: list[list[dict]] = []
    for q in queries:
        q_vec = embedding_service.embed_query(q)
        results = VectorStore.query_chunks(
            query_embedding=q_vec,
            n_results=top_k * 2,
            workspace_id=state.get("workspace_id"),
            document_ids=state.get("document_ids"),
        )
        ranked_lists.append(results)

    fused = compute_rrf(ranked_lists, rrf_k=rrf_k)
    return {"retrieved_chunks": fused[:top_k]}

def generate_fusion_answer_node(state: RAGState) -> dict:
    chunks = state.get("retrieved_chunks", [])
    if not chunks:
        return {
            "final_answer": "The selected research papers do not contain sufficient information to answer this question.",
            "citations": [],
        }

    context = citation_service.format_context_for_llm(chunks)
    num_chunks = len(chunks)
    system_prompt = (
        "You are PaperPilot AI, an academic research assistant using RAG-Fusion. "
        "Synthesize an answer using the provided multi-query fused context chunks. "
        f"The context has {num_chunks} chunks labeled [1] through [{num_chunks}]. "
        f"Cite supporting claims using ONLY the chunk numbers [1] through [{num_chunks}]. "
        "NEVER copy bibliography citation numbers from within the paper text (such as [57], [12], etc.) — always use the matching context chunk index [1]..[N]."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Fused Context:\n{context}\n\nQuestion: {state['query']}"},
    ]

    answer = groq_service.chat_completion(
        messages=messages,
        model=state.get("llm_model"),
        temperature=0.2,
    )

    cleaned_text, citations = citation_service.process_response(answer, chunks)
    return {
        "final_answer": cleaned_text,
        "citations": [c.model_dump() for c in citations],
    }

def build_fusion_rag_workflow():
    workflow = StateGraph(RAGState)
    workflow.add_node("generate_queries", generate_queries_node)
    workflow.add_node("multiquery_retrieve_and_rrf", multiquery_retrieve_and_rrf_node)
    workflow.add_node("generate_fusion_answer", generate_fusion_answer_node)

    workflow.set_entry_point("generate_queries")
    workflow.add_edge("generate_queries", "multiquery_retrieve_and_rrf")
    workflow.add_edge("multiquery_retrieve_and_rrf", "generate_fusion_answer")
    workflow.add_edge("generate_fusion_answer", END)
    return workflow.compile()

fusion_rag_app = build_fusion_rag_workflow()
