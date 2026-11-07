import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.core.database import Base, get_db
from app.main import app

@pytest.fixture(scope="session")
def test_dirs():
    temp_dir = tempfile.mkdtemp()
    settings.SQLITE_DB_PATH = os.path.join(temp_dir, "test.db")
    settings.CHROMA_PERSIST_PATH = os.path.join(temp_dir, "chroma")
    settings.PDF_STORAGE_PATH = os.path.join(temp_dir, "pdfs")
    settings.ensure_directories()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture(scope="session")
def test_db_engine(test_dirs):
    engine = create_engine(
        f"sqlite:///{settings.SQLITE_DB_PATH}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture
def db_session(test_db_engine):
    connection = test_db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
