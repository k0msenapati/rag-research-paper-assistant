from tests.api.test_documents_api import create_sample_pdf_bytes

def test_analysis_endpoints(client):
    ws_resp = client.post("/api/v1/workspaces", json={"name": "Analysis Workspace"})
    ws_id = ws_resp.json()["id"]

    pdf1 = create_sample_pdf_bytes("Deep Learning Optimization")
    upload1 = client.post(
        "/api/v1/documents/upload",
        data={"workspace_id": ws_id},
        files={"file": ("opt.pdf", pdf1, "application/pdf")},
    )
    doc1_id = upload1.json()["id"]

    pdf2 = create_sample_pdf_bytes("Stochastic Gradient Descent")
    upload2 = client.post(
        "/api/v1/documents/upload",
        data={"workspace_id": ws_id},
        files={"file": ("sgd.pdf", pdf2, "application/pdf")},
    )
    doc2_id = upload2.json()["id"]

    summary_resp = client.post(
        "/api/v1/analysis/summary",
        json={"document_id": doc1_id},
    )
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["document_id"] == doc1_id
    assert "objective" in summary

    compare_resp = client.post(
        "/api/v1/analysis/compare",
        json={"document_ids": [doc1_id, doc2_id]},
    )
    assert compare_resp.status_code == 200
    comp = compare_resp.json()
    assert len(comp["documents"]) == 2
    assert "synthesis" in comp

    lit_resp = client.post(
        "/api/v1/analysis/lit-review",
        json={"workspace_id": ws_id, "document_ids": [doc1_id, doc2_id]},
    )
    assert lit_resp.status_code == 200
    lit = lit_resp.json()
    assert "synthesis" in lit

    eval_resp = client.post(
        "/api/v1/evaluation/run",
        json={
            "workspace_id": ws_id,
            "document_ids": [doc1_id],
            "sample_queries": ["What is the primary contribution?"],
        },
    )
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    assert eval_data["total_evaluations"] == 3
    assert len(eval_data["metrics"]) == 3
