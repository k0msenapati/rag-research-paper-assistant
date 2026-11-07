import time
from langgraph.graph import END, StateGraph
from app.core.embeddings import embedding_service
from app.core.groq_client import groq_service
from app.core.vector_store import VectorStore
from app.services.citation_service import citation_service
from app.workflows.state import RAGState

def retrieve_node(state: RAGState) -> dict:
    query_vec = embedding_service.embed_query(state["query"])
    chunks = VectorStore.query_chunks(
        query_embedding=query_vec,
        n_results=state.get("top_k", 5),
        workspace_id=state.get("workspace_id"),
        document_ids=state.get("document_ids"),
    )
    return {"retrieved_chunks": chunks}

def generate_node(state: RAGState) -> dict:
    chunks = state.get("retrieved_chunks", [])
    if not chunks:
        return {
            "final_answer": "The selected research papers do not contain sufficient information to answer this question.",
            "citations": [],
        }

    context = citation_service.format_context_for_llm(chunks)
    num_chunks = len(chunks)
    system_prompt = (
        "You are an academic research assistant named PaperPilot AI. "
        "Answer the user query strictly using the provided context chunks. "
        f"The context has {num_chunks} chunks labeled [1] through [{num_chunks}]. "
        f"Cite supporting claims using ONLY the chunk numbers [1] through [{num_chunks}]. "
        "NEVER copy bibliography citation numbers from within the paper text (such as [57], [12], etc.) — always use the matching context chunk index [1]..[N]. "
        "If the provided context is insufficient, explicitly state that the documents do not contain the answer."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {state['query']}"},
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

def build_basic_rag_workflow():
    workflow = StateGraph(RAGState)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("generate", generate_node)
    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", END)
    return workflow.compile()

basic_rag_app = build_basic_rag_workflow()
