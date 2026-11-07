from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from app.config import settings

class Base(DeclarativeBase):
    pass

engine = create_engine(
    f"sqlite:///{settings.SQLITE_DB_PATH}",
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    from app.models.workspace import Workspace
    with SessionLocal() as db:
        if db.query(Workspace).count() == 0:
            default_ws = Workspace(
                name="Main Research Lab",
                description="Default research workspace for paper analysis",
            )
            db.add(default_ws)
            db.commit()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
