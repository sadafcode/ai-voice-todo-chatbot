import os
import pytest
import importlib
from sqlmodel import Session, SQLModel, create_engine
from backend.db import get_session, create_db_and_tables, get_engine
import backend.db # Import the module itself to access its internal variables

# Define a test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(name="session")
def session_fixture():
    original_db_url = os.getenv("DATABASE_URL")
    
    # Ensure _engine is None before setting env var and proceeding
    backend.db._engine = None

    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    importlib.reload(backend.db) # Reload to pick up the new env var
    
    # Create tables using the application's create_db_and_tables
    create_db_and_tables()

    # Yield session using the application's get_session
    with Session(get_engine()) as session:
        yield session

    # Teardown logic
    # Explicitly close all connections from the engine that was used
    get_engine().dispose() 
    
    # Drop tables using a fresh engine to avoid contention
    # This might not be strictly necessary if dispose works, but adding for robustness
    temp_engine = create_engine(TEST_DATABASE_URL)
    SQLModel.metadata.drop_all(temp_engine)
    temp_engine.dispose()
    
    if os.path.exists("./test.db"):
        os.remove("./test.db")
    
    # Restore original DATABASE_URL and reset _engine
    if original_db_url is not None:
        os.environ["DATABASE_URL"] = original_db_url
    elif "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    
    backend.db._engine = None
    importlib.reload(backend.db)


def test_engine_creation(session): # Add session fixture
    engine_test = get_engine()
    assert engine_test is not None
    assert str(engine_test.url) == TEST_DATABASE_URL

def test_get_session_provides_session(session): # Add session fixture
    session_gen = get_session()
    session_obj = next(session_gen)
    assert isinstance(session_obj, Session)
    session_obj.close()

def test_create_db_and_tables_function_exists():
    assert callable(create_db_and_tables)

def test_database_url_not_set_raises_error():
    original_db_url = os.getenv("DATABASE_URL")
    if "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    
    backend.db._engine = None
    importlib.reload(backend.db)
    
    with pytest.raises(ValueError, match="DATABASE_URL environment variable is not set"):
        get_engine()
    
    if original_db_url is not None:
        os.environ["DATABASE_URL"] = original_db_url
    elif "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    
    backend.db._engine = None
    importlib.reload(backend.db)