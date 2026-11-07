import chromadb
from chromadb.api import ClientAPI
from app.config import settings

class VectorStore:
    _client: ClientAPI | None = None

    @classmethod
    def get_client(cls) -> ClientAPI:
        if cls._client is None:
            cls._client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_PATH)
        return cls._client

    @classmethod
    def get_collection(cls, name: str = "paperpilot_chunks"):
        client = cls.get_client()
        return client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    @classmethod
    def add_chunks(
        cls,
        chunk_ids: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
        documents: list[str],
    ) -> None:
        collection = cls.get_collection()
        collection.upsert(
            ids=chunk_ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
        )

    @classmethod
    def query_chunks(
        cls,
        query_embedding: list[float],
        n_results: int = 5,
        workspace_id: str | None = None,
        document_ids: list[str] | None = None,
    ) -> list[dict]:
        collection = cls.get_collection()
        where_filter: dict = {}
        if workspace_id and document_ids:
            where_filter = {
                "$and": [
                    {"workspace_id": workspace_id},
                    {"document_id": {"$in": document_ids}},
                ]
            }
        elif workspace_id:
            where_filter = {"workspace_id": workspace_id}
        elif document_ids:
            if len(document_ids) == 1:
                where_filter = {"document_id": document_ids[0]}
            else:
                where_filter = {"document_id": {"$in": document_ids}}

        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
        }
        if where_filter:
            kwargs["where"] = where_filter

        results = collection.query(**kwargs)
        if not results or not results["ids"] or not results["ids"][0]:
            return []

        formatted: list[dict] = []
        ids = results["ids"][0]
        distances = results.get("distances", [[]])[0] if results.get("distances") else []
        metadatas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []
        docs = results.get("documents", [[]])[0] if results.get("documents") else []

        for i, chunk_id in enumerate(ids):
            distance = distances[i] if i < len(distances) else 1.0
            score = 1.0 - distance
            metadata = metadatas[i] if i < len(metadatas) else {}
            doc_text = docs[i] if i < len(docs) else ""
            formatted.append(
                {
                    "chunk_id": chunk_id,
                    "score": score,
                    "text": doc_text,
                    "metadata": metadata,
                }
            )
        return formatted

    @classmethod
    def delete_document_chunks(cls, document_id: str) -> None:
        collection = cls.get_collection()
        collection.delete(where={"document_id": document_id})
