from app.workflows.fusion_rag import compute_rrf

def test_compute_rrf_scoring_and_ranking():
    list1 = [
        {"chunk_id": "c1", "text": "Paper A", "score": 0.9},
        {"chunk_id": "c2", "text": "Paper B", "score": 0.8},
        {"chunk_id": "c3", "text": "Paper C", "score": 0.7},
    ]
    list2 = [
        {"chunk_id": "c2", "text": "Paper B", "score": 0.95},
        {"chunk_id": "c1", "text": "Paper A", "score": 0.85},
        {"chunk_id": "c4", "text": "Paper D", "score": 0.6},
    ]

    fused = compute_rrf([list1, list2], rrf_k=60)
    assert len(fused) == 4

    top_ids = [c["chunk_id"] for c in fused]
    assert set(top_ids[:2]) == {"c1", "c2"}

    score_c1 = (1.0 / (60 + 1)) + (1.0 / (60 + 2))
    score_c2 = (1.0 / (60 + 2)) + (1.0 / (60 + 1))
    assert abs(score_c1 - score_c2) < 1e-6

    assert fused[0]["score"] > fused[2]["score"]
    assert fused[2]["score"] >= fused[3]["score"]
