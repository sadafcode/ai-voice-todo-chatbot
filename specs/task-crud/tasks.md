# Implementation Tasks: Task CRUD Operations

## Task List

### Task TASK-1: Create Task Model
**Priority:** P0 (blocker)
**Estimate:** 15 minutes
**Dependencies:** None (assumes Python environment and SQLModel are installed)

**Description:**
Create the SQLModel class for the `Task` entity in the `backend/models.py` file, defining all necessary fields and relationships as per the database schema.

**Implementation Steps:**
1.  Open `backend/models.py`.
2.  Import `SQLModel`, `Field`, `Optional`, `datetime`, and `Relationship` (for user).
3.  Define the `Task` class with `table=True` and `__tablename__ = "tasks"`.
4.  Add fields: `id` (primary key, auto-increment), `user_id` (foreign key to `users.id`), `title`, `description`, `completed`, `created_at`, `updated_at`.
5.  Add a `Relationship` to the `User` model.

**Code (to be inserted in `backend/models.py`):**
```python
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship


class User(SQLModel, table=True):
    __tablename__ = "users" # type: ignore

    id: Optional[str] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    tasks: list["Task"] = Relationship(back_populates="user")


class Task(SQLModel, table=True):
    __tablename__ = "tasks" # type: ignore

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user_id: str = Field(foreign_key="users.id")
    user: Optional[User] = Relationship(back_populates="tasks")
```

**Test Cases:**
```python
# Test 1: Model instantiation
from datetime import datetime, timezone
from models import Task

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

# Test 2: Field validation (title)
try:
    Task(title="", user_id="test_user")
    assert False, "Should raise ValueError for empty title"
except ValueError:
    assert True

# Test 3: Relationship setup (manual check, will be fully tested with DB)
assert hasattr(Task, 'user')
```

**Acceptance Criteria:**
- [ ] `Task` SQLModel class is defined in `backend/models.py`.
- [ ] All fields (`id`, `title`, `description`, `completed`, `created_at`, `updated_at`, `user_id`) are correctly defined with appropriate types and constraints.
- [ ] `id` is an optional `int` primary key.
- [ ] `user_id` is a `str` foreign key to the `users` table.
- [ ] `created_at` and `updated_at` use `datetime.now(timezone.utc)` as default factory.
- [ ] `title` has `min_length=1` and `max_length=200`.
- [ ] `description` has `max_length=1000`.
- [ ] A `Relationship` exists between `Task` and `User`.

---

### Task TASK-2: Set Up Database Session
**Priority:** P0 (blocker)
**Estimate:** 10 minutes
**Dependencies:** None (assumes database setup and `DATABASE_URL` env var)

**Description:**
Implement the database engine and a `get_session` dependency in `backend/db.py` to manage SQLModel sessions for FastAPI routes.

**Implementation Steps:**
1.  Create `backend/db.py`.
2.  Import `create_engine`, `Session`, `SQLModel`.
3.  Define `DATABASE_URL` from environment variables.
4.  Create the `engine`.
5.  Define `create_db_and_tables` function.
6.  Define `get_session` generator function for dependency injection.

**Code (to be inserted in `backend/db.py`):**
```python
import os
from typing import Generator
from sqlmodel import create_engine, Session, SQLModel

# Load environment variables (consider using python-dotenv or similar in main app)
# from dotenv import load_dotenv
# load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

**Test Cases:**
```python
# Test 1: Ensure engine creation (manual check, requires DATABASE_URL)
import os
from db import engine, create_db_and_tables, get_session
from sqlmodel import Session

# Set dummy DATABASE_URL for testing if not set
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"

assert engine is not None

# Test 2: Session generation
session_gen = get_session()
session = next(session_gen)
assert isinstance(session, Session)
session.close()

