from fastapi import APIRouter, HTTPException, Depends, Path
from sqlmodel import Session, select, Field, SQLModel
from typing import List, Optional
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone

from db import get_session
from models import Task, User
from auth import get_current_user

router = APIRouter(tags=["tasks"])

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: Optional[str] = Field(default=None, regex="^(low|medium|high)$")  # low, medium, high (optional)
    recurrence_pattern: Optional[str] = Field(default=None, max_length=50)  # e.g., daily, weekly, monthly (optional)

    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

class TaskRead(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: str = "medium"
    recurrence_pattern: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: str

@router.post("/api/{user_id}/tasks", response_model=TaskRead, status_code=201)
def create_task(
    task_data: TaskCreate,
    user_id: str = Path(..., description="The ID of the user"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot create tasks for another user"
        )
    
    # Check if user exists (optional, but good for data integrity)
    user = session.exec(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User with ID {user_id} not found"
        )

    db_task = Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority or "medium",
        recurrence_pattern=task_data.recurrence_pattern,
        user_id=user_id,
        updated_at=datetime.now(timezone.utc) # Explicitly set updated_at
    )
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


@router.get("/api/{user_id}/tasks", response_model=List[TaskRead])
def list_tasks(
    user_id: str = Path(..., description="The ID of the user"),
    status: Optional[str] = None, # "all" | "pending" | "completed"
    sort: Optional[str] = "created_at", # "created_at" | "title" | "updated_at"
    order: Optional[str] = "asc", # "asc" | "desc"
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot view tasks for another user"
        )
    
    statement = select(Task).where(Task.user_id == user_id)

    # Filtering by status
    if status == "pending":
        statement = statement.where(Task.completed == False)
    elif status == "completed":
        statement = statement.where(Task.completed == True)

    # Sorting
    sortable_fields = {
        "created_at": Task.created_at,
        "title": Task.title,
        "updated_at": Task.updated_at,
    }
    
    sort_column = sortable_fields.get(sort, Task.created_at)

    if order == "desc":
        statement = statement.order_by(sort_column.desc(), Task.created_at.desc())
    else:
        statement = statement.order_by(sort_column.asc(), Task.created_at.asc())

    tasks = session.exec(statement).all()
    return tasks


@router.get("/api/{user_id}/tasks/{task_id}", response_model=TaskRead)
def get_task_details(
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot access tasks for another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or does not belong to user"
        )
    return task


class TaskUpdate(SQLModel): # Use SQLModel for updates
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[str] = Field(default=None, regex="^(low|medium|high)$")  # low, medium, high
    recurrence_pattern: Optional[str] = Field(default=None, max_length=50)  # e.g., daily, weekly, monthly

@router.put("/api/{user_id}/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_data: TaskUpdate,
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot update tasks for another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or does not belong to user"
        )
    
    task_dict = task_data.model_dump(exclude_unset=True) # use model_dump for SQLModel
    task.sqlmodel_update(task_dict)
    task.updated_at = datetime.now(timezone.utc) # Manually update updated_at
    
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.delete("/api/{user_id}/tasks/{task_id}", status_code=204)
def delete_task(
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete tasks for another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or does not belong to user"
        )
    
    session.delete(task)
    session.commit()
    # No return value for 204 status code


@router.patch("/api/{user_id}/tasks/{task_id}/complete", response_model=TaskRead)
def toggle_task_completion(
    user_id: str = Path(..., description="The ID of the user"),
    task_id: int = Path(..., description="The ID of the task"),
    session: Session = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot toggle completion for tasks of another user"
        )
    
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    task = session.exec(statement).first()
    
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found or does not belong to user"
        )
    
    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc) # Manually update updated_at
    
    session.add(task)
    session.commit()
    session.refresh(task)
    return task