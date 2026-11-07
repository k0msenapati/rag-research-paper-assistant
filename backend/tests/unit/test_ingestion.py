import tempfile
from pathlib import Path
import pymupdf
import pytest
from app.services.ingestion import ingestion_service

def test_calculate_file_hash():
    data = b"PaperPilot AI Test PDF Content"
    h1 = ingestion_service.calculate_file_hash(data)
    h2 = ingestion_service.calculate_file_hash(data)
    assert h1 == h2
    assert len(h1) == 64

def test_pdf_extraction_and_coordinates():
    doc = pymupdf.open()
    page = doc.new_page(width=600, height=800)

    rect_left = pymupdf.Rect(50, 50, 250, 300)
    page.insert_textbox(rect_left, "Left column abstract methodology content.")

    rect_right = pymupdf.Rect(320, 50, 550, 300)
    page.insert_textbox(rect_right, "Right column experimental evaluation results.")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        pdf_path = f.name
        doc.save(pdf_path)
    doc.close()

    opened = pymupdf.open(pdf_path)
    assert len(opened) == 1
    blocks = opened[0].get_text("blocks")
    assert len(blocks) >= 2

    for b in blocks:
        if b[6] == 0:
            ymin = (b[1] / 800) * 100
            xmin = (b[0] / 600) * 100
            ymax = (b[3] / 800) * 100
            xmax = (b[2] / 600) * 100
            assert 0.0 <= ymin <= 100.0
            assert 0.0 <= xmin <= 100.0
            assert ymin <= ymax
            assert xmin <= xmax

    opened.close()
    Path(pdf_path).unlink(missing_ok=True)
