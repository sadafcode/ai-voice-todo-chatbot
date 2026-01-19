"""
MCP Client Wrapper
Provides functions that call MCP tools directly (no HTTP needed since integrated)
"""
import sys
from pathlib import Path
from typing import Dict, Any, Optional

# Add backend directory to path for imports
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import MCP tools directly
import importlib.util
tools_path = backend_dir / "mcp-server" / "tools.py"
spec = importlib.util.spec_from_file_location("mcp_tools", tools_path)
tools_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tools_module)

# Import tool functions and input models directly
_add_task = tools_module.add_task
_list_tasks = tools_module.list_tasks
_complete_task = tools_module.complete_task
_delete_task = tools_module.delete_task
_update_task = tools_module.update_task
AddTaskInput = tools_module.AddTaskInput
ListTasksInput = tools_module.ListTasksInput
CompleteTaskInput = tools_module.CompleteTaskInput
DeleteTaskInput = tools_module.DeleteTaskInput
UpdateTaskInput = tools_module.UpdateTaskInput


# Tool wrapper functions that the Agent can use
async def add_task_tool(user_id: str, title: str, description: Optional[str] = None) -> Dict[str, Any]:
    """Create a new task for the user"""
    input_data = AddTaskInput(
        user_id=user_id,
        title=title,
        description=description
    )
    result = await _add_task(input_data)
    return result.model_dump() if hasattr(result, 'model_dump') else result.dict()


async def list_tasks_tool(user_id: str, status: Optional[str] = None) -> Dict[str, Any]:
    """List all tasks for the user with optional status filter"""
    input_data = ListTasksInput(
        user_id=user_id,
        status=status
    )
    result = await _list_tasks(input_data)
    return result.model_dump() if hasattr(result, 'model_dump') else result.dict()


async def complete_task_tool(user_id: str, task_id: int) -> Dict[str, Any]:
    """Mark a task as complete"""
    input_data = CompleteTaskInput(
        user_id=user_id,
        task_id=task_id
    )
    result = await _complete_task(input_data)
    return result.model_dump() if hasattr(result, 'model_dump') else result.dict()


async def delete_task_tool(user_id: str, task_id: int) -> Dict[str, Any]:
    """Delete a task from the list"""
    input_data = DeleteTaskInput(
        user_id=user_id,
        task_id=task_id
    )
    result = await _delete_task(input_data)
    return result.model_dump() if hasattr(result, 'model_dump') else result.dict()


async def update_task_tool(
    user_id: str,
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """Update a task's title and/or description"""
    input_data = UpdateTaskInput(
        user_id=user_id,
        task_id=task_id,
        title=title,
        description=description
    )
    result = await _update_task(input_data)
    return result.model_dump() if hasattr(result, 'model_dump') else result.dict()


# Dictionary mapping tool names to functions
MCP_TOOL_FUNCTIONS = {
    "add_task": add_task_tool,
    "list_tasks": list_tasks_tool,
    "complete_task": complete_task_tool,
    "delete_task": delete_task_tool,
    "update_task": update_task_tool
}
