import hashlib
import json
import uuid
from pathlib import Path
import pymupdf
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session
from app.core.embeddings import embedding_service
from app.core.vector_store import VectorStore
from app.models.chunk import Chunk
from app.models.document import Document

class IngestionService:
    @staticmethod
    def calculate_file_hash(file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    @staticmethod
    def process_pdf(
        db: Session,
        document_id: str,
        workspace_id: str,
        file_path: str,
    ) -> Document:
        doc_record = db.query(Document).filter(Document.id == document_id).first()
        if not doc_record:
            raise ValueError(f"Document {document_id} not found")

        path = Path(file_path)
        if not path.exists():
            doc_record.status = "failed"
            db.commit()
            raise FileNotFoundError(f"File {file_path} does not exist")

        pdf = pymupdf.open(str(path))
        total_pages = len(pdf)
        doc_record.total_pages = total_pages

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=700,
            chunk_overlap=100,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

        all_chunks: list[Chunk] = []
        chroma_ids: list[str] = []
        chroma_docs: list[str] = []
        chroma_metas: list[dict] = []
        global_chunk_index = 0

        for page_idx in range(total_pages):
            page = pdf[page_idx]
            page_number = page_idx + 1
            width = page.rect.width
            height = page.rect.height

            raw_blocks = page.get_text("blocks")
            text_blocks = [
                b for b in raw_blocks
                if len(b) >= 7 and b[6] == 0 and b[4].strip()
            ]

            mid_x = width / 2.0
            left_col = [b for b in text_blocks if b[0] < mid_x]
            right_col = [b for b in text_blocks if b[0] >= mid_x]

            if left_col and right_col:
                left_col.sort(key=lambda b: b[1])
                right_col.sort(key=lambda b: b[1])
                sorted_blocks = left_col + right_col
            else:
                sorted_blocks = sorted(text_blocks, key=lambda b: (b[1], b[0]))

            for block in sorted_blocks:
                x0, y0, x1, y1, block_text = block[0], block[1], block[2], block[3], block[4]
                ymin = max(0.0, min(100.0, (y0 / height) * 100.0))
                xmin = max(0.0, min(100.0, (x0 / width) * 100.0))
                ymax = max(0.0, min(100.0, (y1 / height) * 100.0))
                xmax = max(0.0, min(100.0, (x1 / width) * 100.0))
                bbox = [ymin, xmin, ymax, xmax]

                sub_chunks = splitter.split_text(block_text.strip())
                for sub_text in sub_chunks:
                    clean_text = sub_text.strip()
                    if len(clean_text) < 15:
                        continue

                    chunk_id = str(uuid.uuid4())
                    chunk_obj = Chunk(
                        id=chunk_id,
                        document_id=document_id,
                        page_number=page_number,
                        chunk_index=global_chunk_index,
                        text=clean_text,
                        bounding_box=json.dumps(bbox),
                    )
                    all_chunks.append(chunk_obj)

                    chroma_ids.append(chunk_id)
                    chroma_docs.append(clean_text)
                    chroma_metas.append(
                        {
                            "document_id": document_id,
                            "workspace_id": workspace_id,
                            "page_number": page_number,
                            "chunk_index": global_chunk_index,
                            "file_name": doc_record.file_name,
                            "title": doc_record.title,
                            "bounding_box": json.dumps(bbox),
                        }
                    )
                    global_chunk_index += 1

        pdf.close()

        if chroma_docs:
            embeddings = embedding_service.embed_documents(chroma_docs)
            VectorStore.add_chunks(
                chunk_ids=chroma_ids,
                embeddings=embeddings,
                metadatas=chroma_metas,
                documents=chroma_docs,
            )

        db.add_all(all_chunks)
        doc_record.chunk_count = len(all_chunks)
        doc_record.status = "ready"
        db.commit()
        db.refresh(doc_record)
        return doc_record

ingestion_service = IngestionService()
