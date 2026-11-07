import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    documents = relationship(
        "Document", back_populates="workspace", cascade="all, delete-orphan"
    )
    conversations = relationship(
        "Conversation", back_populates="workspace", cascade="all, delete-orphan"
    )
