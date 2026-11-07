from app.services.citation_service import citation_service

def test_extract_and_validate_citations():
    retrieved = [
        {
            "chunk_id": "chunk-101",
            "text": "Transformer architectures leverage self-attention mechanisms.",
            "metadata": {
                "document_id": "doc-1",
                "title": "Attention Is All You Need",
                "page_number": 3,
                "bounding_box": "[10.5, 20.0, 15.2, 80.0]",
            },
        },
        {
            "chunk_id": "chunk-102",
            "text": "Residual connections are applied around each sub-layer.",
            "metadata": {
                "document_id": "doc-1",
                "title": "Attention Is All You Need",
                "page_number": 4,
                "bounding_box": "[30.0, 20.0, 35.0, 80.0]",
            },
        },
    ]

    llm_output = "The model uses self-attention [1] and residual connections [2]. It also claims quantum computing [99]."
    citations = citation_service.extract_and_validate_citations(llm_output, retrieved)

    assert len(citations) == 2
    assert citations[0].citation_index == 1
    assert citations[0].chunk_id == "chunk-101"
    assert citations[0].page_number == 3
    assert citations[0].bounding_box == [10.5, 20.0, 15.2, 80.0]

    assert citations[1].citation_index == 2
    assert citations[1].chunk_id == "chunk-102"
    assert citations[1].page_number == 4

    citation_indices = [c.citation_index for c in citations]
    assert 99 not in citation_indices

def test_citation_remapping_and_normalization():
    retrieved = [
        {
            "chunk_id": "chunk-rag-1",
            "text": "RAG combines parametric and non-parametric memory.",
            "metadata": {"document_id": "doc-rag", "title": "RAG", "page_number": 1, "bounding_box": "[0, 0, 0, 0]"},
        },
        {
            "chunk_id": "chunk-rag-2",
            "text": "On FEVER 2-way classification we use the classifier from Thorne and Vlachos [57].",
            "metadata": {"document_id": "doc-rag", "title": "RAG", "page_number": 8, "bounding_box": "[10, 10, 20, 80]"},
        },
    ]

    dirty_output = "For the 2\u2011way classification the paper compares against Thorne and\u202fVlachos\u202f[57] and irrelevant [99]."
    clean_text, citations = citation_service.process_response(dirty_output, retrieved)

    assert "\u202f" not in clean_text
    assert "\u2011" not in clean_text
    assert "[57]" not in clean_text
    assert "[2]" in clean_text
    assert "[99]" not in clean_text
    assert len(citations) == 1
    assert citations[0].citation_index == 2
    assert citations[0].chunk_id == "chunk-rag-2"
    assert citations[0].page_number == 8
