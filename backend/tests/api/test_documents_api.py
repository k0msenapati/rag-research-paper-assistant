import io
import pymupdf

def create_sample_pdf_bytes(title: str = "Sample Academic Paper") -> bytes:
    doc = pymupdf.open()
    page = doc.new_page(width=600, height=800)
    page.insert_text((50, 80), title, fontsize=18)
    rect = pymupdf.Rect(50, 120, 550, 600)
    page.insert_textbox(rect, "Recent advances in deep learning have transformed AI research.")
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()

def test_document_upload_and_chunks(client):
    ws_resp = client.post("/api/v1/workspaces", json={"name": "Vision Lab"})
    ws_id = ws_resp.json()["id"]

    pdf_bytes = create_sample_pdf_bytes("Diffusion Models for Vision")
    files = {"file": ("diffusion.pdf", pdf_bytes, "application/pdf")}
    data = {"workspace_id": ws_id}

    upload_resp = client.post("/api/v1/documents/upload", data=data, files=files)
    assert upload_resp.status_code == 201
    doc = upload_resp.json()
    doc_id = doc["id"]
    assert doc["status"] == "ready"
    assert doc["chunk_count"] > 0
    assert doc["total_pages"] == 1

    chunks_resp = client.get(f"/api/v1/documents/{doc_id}/chunks")
    assert chunks_resp.status_code == 200
    chunks = chunks_resp.json()
    assert len(chunks) == doc["chunk_count"]
    assert len(chunks[0]["bounding_box"]) == 4

    pdf_stream_resp = client.get(f"/api/v1/documents/{doc_id}/pdf")
    assert pdf_stream_resp.status_code == 200
    assert pdf_stream_resp.headers["content-type"] == "application/pdf"

    dup_upload = client.post("/api/v1/documents/upload", data=data, files={"file": ("diffusion.pdf", pdf_bytes, "application/pdf")})
    assert dup_upload.status_code == 200
    assert dup_upload.json()["id"] == doc_id

    del_resp = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_resp.status_code == 204
