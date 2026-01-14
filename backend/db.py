import os
from typing import Generator
from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy import inspect, text

_engine = None  # Internal variable to hold the engine

def get_engine():
    global _engine
    if _engine is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is not set")
        _engine = create_engine(database_url, echo=True)
    return _engine

def create_db_and_tables():
    # Create all tables that don't exist
    SQLModel.metadata.create_all(get_engine())

    # Check if existing tables need schema updates
    engine = get_engine()
    inspector = inspect(engine)

    # Check if tasks table exists and if it has the new columns
    if 'tasks' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('tasks')]

        # Add priority column if it doesn't exist
        if 'priority' not in columns:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium'"))
                conn.commit()

        # Add recurrence_pattern column if it doesn't exist
        if 'recurrence_pattern' not in columns:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT"))
                conn.commit()

def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session