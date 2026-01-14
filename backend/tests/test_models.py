from datetime import datetime, timezone
import pytest
from pydantic import ValidationError # Import ValidationError
from backend.models import Task, User

def test_task_model_instantiation():
    now_utc = datetime.now(timezone.utc)
    task = Task(
        title="Test Task",
        description="This is a test description",
        user_id="test_user_1",
        created_at=now_utc,
        updated_at=now_utc
    )
    assert task.title == "Test Task"
    assert task.user_id == "test_user_1"
    assert not task.completed
    assert task.created_at == now_utc
    assert task.updated_at == now_utc

def test_task_title_validation():
    with pytest.raises(ValidationError, match="at least 1 character"):
        Task.model_validate({'title': '', 'user_id': 'test_user'})

def test_task_relationship_attribute():
    # This test primarily checks if the 'user' attribute exists for the relationship
    # Full relationship functionality will be tested with a database session
    assert hasattr(Task, 'user')
    assert hasattr(User, 'tasks')
