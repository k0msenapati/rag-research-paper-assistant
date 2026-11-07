import uuid
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Citation(Base):
    __tablename__ = "citations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False
    )
    document_id: Mapped[str] = mapped_column(String(36), nullable=False)
    chunk_id: Mapped[str] = mapped_column(String(36), nullable=False)
    citation_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    quoted_text: Mapped[str] = mapped_column(Text, nullable=False)
    bounding_box: Mapped[str] = mapped_column(Text, nullable=False)

    message = relationship("Message", back_populates="citations")
