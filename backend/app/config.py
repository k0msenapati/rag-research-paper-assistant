from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    GROQ_API_KEY: str = ""
    SQLITE_DB_PATH: str = str(DATA_DIR / "paperpilot.db")
    CHROMA_PERSIST_PATH: str = str(DATA_DIR / "chromadb")
    PDF_STORAGE_PATH: str = str(DATA_DIR / "pdfs")
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-base-en-v1.5"
    DEFAULT_LLM_MODEL: str = "openai/gpt-oss-120b"
    CORS_ORIGINS: list[str] = ["*"]

    def ensure_directories(self) -> None:
        Path(self.SQLITE_DB_PATH).parent.mkdir(parents=True, exist_ok=True)
        Path(self.CHROMA_PERSIST_PATH).mkdir(parents=True, exist_ok=True)
        Path(self.PDF_STORAGE_PATH).mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.ensure_directories()
