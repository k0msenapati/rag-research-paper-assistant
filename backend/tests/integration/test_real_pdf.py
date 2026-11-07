import os
import pytest
from app.core.database import SessionLocal
from app.models.document import Document
from app.models.workspace import Workspace
from app.services.arxiv_service import arxiv_service
from app.services.ingestion import ingestion_service
from app.workflows.basic_rag import basic_rag_app
from app.workflows.fusion_rag import fusion_rag_app
from app.workflows.state import RAGState

@pytest.mark.asyncio
async def test_real_pdf_end_to_end_ingestion_and_rag(test_dirs):
    db = SessionLocal()
    try:
        ws = Workspace(name="Real PDF Test Lab", description="End to end test")
        db.add(ws)
        db.commit()
        db.refresh(ws)

        papers = await arxiv_service.search(query="Attention Is All You Need", max_results=1)
        assert len(papers) > 0
        paper = papers[0]
        assert paper.arxiv_id != ""
        assert paper.pdf_url.startswith("http")

        pdf_path = os.path.join(test_dirs, f"{paper.arxiv_id}.pdf")
        await arxiv_service.download_pdf(paper.pdf_url, pdf_path)
        assert os.path.exists(pdf_path)
        file_size = os.path.getsize(pdf_path)
        assert file_size > 10000

        with open(pdf_path, "rb") as f:
            file_bytes = f.read()

        file_hash = ingestion_service.calculate_file_hash(file_bytes)
        doc = Document(
            workspace_id=ws.id,
            title=paper.title,
            file_name=f"{paper.arxiv_id}.pdf",
            file_path=pdf_path,
            file_hash=file_hash,
            arxiv_id=paper.arxiv_id,
            status="processing",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        processed_doc = ingestion_service.process_pdf(
            db=db,
            document_id=doc.id,
            workspace_id=ws.id,
            file_path=pdf_path,
        )

        assert processed_doc.status == "ready"
        assert processed_doc.total_pages > 0
        assert processed_doc.chunk_count > 0

        chunks = processed_doc.chunks
        assert len(chunks) == processed_doc.chunk_count
        first_chunk = chunks[0]
        assert first_chunk.page_number >= 1
        assert len(first_chunk.text) > 20
        assert "[" in first_chunk.bounding_box

        state: RAGState = {
            "query": "What is the Transformer architecture and self-attention?",
            "workspace_id": ws.id,
            "document_ids": [processed_doc.id],
            "llm_model": "",
            "top_k": 3,
            "rrf_k": 60,
            "rag_strategy": "basic",
            "hypothetical_doc": "",
            "sub_queries": [],
            "retrieved_chunks": [],
            "final_answer": "",
            "citations": [],
            "latency_ms": 0.0,
        }

        basic_res = basic_rag_app.invoke(state)
        assert len(basic_res["retrieved_chunks"]) > 0
        assert len(basic_res["final_answer"]) > 20
        assert len(basic_res["citations"]) > 0
        cit = basic_res["citations"][0]
        assert cit["document_id"] == processed_doc.id
        assert cit["page_number"] >= 1
        assert len(cit["bounding_box"]) == 4

        fusion_state: RAGState = {
            "query": "What are multi-head attention heads and scaled dot-product attention?",
            "workspace_id": ws.id,
            "document_ids": [processed_doc.id],
            "llm_model": "",
            "top_k": 3,
            "rrf_k": 60,
            "rag_strategy": "fusion",
            "hypothetical_doc": "",
            "sub_queries": [],
            "retrieved_chunks": [],
            "final_answer": "",
            "citations": [],
            "latency_ms": 0.0,
        }

        fusion_res = fusion_rag_app.invoke(fusion_state)
        assert len(fusion_res["retrieved_chunks"]) > 0
        assert len(fusion_res["final_answer"]) > 20
        assert len(fusion_res["citations"]) > 0

    finally:
        db.close()
