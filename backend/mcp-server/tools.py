"""
MCP Tools for Todo Chatbot
Implements the 5 required MCP tools for task operations
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import asyncio
from sqlmodel import Session, select
from models import Task, User
from db import get_engine


class AddTaskInput(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = None


class AddTaskOutput(BaseModel):
    task_id: int
    status: str
    title: str


class ListTasksInput(BaseModel):
    user_id: str
    status: Optional[str] = None  # "all", "pending", "completed"


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    created_at: str
    updated_at: str


class ListTasksOutput(BaseModel):
    tasks: List[TaskResponse]


class CompleteTaskInput(BaseModel):
    user_id: str
    task_id: int


class CompleteTaskOutput(BaseModel):
    task_id: int
    status: str
    title: str


class DeleteTaskInput(BaseModel):
    user_id: str
    task_id: int


class DeleteTaskOutput(BaseModel):
    task_id: int
    status: str
    title: str


class UpdateTaskInput(BaseModel):
    user_id: str
    task_id: int
    title: Optional[str] = None
    description: Optional[str] = None


class UpdateTaskOutput(BaseModel):
    task_id: int
    status: str
    title: str


async def add_task(input_data: AddTaskInput) -> AddTaskOutput:
    """
    MCP Tool: Add a new task
    Purpose: Create a new task
    """
    with Session(get_engine()) as session:
        # Verify user exists
        user = session.get(User, input_data.user_id)
        if not user:
            raise ValueError(f"User {input_data.user_id} not found")

        # Create new task
        task = Task(
            user_id=input_data.user_id,
            title=input_data.title,
            description=input_data.description,
            completed=False  # New tasks are not completed by default
        )
        session.add(task)
        session.commit()
        session.refresh(task)

        return AddTaskOutput(
            task_id=task.id,
            status="created",
            title=task.title
        )


async def list_tasks(input_data: ListTasksInput) -> ListTasksOutput:
    """
    MCP Tool: List tasks
    Purpose: Retrieve tasks from the list
    """
    with Session(get_engine()) as session:
        # Verify user exists
        user = session.get(User, input_data.user_id)
        if not user:
            raise ValueError(f"User {input_data.user_id} not found")

        # Build query based on status filter
        query = select(Task).where(Task.user_id == input_data.user_id)

        if input_data.status and input_data.status != "all":
            if input_data.status == "pending":
                query = query.where(Task.completed == False)
            elif input_data.status == "completed":
                query = query.where(Task.completed == True)

        tasks = session.exec(query).all()

        # Convert to response format
        task_responses = []
        for task in tasks:
            task_responses.append(TaskResponse(
                id=task.id,
                title=task.title,
                description=task.description,
                completed=task.completed,
                created_at=task.created_at.isoformat() if task.created_at else "",
                updated_at=task.updated_at.isoformat() if task.updated_at else ""
            ))

        return ListTasksOutput(tasks=task_responses)


async def complete_task(input_data: CompleteTaskInput) -> CompleteTaskOutput:
    """
    MCP Tool: Complete a task
    Purpose: Mark a task as complete
    """
    with Session(get_engine()) as session:
        # Verify user exists
        user = session.get(User, input_data.user_id)
        if not user:
            raise ValueError(f"User {input_data.user_id} not found")

        # Get the task
        task = session.get(Task, input_data.task_id)
        if not task:
            raise ValueError(f"Task {input_data.task_id} not found")

        # Verify task belongs to user
        if task.user_id != input_data.user_id:
            raise ValueError(f"Task {input_data.task_id} does not belong to user {input_data.user_id}")

        # Update completion status
        task.completed = True
        session.add(task)
        session.commit()
        session.refresh(task)

        return CompleteTaskOutput(
            task_id=task.id,
            status="completed",
            title=task.title
        )


async def delete_task(input_data: DeleteTaskInput) -> DeleteTaskOutput:
    """
    MCP Tool: Delete a task
    Purpose: Remove a task from the list
    """
    with Session(get_engine()) as session:
        # Verify user exists
        user = session.get(User, input_data.user_id)
        if not user:
            raise ValueError(f"User {input_data.user_id} not found")

        # Get the task
        task = session.get(Task, input_data.task_id)
        if not task:
            raise ValueError(f"Task {input_data.task_id} not found")

        # Verify task belongs to user
        if task.user_id != input_data.user_id:
            raise ValueError(f"Task {input_data.task_id} does not belong to user {input_data.user_id}")

        # Delete the task
        session.delete(task)
        session.commit()

        return DeleteTaskOutput(
            task_id=task.id,
            status="deleted",
            title=task.title
        )


async def update_task(input_data: UpdateTaskInput) -> UpdateTaskOutput:
    """
    MCP Tool: Update a task
    Purpose: Modify task title or description
    """
    with Session(get_engine()) as session:
        # Verify user exists
        user = session.get(User, input_data.user_id)
        if not user:
            raise ValueError(f"User {input_data.user_id} not found")

        # Get the task
        task = session.get(Task, input_data.task_id)
        if not task:
            raise ValueError(f"Task {input_data.task_id} not found")

        # Verify task belongs to user
        if task.user_id != input_data.user_id:
            raise ValueError(f"Task {input_data.task_id} does not belong to user {input_data.user_id}")

        # Update fields if provided
        if input_data.title is not None:
            task.title = input_data.title
        if input_data.description is not None:
            task.description = input_data.description

        session.add(task)
        session.commit()
        session.refresh(task)

        return UpdateTaskOutput(
            task_id=task.id,
            status="updated",
            title=task.title
        )