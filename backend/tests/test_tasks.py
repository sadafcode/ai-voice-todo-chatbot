import pytest
from contextlib import contextmanager
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from datetime import datetime, timezone, timedelta

from backend.models import Task, User
from backend.auth import get_current_user
from backend.main import app

@contextmanager
def override_current_user(user_id: str):
    """Context manager to override the get_current_user dependency."""
    def override():
        return user_id
    app.dependency_overrides[get_current_user] = override
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def create_test_tasks(session: Session, user_id: str) -> list[Task]:
    """Helper function to create a user and a set of tasks with realistic timestamps."""
    user = User(id=user_id, email=f"{user_id}@example.com", name=f"{user_id} User", password_hash="hashedpassword")
    session.add(user)
    session.commit()
    session.refresh(user)

    now_utc = datetime.now(timezone.utc)
    tasks_data = [
        {"title": "Walk dog", "completed": False, "created_at": now_utc - timedelta(hours=3), "updated_at": now_utc - timedelta(hours=3)},
        {"title": "Buy groceries", "completed": True, "created_at": now_utc - timedelta(hours=2), "updated_at": now_utc - timedelta(hours=1)}, # updated later
        {"title": "Write report", "completed": False, "created_at": now_utc - timedelta(hours=1), "updated_at": now_utc - timedelta(hours=1)},
        {"title": "Call mom", "completed": True, "created_at": now_utc, "updated_at": now_utc},
    ]

    created_tasks = []
    for data in tasks_data:
        task = Task(user_id=user_id, **data)
        session.add(task)
        created_tasks.append(task)
    
    session.commit()
    for task in created_tasks:
        session.refresh(task)
        
    return created_tasks

# Test 1: Successful task creation
def test_create_task_success(client: TestClient, test_session: Session):
    user_id = "test_user_create"
    # The user is created within create_test_tasks if needed, or can be created here
    user = User(id=user_id, email=f"{user_id}@example.com", name=f"{user_id} User", password_hash="hashedpassword")
    test_session.add(user)
    test_session.commit()

    task_data = {"title": "New Test Task", "description": "A fresh description"}
    
    with override_current_user(user_id):
        response = client.post(f"/api/{user_id}/tasks", json=task_data)

    assert response.status_code == 201
    res_json = response.json()
    assert res_json["title"] == task_data["title"]
    assert res_json["user_id"] == user_id

    task_in_db = test_session.exec(select(Task).where(Task.id == res_json["id"])).first()
    assert task_in_db is not None
    assert task_in_db.title == task_data["title"]

# Test 2: Unauthorized creation (mismatch user_id in path and token)
def test_create_task_unauthorized_mismatch(client: TestClient):
    with override_current_user("another_user_id"):
        response = client.post("/api/some_user_id/tasks", json={"title": "Mismatch Task"})
    
    assert response.status_code == 403
    assert "Cannot create tasks for another user" in response.json()["detail"]

# Test 3: Unauthenticated request (no override)
def test_create_task_unauthenticated(client: TestClient):
    # This test now simulates a missing or invalid token by having get_current_user raise an exception
    def override_get_current_user_unauthenticated():
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    app.dependency_overrides[get_current_user] = override_get_current_user_unauthenticated
    response = client.post("/api/dummy_user_id/tasks", json={"title": "Unauth Task"})
    app.dependency_overrides.pop(get_current_user) # Cleanup

    assert response.status_code == 401

# Test 4: User not found for task creation
def test_create_task_user_not_found(client: TestClient):
    user_id = "non_existent_user"
    with override_current_user(user_id):
        response = client.post(f"/api/{user_id}/tasks", json={"title": "Task for non-existent user"})
    
    assert response.status_code == 404
    assert f"User with ID {user_id} not found" in response.json()["detail"]

# Test 5: List all tasks for authenticated user
def test_list_tasks_success(client: TestClient, test_session: Session):
    user_id = "test_user_list"
    created_tasks = create_test_tasks(test_session, user_id)

    with override_current_user(user_id):
        response = client.get(f"/api/{user_id}/tasks")
    
    assert response.status_code == 200
    res_json = response.json()
    assert len(res_json) == len(created_tasks)
    # Default sort is by created_at ascending
    assert res_json[0]["title"] == "Walk dog"
    assert res_json[3]["title"] == "Call mom"

# Test 6: Filter tasks by 'pending' status
def test_list_tasks_filter_pending(client: TestClient, test_session: Session):
    user_id = "test_user_pending"
    create_test_tasks(test_session, user_id)

    with override_current_user(user_id):
        response = client.get(f"/api/{user_id}/tasks?status=pending")
    
    assert response.status_code == 200
    res_json = response.json()
    assert len(res_json) == 2
    assert all(not task["completed"] for task in res_json)

# Test 7: Filter tasks by 'completed' status
def test_list_tasks_filter_completed(client: TestClient, test_session: Session):
    user_id = "test_user_completed"
    create_test_tasks(test_session, user_id)

    with override_current_user(user_id):
        response = client.get(f"/api/{user_id}/tasks?status=completed")

    assert response.status_code == 200
    res_json = response.json()
    assert len(res_json) == 2
    assert all(task["completed"] for task in res_json)

