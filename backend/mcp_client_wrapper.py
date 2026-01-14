"""
MCP Client Wrapper
Provides functions that call the MCP server via HTTP and can be used as agent tools
"""
import httpx
from typing import Dict, Any, Optional


MCP_SERVER_URL = "http://127.0.0.1:8001"


async def call_mcp_tool(tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call an MCP tool via HTTP and return the result
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{MCP_SERVER_URL}/mcp/call",
                json={
                    "tool_name": tool_name,
                    "parameters": parameters
                }
            )
            response.raise_for_status()
            data = response.json()

            if data.get("error"):
                raise ValueError(f"MCP tool error: {data['error']}")

            return data.get("result", {})

        except httpx.HTTPError as e:
            raise Exception(f"HTTP error calling MCP tool {tool_name}: {str(e)}")
        except Exception as e:
            raise Exception(f"Error calling MCP tool {tool_name}: {str(e)}")


# Tool wrapper functions that the Agent can use
async def add_task_tool(user_id: str, title: str, description: Optional[str] = None) -> Dict[str, Any]:
    """Create a new task"""
    parameters = {
        "user_id": user_id,
        "title": title
    }
    if description:
        parameters["description"] = description

    return await call_mcp_tool("add_task", parameters)


async def list_tasks_tool(user_id: str, status: Optional[str] = None) -> Dict[str, Any]:
    """List tasks with optional status filter"""
    parameters = {"user_id": user_id}
    if status:
        parameters["status"] = status

    return await call_mcp_tool("list_tasks", parameters)


async def complete_task_tool(user_id: str, task_id: int) -> Dict[str, Any]:
    """Mark a task as complete"""
    parameters = {
        "user_id": user_id,
        "task_id": task_id
    }
    return await call_mcp_tool("complete_task", parameters)


async def delete_task_tool(user_id: str, task_id: int) -> Dict[str, Any]:
    """Delete a task"""
    parameters = {
        "user_id": user_id,
        "task_id": task_id
    }
    return await call_mcp_tool("delete_task", parameters)


async def update_task_tool(
    user_id: str,
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """Update a task's title and/or description"""
    parameters = {
        "user_id": user_id,
        "task_id": task_id
    }
    if title is not None:
        parameters["title"] = title
    if description is not None:
        parameters["description"] = description

    return await call_mcp_tool("update_task", parameters)


# Dictionary mapping tool names to functions
MCP_TOOL_FUNCTIONS = {
    "add_task": add_task_tool,
    "list_tasks": list_tasks_tool,
    "complete_task": complete_task_tool,
    "delete_task": delete_task_tool,
    "update_task": update_task_tool
}
