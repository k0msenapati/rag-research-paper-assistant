from fastembed import TextEmbedding
from app.config import settings

class EmbeddingService:
    _instance: "EmbeddingService | None" = None
    _model: TextEmbedding | None = None

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_model(self) -> TextEmbedding:
        if self._model is None:
            self._model = TextEmbedding(model_name=settings.EMBEDDING_MODEL_NAME)
        return self._model

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        model = self._get_model()
        return [vec.tolist() for vec in model.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        model = self._get_model()
        return next(model.embed([text])).tolist()

embedding_service = EmbeddingService.get_instance()
