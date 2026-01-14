import pytest
import os
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from backend.main import app 
from backend.db import get_session, create_db_and_tables # Import needed functions

# Override the get_session dependency to use a test database
@pytest.fixture(name="test_session")
def test_session_fixture():
    engine_test = create_engine("sqlite:///./test_test.db")
    SQLModel.metadata.create_all(engine_test)
    with Session(engine_test) as session:
        yield session
    SQLModel.metadata.drop_all(engine_test)
    engine_test.dispose()
    if os.path.exists("./test_test.db"):
        os.remove("./test_test.db")

@pytest.fixture(name="client")
def client_fixture(test_session: Session):
    def get_test_session_override(): # Renamed to avoid conflicts
        yield test_session
    app.dependency_overrides[get_session] = get_test_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
