from langgraph.graph import END, StateGraph
from app.core.embeddings import embedding_service
from app.core.groq_client import groq_service
from app.core.vector_store import VectorStore
from app.services.citation_service import citation_service
from app.workflows.state import RAGState

def generate_hypothetical_node(state: RAGState) -> dict:
    prompt = (
        "Write a concise hypothetical excerpt from an academic research paper that directly answers the question below. "
        "Do not include citations or meta-commentary, just the scientific passage.\n\n"
        f"Question: {state['query']}"
    )
    hypo_text = groq_service.chat_completion(
        messages=[{"role": "user", "content": prompt}],
        model=state.get("llm_model"),
        temperature=0.5,
        max_tokens=500,
    )
    return {"hypothetical_doc": hypo_text}

def retrieve_with_hypothetical_node(state: RAGState) -> dict:
    search_text = f"{state['query']}\n{state.get('hypothetical_doc', '')}"
    query_vec = embedding_service.embed_query(search_text)
    chunks = VectorStore.query_chunks(
        query_embedding=query_vec,
        n_results=state.get("top_k", 5),
        workspace_id=state.get("workspace_id"),
        document_ids=state.get("document_ids"),
    )
    return {"retrieved_chunks": chunks}

def generate_final_answer_node(state: RAGState) -> dict:
    chunks = state.get("retrieved_chunks", [])
    if not chunks:
        return {
            "final_answer": "The selected research papers do not contain sufficient information to answer this question.",
            "citations": [],
        }

    context = citation_service.format_context_for_llm(chunks)
    num_chunks = len(chunks)
    system_prompt = (
        "You are PaperPilot AI, an academic research assistant using HyDE retrieval. "
        "Answer the user query strictly using the real retrieved academic chunks below. "
        f"The context has {num_chunks} chunks labeled [1] through [{num_chunks}]. "
        f"Cite supporting claims using ONLY the chunk numbers [1] through [{num_chunks}]. "
        "NEVER copy bibliography citation numbers from within the paper text (such as [57], [12], etc.) — always use the matching context chunk index [1]..[N]. "
        "Do not rely on imaginary information."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Real Retrieved Context:\n{context}\n\nQuestion: {state['query']}"},
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

def build_hyde_rag_workflow():
    workflow = StateGraph(RAGState)
    workflow.add_node("generate_hypothetical", generate_hypothetical_node)
    workflow.add_node("retrieve_with_hypothetical", retrieve_with_hypothetical_node)
    workflow.add_node("generate_final_answer", generate_final_answer_node)

    workflow.set_entry_point("generate_hypothetical")
    workflow.add_edge("generate_hypothetical", "retrieve_with_hypothetical")
    workflow.add_edge("retrieve_with_hypothetical", "generate_final_answer")
    workflow.add_edge("generate_final_answer", END)
    return workflow.compile()

hyde_rag_app = build_hyde_rag_workflow()