# Test 3: Table creation (will need models imported)
# create_db_and_tables() # This will be run in main.py or a dedicated script
```

**Acceptance Criteria:**
- [ ] `backend/db.py` is created.
- [ ] `DATABASE_URL` is read from environment variables.
- [ ] SQLModel `engine` is created.
- [ ] `create_db_and_tables` function exists.
- [ ] `get_session` function provides a `Session` object.
- [ ] If `DATABASE_URL` is missing, a `ValueError` is raised.

---

### Task TASK-3: Implement POST /api/{user_id}/tasks Endpoint (Create Task)
**Priority:** P0 (blocker)
**Estimate:** 30 minutes
**Dependencies:** TASK-1, TASK-2, Authentication middleware (already planned for authentication feature)

**Description:**
Implement the FastAPI endpoint for creating a new task for a specific user. This endpoint will require a valid JWT for authentication and associate the new task with the authenticated user's ID.

**Implementation Steps:**
1.  Create `backend/routes/tasks.py`.
2.  Import `APIRouter`, `HTTPException`, `Depends`, `status` from `fastapi`.
3.  Import `Session` from `sqlmodel`.
4.  Import `Task` from `backend.models`.
5.  Import `get_session` from `backend.db`.
6.  Import `get_current_user` from `backend.auth`.
7.  Define a `TaskCreate` Pydantic model.
8.  Create an `APIRouter` with prefix `/{user_id}/tasks`.
9.  Implement the POST route `/{user_id}/tasks`.
10. Ensure `user_id` in path matches `get_current_user()`.
11. Create and save the new task to the database.
12. Return the created task.

**Code (to be inserted in `backend/routes/tasks.py`):**
```python
from fastapi import APIRouter, HTTPException, Depends, status, Path
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel

from backend.db import get_session
from backend.models import Task, User
from backend.auth import get_current_user # Assuming this exists from auth feature

router = APIRouter(tags=["tasks"])

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TaskRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    created_at: datetime
    updated_at: datetime
    user_id: str

@router.post("/api/{user_id}/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    user_id: str = Path(..., description="The ID of the user"),
    task_data: TaskCreate,
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create tasks for another user"
        )
    
    # Check if user exists (optional, but good for data integrity)
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    db_task = Task(title=task_data.title, description=task_data.description, user_id=user_id)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task
```

**Test Cases (using `pytest` and `httpx` or `requests`):**
```python
# Assuming a test client and authenticated user (setup in conftest.py)

# Test 1: Successful task creation
# Given an authenticated user 'user_abc' and a valid JWT token
# When POST to /api/user_abc/tasks with title and description
# Then response status is 201
# And response contains the created task data (id, title, user_id)

# Test 2: Unauthorized creation (mismatch user_id in path and token)
# Given an authenticated user 'user_abc' with token for 'user_abc'
# When POST to /api/user_xyz/tasks (different user_id)
# Then response status is 403 Forbidden

# Test 3: Unauthenticated request
# When POST to /api/user_abc/tasks without a token
# Then response status is 401 Unauthorized

# Test 4: Invalid input (empty title)
# Given an authenticated user
# When POST to /api/user_abc/tasks with empty title
# Then response status is 422 Unprocessable Entity
```

**Acceptance Criteria:**
- [ ] Endpoint `POST /api/{user_id}/tasks` exists and responds.
- [ ] Requires a valid JWT token for authentication.
- [ ] The `user_id` in the URL path must match the `user_id` from the authenticated token (403 Forbidden if mismatch).
- [ ] Successfully creates a `Task` record in the database, associated with `user_id`.
- [ ] Returns the created `Task` object with a 201 status code.
- [ ] Handles invalid input (e.g., empty title) with a 422 status code.
- [ ] Handles unauthenticated requests with a 401 status code.
- [ ] Ensures the referenced user actually exists in the database.

---

### Task TASK-4: Implement GET /api/{user_id}/tasks Endpoint (List Tasks)
**Priority:** P0 (blocker)
**Estimate:** 35 minutes
**Dependencies:** TASK-1, TASK-2, Authentication middleware, TASK-3 (for seed data)

**Description:**
Implement the FastAPI endpoint for listing all tasks belonging to a specific user, with optional filtering by status and sorting.

**Implementation Steps:**
1.  Add `status: Optional[str]` and `sort: Optional[str]` query parameters to the GET route.
2.  Modify the `select` statement to filter tasks by `user_id`.
3.  Implement filtering logic based on `status` (all, pending, completed).
4.  Implement sorting logic based on `sort` (created_at, title, updated_at).
5.  Return a list of `TaskRead` objects.

**Code (to be inserted in `backend/routes/tasks.py`):**
```python
# ... existing imports and TaskRead ...

