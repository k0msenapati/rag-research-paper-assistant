import json
import re
from app.schemas.chat import CitationRead

class CitationService:
    CITATION_PATTERN = re.compile(r"\[(\d+)\]")

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        s = text.replace("\u202f", " ").replace("\u00a0", " ").replace("\u2011", "-")
        s = s.replace("\u200b", "").replace("\ufeff", "")
        return s

    @staticmethod
    def format_context_for_llm(retrieved_chunks: list[dict]) -> str:
        formatted_blocks: list[str] = []
        for idx, item in enumerate(retrieved_chunks, start=1):
            meta = item.get("metadata", {})
            title = meta.get("title", meta.get("file_name", "Document"))
            page = meta.get("page_number", 1)
            text = item.get("text", "").strip()
            block = f"[{idx}] Source: {title} (Page {page})\nContent: {text}"
            formatted_blocks.append(block)
        return "\n\n".join(formatted_blocks)

    @staticmethod
    def remap_and_clean_text(
        response_text: str,
        retrieved_chunks: list[dict],
    ) -> tuple[str, list[int]]:
        clean_text = CitationService.normalize_text(response_text)
        num_chunks = len(retrieved_chunks)
        if num_chunks == 0:
            clean_text = CitationService.CITATION_PATTERN.sub("", clean_text)
            clean_text = re.sub(r"\s{2,}", " ", clean_text).strip()
            return clean_text, []

        def repl(m: re.Match) -> str:
            raw_idx = int(m.group(1))
            if 1 <= raw_idx <= num_chunks:
                return f"[{raw_idx}]"
            target_str = f"[{raw_idx}]"
            for c_idx, ch in enumerate(retrieved_chunks, 1):
                chunk_text = ch.get("text", "")
                if target_str in chunk_text:
                    return f"[{c_idx}]"
            return ""

        clean_text = CitationService.CITATION_PATTERN.sub(repl, clean_text)
        clean_text = re.sub(r"\s{2,}", " ", clean_text).strip()
        found_indices = sorted(
            set(int(m) for m in CitationService.CITATION_PATTERN.findall(clean_text))
        )

        if not found_indices and num_chunks > 0 and len(clean_text) > 30:
            clean_text = f"{clean_text} [1]"
            found_indices = [1]

        return clean_text, found_indices

    @staticmethod
    def extract_and_validate_citations(
        response_text: str,
        retrieved_chunks: list[dict],
    ) -> list[CitationRead]:
        _, citations = CitationService.process_response(response_text, retrieved_chunks)
        return citations

    @staticmethod
    def process_response(
        response_text: str,
        retrieved_chunks: list[dict],
    ) -> tuple[str, list[CitationRead]]:
        clean_text, found_indices = CitationService.remap_and_clean_text(
            response_text, retrieved_chunks
        )
        citations: list[CitationRead] = []

        for idx in found_indices:
            chunk_idx = idx - 1
            if 0 <= chunk_idx < len(retrieved_chunks):
                item = retrieved_chunks[chunk_idx]
                meta = item.get("metadata", {})
                raw_bbox = meta.get("bounding_box", "[0, 0, 0, 0]")
                bbox = json.loads(raw_bbox) if isinstance(raw_bbox, str) else raw_bbox

                citations.append(
                    CitationRead(
                        id=f"cit-{idx}",
                        citation_index=idx,
                        document_id=meta.get("document_id", ""),
                        document_title=meta.get("title") or meta.get("file_name"),
                        chunk_id=item.get("chunk_id", ""),
                        page_number=int(meta.get("page_number", 1)),
                        quoted_text=item.get("text", "")[:300],
                        bounding_box=bbox,
                    )
                )

        return clean_text, citations

citation_service = CitationService()
