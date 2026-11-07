import time
from collections.abc import Generator
from app.core.groq_client import groq_service
from app.services.citation_service import citation_service
from app.workflows.basic_rag import basic_rag_app, retrieve_node
from app.workflows.fusion_rag import fusion_rag_app, generate_queries_node, multiquery_retrieve_and_rrf_node
from app.workflows.hyde_rag import hyde_rag_app, generate_hypothetical_node, retrieve_with_hypothetical_node
from app.workflows.state import RAGState

class RAGRouter:
    @staticmethod
    def run_strategy(state: RAGState) -> RAGState:
        strategy = state.get("rag_strategy", "basic")
        start = time.time()

        if strategy == "hyde":
            result = hyde_rag_app.invoke(state)
        elif strategy == "fusion":
            result = fusion_rag_app.invoke(state)
        else:
            result = basic_rag_app.invoke(state)

        result["latency_ms"] = round((time.time() - start) * 1000, 2)
        return result

    @staticmethod
    def stream_strategy(
        state: RAGState,
    ) -> Generator[dict, None, None]:
        strategy = state.get("rag_strategy", "basic")
        start = time.time()

        if strategy == "hyde":
            hypo = generate_hypothetical_node(state)
            state["hypothetical_doc"] = hypo.get("hypothetical_doc", "")
            retrieved = retrieve_with_hypothetical_node(state)
            chunks = retrieved.get("retrieved_chunks", [])
        elif strategy == "fusion":
            sub_q = generate_queries_node(state)
            state["sub_queries"] = sub_q.get("sub_queries", [state["query"]])
            retrieved = multiquery_retrieve_and_rrf_node(state)
            chunks = retrieved.get("retrieved_chunks", [])
        else:
            retrieved = retrieve_node(state)
            chunks = retrieved.get("retrieved_chunks", [])

        if not chunks:
            yield {
                "type": "token",
                "content": "The selected research papers do not contain sufficient information to answer this question.",
            }
            yield {
                "type": "done",
                "citations": [],
                "latency_ms": round((time.time() - start) * 1000, 2),
            }
            return

        context = citation_service.format_context_for_llm(chunks)
        num_chunks = len(chunks)
        system_prompt = (
            f"You are PaperPilot AI, an academic research assistant using {strategy.upper()} RAG. "
            "Answer the question strictly using the provided context. "
            f"The context has {num_chunks} chunks labeled [1] through [{num_chunks}]. "
            f"Cite supporting claims using ONLY the chunk numbers [1] through [{num_chunks}]. "
            "NEVER copy bibliography citation numbers from within the paper text (such as [57], [12], etc.) — always use the matching context chunk index [1]..[N]. "
            "Write clean standard markdown. Do not use unicode non-breaking spaces or unrendered symbols."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {state['query']}"},
        ]

        full_content: list[str] = []
        for token in groq_service.stream_chat_completion(
            messages=messages,
            model=state.get("llm_model"),
            temperature=0.2,
        ):
            clean_token = citation_service.normalize_text(token)
            full_content.append(clean_token)
            yield {"type": "token", "content": clean_token}

        raw_text = "".join(full_content)
        cleaned_text, citations = citation_service.process_response(raw_text, chunks)
        latency = round((time.time() - start) * 1000, 2)

        yield {
            "type": "done",
            "full_text": cleaned_text,
            "citations": [c.model_dump() for c in citations],
            "latency_ms": latency,
        }

rag_router = RAGRouter()
