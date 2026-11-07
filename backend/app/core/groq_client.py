import time
from collections.abc import Generator
from groq import Groq
from app.config import settings

class GroqService:
    _instance: "GroqService | None" = None
    _cached_models: list[str] = []
    _last_fetched: float = 0.0
    _cache_ttl: float = 3600.0

    def __init__(self) -> None:
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    @classmethod
    def get_instance(cls) -> "GroqService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_available_models(self, refresh: bool = False) -> list[str]:
        now = time.time()
        if not refresh and self._cached_models and (now - self._last_fetched < self._cache_ttl):
            return self._cached_models

        try:
            models_response = self.client.models.list()
            excluded_keywords = ["whisper", "guard", "audio", "orpheus", "safeguard"]
            filtered = [
                m.id
                for m in models_response.data
                if getattr(m, "active", True)
                and not any(ex in m.id.lower() for ex in excluded_keywords)
            ]
            if settings.DEFAULT_LLM_MODEL in filtered:
                filtered.remove(settings.DEFAULT_LLM_MODEL)
                filtered.insert(0, settings.DEFAULT_LLM_MODEL)
            self._cached_models = filtered if filtered else [settings.DEFAULT_LLM_MODEL]
            self._last_fetched = now
            return self._cached_models
        except Exception:
            return self._cached_models or [
                settings.DEFAULT_LLM_MODEL,
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant",
            ]

    def chat_completion(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> str:
        selected_model = model or settings.DEFAULT_LLM_MODEL
        try:
            response = self.client.chat.completions.create(
                model=selected_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception:
            fallback = "llama-3.3-70b-versatile"
            if selected_model != fallback:
                response = self.client.chat.completions.create(
                    model=fallback,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content or ""
            raise

    def stream_chat_completion(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
    ) -> Generator[str, None, None]:
        selected_model = model or settings.DEFAULT_LLM_MODEL
        try:
            stream = self.client.chat.completions.create(
                model=selected_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except Exception:
            fallback = "llama-3.3-70b-versatile"
            if selected_model != fallback:
                stream = self.client.chat.completions.create(
                    model=fallback,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                )
                for chunk in stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
            else:
                raise

groq_service = GroqService.get_instance()