@router.get("/api/{user_id}/tasks", response_model=List[TaskRead])
def list_tasks(
    user_id: str = Path(..., description="The ID of the user"),
    status: Optional[str] = None, # "all" | "pending" | "completed"
    sort: Optional[str] = None, # "created" | "title" | "updated"
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view tasks for another user"
        )
    
    statement = select(Task).where(Task.user_id == user_id)

    # Filtering by status
    if status == "pending":
        statement = statement.where(Task.completed == False)
    elif status == "completed":
        statement = statement.where(Task.completed == True)

    # Sorting
    if sort == "created":
        statement = statement.order_by(Task.created_at)
    elif sort == "title":
        statement = statement.order_by(Task.title)
    elif sort == "updated":
        statement = statement.order_by(Task.updated_at)
    # Default sort if none specified
    else:
        statement = statement.order_by(Task.created_at)

    tasks = session.exec(statement).all()
    return tasks
```

**Test Cases:**
```python
# Assuming a test client and authenticated user, and some tasks created via TASK-3

# Test 1: List all tasks for authenticated user
# Given an authenticated user 'user_abc' with several tasks
# When GET /api/user_abc/tasks
# Then response status is 200
# And response contains all tasks belonging to 'user_abc'

# Test 2: Filter by 'pending' status
# Given tasks with mixed completion status
# When GET /api/user_abc/tasks?status=pending
# Then response contains only pending tasks

# Test 3: Filter by 'completed' status
# Given tasks with mixed completion status
# When GET /api/user_abc/tasks?status=completed
# Then response contains only completed tasks

# Test 4: Sort by 'title'
# When GET /api/user_abc/tasks?sort=title
# Then tasks are sorted alphabetically by title

# Test 5: Unauthorized access (mismatch user_id in path and token)
# Given an authenticated user 'user_abc'
# When GET /api/user_xyz/tasks (different user_id)
# Then response status is 403 Forbidden
```

**Acceptance Criteria:**
- [ ] Endpoint `GET /api/{user_id}/tasks` exists and responds.
- [ ] Requires a valid JWT token.
- [ ] Returns only tasks associated with the authenticated `user_id`.
- [ ] Supports filtering by `status` query parameter ("pending", "completed").
- [ ] Supports sorting by `sort` query parameter ("created", "title", "updated").
- [ ] Default sort order is by `created_at` if `sort` is not specified or invalid.
- [ ] Returns a 403 Forbidden error if `user_id` in path does not match authenticated user.

---

### Task TASK-5: Implement GET /api/{user_id}/tasks/{id} Endpoint (Get Task Details)
**Priority:** P0 (blocker)
**Estimate:** 20 minutes
**Dependencies:** TASK-1, TASK-2, Authentication middleware, TASK-3 (for seed data)

**Description:**
Implement the FastAPI endpoint for retrieving details of a single task belonging to a specific user by its ID.

**Implementation Steps:**
1.  Define the GET route `/api/{user_id}/tasks/{task_id}`.
2.  Use `Path` for `user_id` and `task_id`.
3.  Query the database for the task by `task_id` and `user_id`.
4.  Return the `TaskRead` object if found, otherwise raise 404 Not Found.
5.  Ensure `user_id` in path matches `get_current_user()`.

**Code (to be inserted in `backend/routes/tasks.py`):**
```python
# ... existing imports and TaskRead ...

