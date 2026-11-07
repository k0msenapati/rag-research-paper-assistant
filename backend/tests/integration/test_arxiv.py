import pytest
from app.services.arxiv_service import arxiv_service

@pytest.mark.asyncio
async def test_arxiv_search():
    results = await arxiv_service.search(query="Attention Is All You Need", max_results=2)
    assert isinstance(results, list)
    assert len(results) > 0
    paper = results[0]
    assert paper.arxiv_id != ""
    assert paper.title != ""
    assert paper.pdf_url.startswith("http")
    assert isinstance(paper.authors, list)
