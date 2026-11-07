import json
from sqlalchemy.orm import Session
from app.core.groq_client import groq_service
from app.core.vector_store import VectorStore
from app.models.document import Document
from app.schemas.analysis import (
    ComparisonResponse,
    LitReviewResponse,
    PaperComparisonRow,
    SummaryResponse,
)
from app.services.citation_service import citation_service

class AnalysisService:
    @staticmethod
    def summarize_paper(
        db: Session,
        document_id: str,
        llm_model: str | None = None,
    ) -> SummaryResponse:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise ValueError("Document not found")

        collection = VectorStore.get_collection()
        results = collection.get(
            where={"document_id": document_id},
            limit=15,
        )
        chunks: list[dict] = []
        if results and results.get("ids"):
            for i, cid in enumerate(results["ids"]):
                chunks.append(
                    {
                        "chunk_id": cid,
                        "text": results["documents"][i],
                        "metadata": results["metadatas"][i],
                    }
                )

        context = citation_service.format_context_for_llm(chunks)
        prompt = (
            "Analyze the academic research paper below and provide a structured JSON summary. "
            "Your output MUST be a valid JSON object with the following string keys: "
            "'objective', 'problem', 'methodology', 'models_and_technologies', 'dataset', 'results', 'limitations', 'future_scope'. "
            "Use citation brackets [1], [2] inside values to refer to context chunks.\n\n"
            f"Context:\n{context}"
        )

        response_str = groq_service.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=llm_model,
            temperature=0.1,
        )

        try:
            start_idx = response_str.find("{")
            end_idx = response_str.rfind("}")
            if start_idx != -1 and end_idx != -1:
                data = json.loads(response_str[start_idx : end_idx + 1])
            else:
                data = json.loads(response_str)
        except Exception:
            data = {
                "objective": "Could not parse JSON output.",
                "problem": response_str[:200],
                "methodology": "Extracted via LLM.",
                "models_and_technologies": "",
                "dataset": "",
                "results": "",
                "limitations": "",
                "future_scope": "",
            }

        citations = citation_service.extract_and_validate_citations(response_str, chunks)
        return SummaryResponse(
            document_id=doc.id,
            document_title=doc.title,
            objective=data.get("objective", ""),
            problem=data.get("problem", ""),
            methodology=data.get("methodology", ""),
            models_and_technologies=data.get("models_and_technologies", ""),
            dataset=data.get("dataset", ""),
            results=data.get("results", ""),
            limitations=data.get("limitations", ""),
            future_scope=data.get("future_scope", ""),
            citations=citations,
        )

    @staticmethod
    def compare_papers(
        db: Session,
        document_ids: list[str],
        llm_model: str | None = None,
    ) -> ComparisonResponse:
        docs = db.query(Document).filter(Document.id.in_(document_ids)).all()
        if len(docs) < 2:
            raise ValueError("At least 2 documents are required for comparison")

        doc_info = [{"id": d.id, "title": d.title} for d in docs]
        all_chunks: list[dict] = []
        for d in docs:
            col = VectorStore.get_collection()
            res = col.get(where={"document_id": d.id}, limit=8)
            if res and res.get("ids"):
                for i, cid in enumerate(res["ids"]):
                    all_chunks.append(
                        {
                            "chunk_id": cid,
                            "text": res["documents"][i],
                            "metadata": res["metadatas"][i],
                        }
                    )

        context = citation_service.format_context_for_llm(all_chunks)
        prompt = (
            "Compare the academic papers provided below across these dimensions: "
            "'Objective', 'Methodology', 'Models/Algorithms', 'Datasets', 'Experimental Results', 'Limitations'. "
            "Output a JSON object with: "
            "1. 'comparison_table': a list of objects with 'aspect' and 'paper_analyses' (dict of doc_id to description). "
            "2. 'synthesis': a comprehensive synthesis paragraph highlighting trade-offs and research gaps. "
            "Include citations like [1], [2] in descriptions.\n\n"
            f"Context:\n{context}"
        )

        response_str = groq_service.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=llm_model,
            temperature=0.2,
        )

        try:
            start_idx = response_str.find("{")
            end_idx = response_str.rfind("}")
            parsed = json.loads(response_str[start_idx : end_idx + 1])
            raw_table = parsed.get("comparison_table", [])
            synthesis = parsed.get("synthesis", "")
            table = [
                PaperComparisonRow(
                    aspect=r.get("aspect", ""),
                    paper_analyses=r.get("paper_analyses", {}),
                )
                for r in raw_table
            ]
        except Exception:
            table = [
                PaperComparisonRow(
                    aspect="Comparison",
                    paper_analyses={d.id: "See synthesis for comparative overview" for d in docs},
                )
            ]
            synthesis = response_str

        citations = citation_service.extract_and_validate_citations(response_str, all_chunks)
        return ComparisonResponse(
            documents=doc_info,
            comparison_table=table,
            synthesis=synthesis,
            citations=citations,
        )

    @staticmethod
    def generate_literature_review(
        db: Session,
        workspace_id: str,
        document_ids: list[str] | None = None,
        topic: str | None = None,
        llm_model: str | None = None,
    ) -> LitReviewResponse:
        query = db.query(Document).filter(Document.workspace_id == workspace_id)
        if document_ids:
            query = query.filter(Document.id.in_(document_ids))
        docs = query.all()

        all_chunks: list[dict] = []
        for d in docs:
            col = VectorStore.get_collection()
            res = col.get(where={"document_id": d.id}, limit=6)
            if res and res.get("ids"):
                for i, cid in enumerate(res["ids"]):
                    all_chunks.append(
                        {
                            "chunk_id": cid,
                            "text": res["documents"][i],
                            "metadata": res["metadatas"][i],
                        }
                    )

        context = citation_service.format_context_for_llm(all_chunks)
        prompt = (
            f"Write a structured literature review on the topic: '{topic or 'Core Research Contributions'}'. "
            "Output JSON with two keys: "
            "1. 'synthesis': Narrative literature review synthesizing themes, progression, and open challenges. "
            "2. 'review_matrix': A list of objects with 'author_year', 'objective', 'methodology', 'key_findings', 'gaps'. "
            "Reference chunks with bracketed citations [1], [2].\n\n"
            f"Context:\n{context}"
        )

        response_str = groq_service.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=llm_model,
            temperature=0.2,
        )

        try:
            start_idx = response_str.find("{")
            end_idx = response_str.rfind("}")
            parsed = json.loads(response_str[start_idx : end_idx + 1])
            synthesis = parsed.get("synthesis", "")
            matrix = parsed.get("review_matrix", [])
        except Exception:
            synthesis = response_str
            matrix = []

        citations = citation_service.extract_and_validate_citations(response_str, all_chunks)
        return LitReviewResponse(
            topic=topic or "Research Literature Review",
            synthesis=synthesis,
            review_matrix=matrix,
            citations=citations,
        )

analysis_service = AnalysisService()