@router.get("/api/{user_id}/tasks/{task_id}", response_model=TaskRead)
def get_task_details(
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access tasks for another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or does not belong to user"
        )
    return task
```

**Test Cases:**
```python
# Assuming a test client and authenticated user, and a task created

# Test 1: Successful retrieval of a task
# Given an authenticated user 'user_abc' and task_id '1' belonging to them
# When GET /api/user_abc/tasks/1
# Then response status is 200
# And response contains the task details

# Test 2: Task not found or not belonging to user
# Given an authenticated user 'user_abc'
# When GET /api/user_abc/tasks/999 (non-existent ID)
# Then response status is 404 Not Found

# Test 3: Unauthorized access (mismatch user_id in path and token)
# Given an authenticated user 'user_abc'
# When GET /api/user_xyz/tasks/1 (different user_id)
# Then response status is 403 Forbidden
```

**Acceptance Criteria:**
- [ ] Endpoint `GET /api/{user_id}/tasks/{task_id}` exists and responds.
- [ ] Requires a valid JWT token.
- [ ] Returns a single `Task` object by `id` if it belongs to the authenticated `user_id`.
- [ ] Returns a 404 Not Found error if the task does not exist or does not belong to the user.
- [ ] Returns a 403 Forbidden error if `user_id` in path does not match authenticated user.

---

### Task TASK-6: Implement PUT /api/{user_id}/tasks/{id} Endpoint (Update Task)
**Priority:** P0 (blocker)
**Estimate:** 30 minutes
**Dependencies:** TASK-1, TASK-2, Authentication middleware, TASK-3 (for seed data)

**Description:**
Implement the FastAPI endpoint for updating an existing task belonging to a specific user by its ID. Allows partial updates.

**Implementation Steps:**
1.  Define a `TaskUpdate` Pydantic model (`title`, `description`, `completed` as optional).
2.  Define the PUT route `/api/{user_id}/tasks/{task_id}`.
3.  Query the database for the task by `task_id` and `user_id`.
4.  Update the task fields with provided data using `task.sqlmodel_update()`.
5.  Save and refresh the task.
6.  Return the updated `TaskRead` object.
7.  Ensure `user_id` in path matches `get_current_user()`.

**Code (to be inserted in `backend/routes/tasks.py`):**
```python
# ... existing imports and TaskRead ...

class TaskUpdate(SQLModel): # Use SQLModel for updates
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None

@router.put("/api/{user_id}/tasks/{task_id}", response_model=TaskRead)
def update_task(
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    task_data: TaskUpdate,
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update tasks for another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or does not belong to user"
        )
    
    task_dict = task_data.model_dump(exclude_unset=True) # use model_dump for SQLModel
    task.sqlmodel_update(task_dict)
    task.updated_at = datetime.now(timezone.utc) # Manually update updated_at
    
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

**Test Cases:**
```python
# Assuming a test client and authenticated user, and a task created

# Test 1: Successful full update of a task
# Given an authenticated user 'user_abc' and task_id '1'
# When PUT /api/user_abc/tasks/1 with new title, description, completed status
# Then response status is 200
# And response contains the updated task details

# Test 2: Successful partial update (e.g., only title)
# Given an authenticated user 'user_abc' and task_id '1'
# When PUT /api/user_abc/tasks/1 with only new title
# Then response status is 200
# And only the title is updated, other fields remain unchanged

# Test 3: Task not found or not belonging to user
# Given an authenticated user 'user_abc'
# When PUT /api/user_abc/tasks/999 with update data
# Then response status is 404 Not Found

# Test 4: Unauthorized access (mismatch user_id in path and token)
# Given an authenticated user 'user_abc'
# When PUT /api/user_xyz/tasks/1 with update data
# Then response status is 403 Forbidden
```