# Test 8: Sort tasks by 'updated_at' descending
def test_list_tasks_sort_by_updated_at_desc(client: TestClient, test_session: Session):
    user_id = "test_user_sort_updated"
    create_test_tasks(test_session, user_id)

    with override_current_user(user_id):
        response = client.get(f"/api/{user_id}/tasks?sort=updated_at&order=desc")

    assert response.status_code == 200
    res_json = response.json()
    assert len(res_json) == 4
    # "Call mom" -> "Write report" -> "Buy groceries" -> "Walk dog"
    assert res_json[0]["title"] == "Call mom"
    assert res_json[1]["title"] == "Write report"
    assert res_json[2]["title"] == "Buy groceries"
    assert res_json[3]["title"] == "Walk dog"

# Test 9: Get task details successfully
def test_get_task_details_success(client: TestClient, test_session: Session):
    user_id = "test_user_get_task"
    task_id = create_test_tasks(test_session, user_id)[0].id

    with override_current_user(user_id):
        response = client.get(f"/api/{user_id}/tasks/{task_id}")

    assert response.status_code == 200
    res_json = response.json()
    assert res_json["id"] == task_id
    assert res_json["user_id"] == user_id

# Test 10: Task not found or not belonging to user
def test_get_task_details_not_found(client: TestClient, test_session: Session):
    user_id = "test_user_get_not_found"
    create_test_tasks(test_session, user_id)
    
    with override_current_user(user_id):
        response = client.get(f"/api/{user_id}/tasks/99999")

    assert response.status_code == 404
    assert "Task not found or does not belong to user" in response.json()["detail"]

# Test 11: Successful full update of a task
def test_update_task_full_success(client: TestClient, test_session: Session):
    user_id = "test_user_update"
    task = create_test_tasks(test_session, user_id)[0]
    initial_updated_at = task.updated_at

    update_data = {"title": "Fully Updated Title", "description": "New desc", "completed": True}

    with override_current_user(user_id):
        response = client.put(f"/api/{user_id}/tasks/{task.id}", json=update_data)

    assert response.status_code == 200
    res_json = response.json()
    assert res_json["title"] == update_data["title"]
    assert res_json["description"] == update_data["description"]
    assert res_json["completed"] == update_data["completed"]
    
    response_updated_at = datetime.fromisoformat(res_json["updated_at"])
    assert response_updated_at > initial_updated_at

# Test 12: Successful partial update of a task
def test_update_task_partial_success(client: TestClient, test_session: Session):
    user_id = "test_user_partial_update"
    task = create_test_tasks(test_session, user_id)[0]
    initial_updated_at = task.updated_at
    original_description = task.description

    update_data = {"title": "Partially Updated Title"}

    with override_current_user(user_id):
        response = client.put(f"/api/{user_id}/tasks/{task.id}", json=update_data)

    assert response.status_code == 200
    res_json = response.json()
    assert res_json["title"] == update_data["title"]
    assert res_json["description"] == original_description # Unchanged
    
    response_updated_at = datetime.fromisoformat(res_json["updated_at"])
    assert response_updated_at > initial_updated_at

# Test 13: Successful deletion of a task
def test_delete_task_success(client: TestClient, test_session: Session):
    user_id = "test_user_delete"
    task_id = create_test_tasks(test_session, user_id)[0].id

    with override_current_user(user_id):
        response = client.delete(f"/api/{user_id}/tasks/{task_id}")
    
    assert response.status_code == 204

    # Verify task is deleted directly from the session
    deleted_task = test_session.exec(select(Task).where(Task.id == task_id)).first()
    assert deleted_task is None

# Test 14: Toggle completion from incomplete to complete
def test_toggle_completion_incomplete_to_complete(client: TestClient, test_session: Session):
    user_id = "test_user_toggle_on"
    # The first task created by helper is incomplete
    task = create_test_tasks(test_session, user_id)[0]
    assert not task.completed
    initial_updated_at = task.updated_at

    with override_current_user(user_id):
        response = client.patch(f"/api/{user_id}/tasks/{task.id}/complete")
    
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["completed"] is True
    response_updated_at = datetime.fromisoformat(res_json["updated_at"])
    assert response_updated_at > initial_updated_at

# Test 15: Toggle completion from complete to incomplete
def test_toggle_completion_complete_to_incomplete(client: TestClient, test_session: Session):
    user_id = "test_user_toggle_off"
    # The second task created by helper is complete
    task = create_test_tasks(test_session, user_id)[1]
    assert task.completed
    initial_updated_at = task.updated_at

    with override_current_user(user_id):
        response = client.patch(f"/api/{user_id}/tasks/{task.id}/complete")

    assert response.status_code == 200
    res_json = response.json()
    assert res_json["completed"] is False
    response_updated_at = datetime.fromisoformat(res_json["updated_at"])
    assert response_updated_at > initial_updated_at