"""
HTTP-based MCP Server for Todo Tools
Exposes MCP tools via HTTP endpoints that the OpenAI Agents SDK can connect to
"""
import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add parent directory to path to allow imports
current_dir = Path(__file__).parent
backend_dir = current_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import tools module from the same directory
import importlib.util
tools_path = current_dir / "tools.py"
spec = importlib.util.spec_from_file_location("mcp_tools", tools_path)
tools_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tools_module)

# Import the functions we need
add_task = tools_module.add_task
list_tasks = tools_module.list_tasks
complete_task = tools_module.complete_task
delete_task = tools_module.delete_task
update_task = tools_module.update_task
AddTaskInput = tools_module.AddTaskInput
ListTasksInput = tools_module.ListTasksInput
CompleteTaskInput = tools_module.CompleteTaskInput
DeleteTaskInput = tools_module.DeleteTaskInput
UpdateTaskInput = tools_module.UpdateTaskInput

# Create FastAPI app for MCP server
mcp_app = FastAPI(title="MCP Todo Tools Server")

# Add CORS middleware
mcp_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MCPToolRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]


class MCPToolResponse(BaseModel):
    result: Any = None
    error: str = None


@mcp_app.get("/mcp/tools")
async def list_tools():
    """List all available MCP tools"""
    return {
        "tools": [
            {
                "name": "add_task",
                "description": "Create a new task",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "title": {"type": "string", "description": "Task title"},
                        "description": {"type": "string", "description": "Task description (optional)"}
                    },
                    "required": ["user_id", "title"]
                }
            },
            {
                "name": "list_tasks",
                "description": "Retrieve tasks from the list with optional status filter",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "status": {
                            "type": "string",
                            "enum": ["all", "pending", "completed"],
                            "description": "Filter by status (optional, defaults to 'all')"
                        }
                    },
                    "required": ["user_id"]
                }
            },
            {
                "name": "complete_task",
                "description": "Mark a task as complete",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to complete"}
                    },
                    "required": ["user_id", "task_id"]
                }
            },
            {
                "name": "delete_task",
                "description": "Remove a task from the list",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to delete"}
                    },
                    "required": ["user_id", "task_id"]
                }
            },
            {
                "name": "update_task",
                "description": "Modify task title and/or description",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to update"},
                        "title": {"type": "string", "description": "New title (optional)"},
                        "description": {"type": "string", "description": "New description (optional)"}
                    },
                    "required": ["user_id", "task_id"]
                }
            }
        ]
    }


@mcp_app.post("/mcp/call")
async def call_tool(request: MCPToolRequest):
    """Execute an MCP tool with the given parameters"""
    try:
        tool_name = request.tool_name
        parameters = request.parameters

        # Map tool names to functions and input models
        tool_map = {
            "add_task": (add_task, AddTaskInput),
            "list_tasks": (list_tasks, ListTasksInput),
            "complete_task": (complete_task, CompleteTaskInput),
            "delete_task": (delete_task, DeleteTaskInput),
            "update_task": (update_task, UpdateTaskInput),
        }

        if tool_name not in tool_map:
            return MCPToolResponse(error=f"Tool '{tool_name}' not found")

        tool_func, input_model = tool_map[tool_name]

        # Validate and parse input
        input_data = input_model(**parameters)

        # Execute tool
        result = await tool_func(input_data)

        # Convert result to dict
        if hasattr(result, 'dict'):
            result_dict = result.dict()
        elif hasattr(result, 'model_dump'):
            result_dict = result.model_dump()
        else:
            result_dict = result

        return MCPToolResponse(result=result_dict)

    except ValueError as e:
        return MCPToolResponse(error=str(e))
    except Exception as e:
        return MCPToolResponse(error=f"Error executing tool: {str(e)}")


@mcp_app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "MCP Todo Tools Server"}


def start_mcp_server(port: int = 8001):
    """Start the MCP server on the specified port"""
    print(f"Starting MCP server on port {port}...")
    uvicorn.run(mcp_app, host="127.0.0.1", port=port, log_level="info")


if __name__ == "__main__":
    start_mcp_server()