**Acceptance Criteria:**
- [ ] Endpoint `PUT /api/{user_id}/tasks/{task_id}` exists and responds.
- [ ] Requires a valid JWT token.
- [ ] Updates fields (`title`, `description`, `completed`) of a task belonging to the authenticated `user_id`.
- [ ] Supports partial updates (only provided fields are changed).
- [ ] `updated_at` timestamp is updated automatically.
- [ ] Returns the updated `Task` object with a 200 status code.
- [ ] Returns a 404 Not Found error if the task does not exist or does not belong to the user.
- [ ] Returns a 403 Forbidden error if `user_id` in path does not match authenticated user.

---

### Task TASK-7: Implement DELETE /api/{user_id}/tasks/{id} Endpoint (Delete Task)
**Priority:** P0 (blocker)
**Estimate:** 20 minutes
**Dependencies:** TASK-1, TASK-2, Authentication middleware, TASK-3 (for seed data)

**Description:**
Implement the FastAPI endpoint for deleting an existing task belonging to a specific user by its ID.

**Implementation Steps:**
1.  Define the DELETE route `/api/{user_id}/tasks/{task_id}`.
2.  Query the database for the task by `task_id` and `user_id`.
3.  Delete the task using `session.delete()`.
4.  Return a success message or 204 No Content.
5.  Ensure `user_id` in path matches `get_current_user()`.

**Code (to be inserted in `backend/routes/tasks.py`):**
```python
# ... existing imports ...

@router.delete("/api/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete tasks for another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or does not belong to user"
        )
    
    session.delete(task)
    session.commit()
    return {"message": "Task deleted successfully"} # FastAPI returns 200 for dictionaries, 204 for None if status_code set.
```

**Test Cases:**
```python
# Assuming a test client and authenticated user, and a task created

# Test 1: Successful deletion of a task
# Given an authenticated user 'user_abc' and task_id '1'
# When DELETE /api/user_abc/tasks/1
# Then response status is 204 No Content (or 200 with message)
# And subsequent GET for task_id '1' returns 404

# Test 2: Task not found or not belonging to user
# Given an authenticated user 'user_abc'
# When DELETE /api/user_abc/tasks/999 (non-existent ID)
# Then response status is 404 Not Found

# Test 3: Unauthorized access (mismatch user_id in path and token)
# Given an authenticated user 'user_abc'
# When DELETE /api/user_xyz/tasks/1 (different user_id)
# Then response status is 403 Forbidden
```

**Acceptance Criteria:**
- [ ] Endpoint `DELETE /api/{user_id}/tasks/{task_id}` exists and responds.
- [ ] Requires a valid JWT token.
- [ ] Deletes a `Task` record from the database if it belongs to the authenticated `user_id`.
- [ ] Returns a 204 No Content (or 200 with success message) status code on successful deletion.
- [ ] Returns a 404 Not Found error if the task does not exist or does not belong to the user.
- [ ] Returns a 403 Forbidden error if `user_id` in path does not match authenticated user.

---

### Task TASK-8: Implement PATCH /api/{user_id}/tasks/{id}/complete Endpoint (Toggle Completion)
**Priority:** P0 (blocker)
**Estimate:** 25 minutes
**Dependencies:** TASK-1, TASK-2, Authentication middleware, TASK-3 (for seed data)

**Description:**
Implement the FastAPI endpoint for toggling the completion status of a task belonging to a specific user by its ID.

**Implementation Steps:**
1.  Define the PATCH route `/api/{user_id}/tasks/{task_id}/complete`.
2.  Query the database for the task by `task_id` and `user_id`.
3.  Toggle the `completed` boolean field.
4.  Update `updated_at` timestamp.
5.  Save and refresh the task.
6.  Return the updated `TaskRead` object.
7.  Ensure `user_id` in path matches `get_current_user()`.

