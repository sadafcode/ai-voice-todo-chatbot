"""MCP Server for Todo Management Tools"""

import asyncio
import json
from typing import Dict, Any, List, Optional
from mcp.server import FastMCP
from pydantic import BaseModel

# Initialize the server using FastMCP
server = FastMCP(name="todo-tools")


from typing import TypedDict

class TaskData(TypedDict):
    user_id: str
    title: str
    description: str
    priority: str
    recurrence_pattern: Optional[str]
    completed: bool


@server.tool(
    "list_tasks",
    description="Get user's tasks with optional status filter"
)
async def list_tasks(user_id: str, status: Optional[str] = None) -> List[TaskData]:
    """List tasks for a specific user"""
    # Import here to avoid circular imports
    from db import get_session
    from models import Task
    from sqlmodel import Session, select

    with get_session() as session:
        query = select(Task).where(Task.user_id == user_id)

        if status and status != "all":
            if status == "pending":
                query = query.where(Task.completed == False)
            elif status == "completed":
                query = query.where(Task.completed == True)

        tasks = session.exec(query).all()

        return [
            {
                "user_id": task.user_id,
                "title": task.title,
                "description": task.description,
                "priority": task.priority,
                "recurrence_pattern": task.recurrence_pattern,
                "completed": task.completed
            }
            for task in tasks
        ]


@server.tool(
    "add_task",
    description="Create a new task for a user"
)
async def add_task(user_id: str, title: str, description: str = "", priority: str = "medium", recurrence_pattern: Optional[str] = None) -> Dict[str, Any]:
    """Add a new task for a user"""
    from db import get_session
    from models import Task
    from sqlmodel import Session

    with get_session() as session:
        new_task = Task(
            user_id=user_id,
            title=title,
            description=description,
            priority=priority,
            recurrence_pattern=recurrence_pattern,
            completed=False
        )
        session.add(new_task)
        session.commit()
        session.refresh(new_task)

        return {
            "success": True,
            "task_id": new_task.id,
            "message": f"Task '{title}' has been created successfully"
        }


@server.tool(
    "update_task",
    description="Update an existing task for a user"
)
async def update_task(
    user_id: str,
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    recurrence_pattern: Optional[str] = None,
    completed: Optional[bool] = None
) -> Dict[str, Any]:
    """Update an existing task for a user"""
    from db import get_session
    from models import Task
    from sqlmodel import Session, select

    with get_session() as session:
        # Find the task
        task = session.exec(select(Task).where(Task.id == task_id, Task.user_id == user_id)).first()

        if not task:
            return {
                "success": False,
                "message": f"Task with ID {task_id} not found for user {user_id}"
            }

        # Update the task with provided values
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if priority is not None:
            task.priority = priority
        if recurrence_pattern is not None:
            task.recurrence_pattern = recurrence_pattern
        if completed is not None:
            task.completed = completed

        session.add(task)
        session.commit()
        session.refresh(task)

        return {
            "success": True,
            "message": f"Task '{task.title}' has been updated successfully"
        }


@server.tool(
    "complete_task",
    description="Mark a task as completed for a user"
)
async def complete_task(user_id: str, task_id: int) -> Dict[str, Any]:
    """Mark a task as completed for a user"""
    from db import get_session
    from models import Task
    from sqlmodel import Session, select

    with get_session() as session:
        # Find the task
        task = session.exec(select(Task).where(Task.id == task_id, Task.user_id == user_id)).first()

        if not task:
            return {
                "success": False,
                "message": f"Task with ID {task_id} not found for user {user_id}"
            }

        task.completed = True
        session.add(task)
        session.commit()

        return {
            "success": True,
            "message": f"Task '{task.title}' has been marked as completed"
        }


@server.tool(
    "delete_task",
    description="Remove a task for a user"
)
async def delete_task(user_id: str, task_id: int) -> Dict[str, Any]:
    """Remove a task for a user"""
    from db import get_session
    from models import Task
    from sqlmodel import Session, select

    with get_session() as session:
        # Find the task
        task = session.exec(select(Task).where(Task.id == task_id, Task.user_id == user_id)).first()

        if not task:
            return {
                "success": False,
                "message": f"Task with ID {task_id} not found for user {user_id}"
            }

        session.delete(task)
        session.commit()

        return {
            "success": True,
            "message": f"Task '{task.title}' has been deleted"
        }


if __name__ == "__main__":
    # Run the server with HTTP support
    import uvicorn
    uvicorn.run(server.streamable_http_app, host="127.0.0.1", port=8000, log_level="info")