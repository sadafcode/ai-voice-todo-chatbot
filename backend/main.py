from dotenv import load_dotenv

load_dotenv()

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from db import create_db_and_tables
from routes.tasks import router as tasks_router
from routes.auth import router as auth_router
from routes.chat import router as chat_router

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

# Import tool functions
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

class MCPToolRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]

class MCPToolResponse(BaseModel):
    result: Any = None
    error: str = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    create_db_and_tables()
    print("Database tables created")
    print("MCP endpoints available at /mcp/tools, /mcp/call, /mcp/health")

    yield
    # Code to run on shutdown
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

# CORS CONFIGURATION - Support both local and production
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3004",
    "http://localhost:3005",
    "http://localhost:3006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3004",
    "http://127.0.0.1:3005",
    "http://127.0.0.1:3006",
]

# Add Vercel frontend URL from environment variable if present
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
    # Also allow Vercel preview deployments
    if "vercel.app" in frontend_url:
        origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)
app.include_router(auth_router) # NEW INCLUDE
app.include_router(chat_router, prefix="/api")  # NEW INCLUDE for chat endpoints

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI Backend!"}

# ============ MCP ENDPOINTS (Integrated) ============

@app.get("/mcp/health")
async def mcp_health():
    """MCP Health check endpoint"""
    return {"status": "healthy", "service": "MCP Todo Tools Server (Integrated)"}

@app.get("/mcp/tools")
async def mcp_list_tools():
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
                        "status": {"type": "string", "enum": ["all", "pending", "completed"], "description": "Filter by status"}
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

@app.post("/mcp/call")
async def mcp_call_tool(request: MCPToolRequest):
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