**Code (to be inserted in `backend/routes/tasks.py`):**
```python
# ... existing imports and TaskRead ...

@router.patch("/api/{user_id}/tasks/{task_id}/complete", response_model=TaskRead)
def toggle_task_completion(
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot toggle completion for tasks of another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or does not belong to user"
        )
    
    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)
    
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

**Test Cases:**
```python
# Assuming a test client and authenticated user, and a task created

# Test 1: Successful toggle from incomplete to complete
# Given an authenticated user 'user_abc' and task_id '1' which is incomplete
# When PATCH /api/user_abc/tasks/1/complete
# Then response status is 200
# And response shows task '1' as completed=True

# Test 2: Successful toggle from complete to incomplete
# Given an authenticated user 'user_abc' and task_id '1' which is complete
# When PATCH /api/user_abc/tasks/1/complete
# Then response status is 200
# And response shows task '1' as completed=False

# Test 3: Task not found or not belonging to user
# Given an authenticated user 'user_abc'
# When PATCH /api/user_abc/tasks/999/complete (non-existent ID)
# Then response status is 404 Not Found

# Test 4: Unauthorized access (mismatch user_id in path and token)
# Given an authenticated user 'user_abc'
# When PATCH /api/user_xyz/tasks/1/complete (different user_id)
# Then response status is 403 Forbidden
```

**Acceptance Criteria:**
- [ ] Endpoint `PATCH /api/{user_id}/tasks/{task_id}/complete` exists and responds.
- [ ] Requires a valid JWT token.
- [ ] Toggles the `completed` status of a task belonging to the authenticated `user_id`.
- [ ] `updated_at` timestamp is updated automatically.
- [ ] Returns the updated `Task` object with a 200 status code.
- [ ] Returns a 404 Not Found error if the task does not exist or does not belong to the user.
- [ ] Returns a 403 Forbidden error if `user_id` in path does not match authenticated user.

---

### Task TASK-9: Create Frontend TaskForm Component
**Priority:** P1 (high)
**Estimate:** 30 minutes
**Dependencies:** TASK-3 (Create Task endpoint)

**Description:**
Create a Next.js component (`TaskForm.tsx`) for creating new tasks. This component will include a form with inputs for the task title and description, and will handle the API call to the backend.

**Implementation Steps:**
1.  Create the file `frontend/src/app/tasks/components/TaskForm.tsx`.
2.  Use the `'use client'` directive as this component will manage its own state and handle user interactions.
3.  Import React hooks (`useState`, `useContext`), Next.js router (`useRouter`), and the `AuthContext` to get user details.
4.  Create a form with a required text input for the `title` and an optional `textarea` for the `description`.
5.  Implement a `handleSubmit` function that is called on form submission.
6.  Inside `handleSubmit`, perform the following:
    -   Prevent the default form submission behavior.
    -   Set a loading state to true.
    -   Check for the authentication token and user ID from the `AuthContext`.
    -   Make a `POST` request to the `/api/{user_id}/tasks` endpoint with the title and description in the request body. Include the JWT token in the `Authorization` header.
    -   Handle the API response:
        -   On success (201 Created), clear the form inputs, and optionally call a callback function passed in props (`onTaskCreated`) to notify the parent component.
        -   On failure, display an appropriate error message to the user.
    -   Set the loading state to false in a `finally` block.
7.  Use Tailwind CSS for styling, following the project's existing design patterns (e.g., from `LoginForm.tsx`).

**Code (to be inserted in `frontend/src/app/tasks/components/TaskForm.tsx`):**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext' // Assuming an AuthContext for user_id and token

interface TaskFormProps {
  onTaskCreated?: () => void; // Optional callback for when a task is successfully created
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, authToken } = useAuth() // Get user info and token from AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!user || !authToken) {
      setError('User not authenticated. Please log in.')
      setLoading(false)
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title, description }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.')
          router.push('/login')
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }

      // Task created successfully
      setTitle('')
      setDescription('')
      if (onTaskCreated) {
        onTaskCreated();
      }
      // Optionally, refresh the page or a part of it if needed
      // router.refresh(); // For Next.js 13+ app directory client components
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Task</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Creating Task...' : 'Add Task'}
        </button>
      </form>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] The `TaskForm` component is created at `frontend/src/app/tasks/components/TaskForm.tsx`.
- [ ] The form contains inputs for `title` and `description`.
- [ ] The form successfully submits a `POST` request to the create task API endpoint.
- [ ] The user's JWT token is included in the `Authorization` header.
- [ ] The component displays a loading state while the API request is in progress.
- [ ] The component displays an error message if the API request fails.
- [ ] Upon successful task creation, the form fields are cleared.

---
### Task TASK-10: Create Frontend TaskItem Component
**Priority:** P1 (high)
**Estimate:** 45 minutes
**Dependencies:** TASK-4 (List Tasks), TASK-6 (Update Task), TASK-7 (Delete Task), TASK-8 (Toggle Completion)

**Description:**
Create a Next.js component (`TaskItem.tsx`) to display a single task. This component will show the task's title and description, and include controls for updating, deleting, and marking the task as complete.

**Implementation Steps:**
1.  Create the file `frontend/src/app/tasks/components/TaskItem.tsx`.
2.  Use the `'use client'` directive.
3.  Define the `Task` interface based on the backend's `TaskRead` model.
4.  The component will accept a `task` object as a prop, as well as callback functions for handling delete and update events (`onDelete`, `onUpdate`).
5.  Display the task's `title` and `description`.
6.  Add a "Delete" button that, when clicked, calls a function to send a `DELETE` request to `/api/{user_id}/tasks/{task_id}`. After a successful deletion, it should call the `onDelete` prop.
7.  Add a "Complete" checkbox or button that, when toggled, sends a `PATCH` request to `/api/{user_id}/tasks/{task_id}/complete`. On success, it should call the `onUpdate` prop with the updated task.
8.  (Optional) Add an "Edit" button that allows the user to modify the task's title and description in-place or by opening a modal. This would involve a `PUT` request to `/api/{user_id}/tasks/{task_id}`.
9.  Display loading and error states for each action (delete, update, complete).
10. Use Tailwind CSS for styling, with different styles for completed tasks (e.g., strikethrough text).

**Code (to be inserted in `frontend/src/app/tasks/components/TaskItem.tsx`):**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Task } from '@/types/api' // Assuming types are defined in frontend/types/api.ts

interface TaskItemProps {
  task: Task;
  onDelete: (taskId: number) => void;
  onUpdate: (updatedTask: Task) => void;
}

export default function TaskItem({ task, onDelete, onUpdate }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState('');
  const { user, authToken } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    if (!user || !authToken) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.id}/tasks/${task.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error('Failed to delete task');

      onDelete(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    setError('');

    if (!user || !authToken) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.id}/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (!response.ok) throw new Error('Failed to update task');

      const updatedTask = await response.json();
      onUpdate(updatedTask);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className={`p-4 border rounded-md ${task.completed ? 'bg-gray-100' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-bold ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
          <p className="text-sm text-gray-600">{task.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggleComplete}
            disabled={isCompleting}
            className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] The `TaskItem` component is created at `frontend/src/app/tasks/components/TaskItem.tsx`.
