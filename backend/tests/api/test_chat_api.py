from tests.api.test_documents_api import create_sample_pdf_bytes

def test_chat_stream_and_conversations(client):
    ws_resp = client.post("/api/v1/workspaces", json={"name": "NLP Workspace"})
    ws_id = ws_resp.json()["id"]

    pdf_bytes = create_sample_pdf_bytes("Transformers in NLP")
    files = {"file": ("nlp.pdf", pdf_bytes, "application/pdf")}
    upload_resp = client.post(
        "/api/v1/documents/upload",
        data={"workspace_id": ws_id},
        files=files,
    )
    doc_id = upload_resp.json()["id"]

    chat_payload = {
        "workspace_id": ws_id,
        "query": "What are the transformers discussed in this paper?",
        "rag_strategy": "basic",
        "document_ids": [doc_id],
    }

    with client.stream("POST", "/api/v1/chat/stream", json=chat_payload) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        events = list(response.iter_lines())
        assert any("token" in line or "done" in line for line in events if line)

    convo_list = client.get(f"/api/v1/chat/conversations?workspace_id={ws_id}")
    assert convo_list.status_code == 200
    convos = convo_list.json()
    assert len(convos) >= 1

    convo_id = convos[0]["id"]
    convo_detail = client.get(f"/api/v1/chat/conversations/{convo_id}")
    assert convo_detail.status_code == 200
    messages = convo_detail.json()["messages"]
    assert len(messages) >= 2