- [ ] The component correctly displays the task's title and description.
- [ ] Clicking the "Delete" button triggers the `DELETE` API call and removes the task from the list on success.
- [ ] Toggling the completion checkbox triggers the `PATCH` API call and updates the task's visual state.
- [ ] Loading and error states are handled for each action.
- [ ] Completed tasks are visually distinct from pending tasks.

---
### Task TASK-11: Create Frontend TaskList Page
**Priority:** P1 (high)
**Estimate:** 40 minutes
**Dependencies:** `AuthContext`, `TaskForm` component (TASK-9), `TaskItem` component (TASK-10), List Tasks API (TASK-4)

**Description:**
Create the main page for displaying and managing tasks at the route `/tasks`. This page will fetch the user's tasks, render a list of `TaskItem` components, and include the `TaskForm` for adding new tasks.

**Implementation Steps:**
1.  Create the file `frontend/src/app/tasks/page.tsx`.
2.  Use the `'use client'` directive for interactivity.
3.  Use the `AuthContext` to ensure the user is authenticated. If not, redirect to the `/login` page.
4.  Use a `useEffect` hook to fetch the list of tasks from the `GET /api/{user_id}/tasks` endpoint when the component mounts.
5.  Store the fetched tasks in a state variable (e.g., `useState<Task[]>([])`).
6.  Implement state for loading and error handling for the initial fetch.
7.  Render the `TaskForm` component. Provide it with a callback function (`onTaskCreated`) that adds the new task to the state list, avoiding a full page refresh.
8.  Map over the tasks in the state and render a `TaskItem` component for each one.
9.  Pass the necessary props to `TaskItem`, including the `task` object and callback handlers for `onDelete` and `onUpdate`.
    -   The `onDelete` handler should remove the task from the state list.
    -   The `onUpdate` handler should find and replace the task in the state list with the updated version.
10. Add filtering and sorting UI elements (e.g., dropdowns) that re-fetch the tasks with the appropriate query parameters (`status`, `sort`).

**Code (to be inserted in `frontend/src/app/tasks/page.tsx`):**
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Task } from '@/types/api'
import TaskForm from './components/TaskForm' // Assuming path is correct
import TaskItem from './components/TaskItem' // Assuming path is correct

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, authToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const fetchTasks = useCallback(async () => {
    if (!user || !authToken) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.id}/tasks`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, authToken]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchTasks();
    }
  }, [user, authLoading, router, fetchTasks]);

  const handleTaskCreated = () => {
    fetchTasks(); // Re-fetch tasks to include the new one
  };

  const handleTaskDeleted = (taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  if (authLoading || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>
      
      <div className="mb-8">
        <TaskForm onTaskCreated={handleTaskCreated} />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onDelete={handleTaskDeleted}
              onUpdate={handleTaskUpdated}
            />
          ))
        ) : (
          <p>You have no tasks yet. Add one above!</p>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] The `TasksPage` component is created at `frontend/src/app/tasks/page.tsx`.
- [ ] The page redirects to `/login` if the user is not authenticated.
- [ ] On load, the page fetches and displays a list of the user's tasks.
- [ ] The `TaskForm` is rendered and can be used to add new tasks to the list.
- [ ] The list updates dynamically when a task is created, updated, or deleted without a full page reload.
- [ ] Loading and error states for the main task list are handled.

---
## Summary

**Total Tasks:** 11
**Total Estimate:** 5 hours

**Task Dependencies:**
```
Backend:
TASK-1 (Task Model)
  └── TASK-2 (DB Session)
      └── TASK-3 (Create Task)
          ├── TASK-4 (List Tasks)
          ├── TASK-5 (Get Task Details)
          ├── TASK-6 (Update Task)
          ├── TASK-7 (Delete Task)
          └── TASK-8 (Toggle Completion)

Frontend:
TASK-3 (Create Task API) ──> TASK-9 (TaskForm Component)
TASK-4,6,7,8 (APIs) ─────> TASK-10 (TaskItem Component)
TASK-9,10 (Components)──> TASK-11 (TaskList Page)
```

**Implementation Order:**
1.  TASK-1 → TASK-2 → TASK-3 → TASK-4 → TASK-5 → TASK-6 → TASK-7 → TASK-8 (Backend)
2.  TASK-9 → TASK-10 → TASK-11 (Frontend)
```