"""
Proper MCP Server Implementation for Todo Tools
Implements the Model Context Protocol to expose our task operations as tools
"""
import asyncio
import json
import sys
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MCPRequest(BaseModel):
    method: str
    id: Optional[str] = None
    params: Optional[Dict[str, Any]] = None


class MCPResponse(BaseModel):
    id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class ToolDescription(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]


class MCPToolServer:
    def __init__(self):
        self.tools: Dict[str, callable] = {}
        self._initialize_tools()

    def _initialize_tools(self):
        """Initialize our todo management tools"""
        # Import the actual tool implementations
        from .tools import (
            add_task, list_tasks, complete_task, delete_task, update_task
        )

        # Map tool names to functions
        self.tools = {
            "add_task": add_task,
            "list_tasks": list_tasks,
            "complete_task": complete_task,
            "delete_task": delete_task,
            "update_task": update_task,
        }

    def get_tool_descriptions(self) -> List[ToolDescription]:
        """Return descriptions of all available tools"""
        return [
            ToolDescription(
                name="add_task",
                description="Create a new task",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "title": {"type": "string", "description": "Task title"},
                        "description": {"type": "string", "description": "Task description (optional)"}
                    },
                    "required": ["user_id", "title"]
                }
            ),
            ToolDescription(
                name="list_tasks",
                description="Retrieve tasks from the list",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "status": {"type": "string", "enum": ["all", "pending", "completed"], "description": "Filter by status (optional)"}
                    },
                    "required": ["user_id"]
                }
            ),
            ToolDescription(
                name="complete_task",
                description="Mark a task as complete",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to complete"}
                    },
                    "required": ["user_id", "task_id"]
                }
            ),
            ToolDescription(
                name="delete_task",
                description="Remove a task from the list",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to delete"}
                    },
                    "required": ["user_id", "task_id"]
                }
            ),
            ToolDescription(
                name="update_task",
                description="Modify task title or description",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to update"},
                        "title": {"type": "string", "description": "New title (optional)"},
                        "description": {"type": "string", "description": "New description (optional)"}
                    },
                    "required": ["user_id", "task_id"]
                }
            )
        ]

    async def handle_request(self, request: MCPRequest) -> MCPResponse:
        """Handle an MCP request"""
        logger.info(f"Handling MCP request: {request.method}")

        try:
            if request.method == "tools/list":
                # Return list of available tools
                tools = self.get_tool_descriptions()
                return MCPResponse(
                    id=request.id,
                    result={"tools": [t.dict() for t in tools]}
                )

            elif request.method.startswith("tools/call/"):
                # Extract tool name from method (e.g., "tools/call/add_task")
                tool_name = request.method.split("/")[-1]

                if tool_name not in self.tools:
                    return MCPResponse(
                        id=request.id,
                        error={
                            "code": -32601,  # Method not found
                            "message": f"Tool '{tool_name}' not found"
                        }
                    )

                # Execute the tool
                tool_func = self.tools[tool_name]
                params = request.params or {}

                # Call the tool function
                result = await tool_func(**params)

                return MCPResponse(
                    id=request.id,
                    result={"content": result.dict() if hasattr(result, 'dict') else result}
                )

            else:
                return MCPResponse(
                    id=request.id,
                    error={
                        "code": -32601,  # Method not found
                        "message": f"Method '{request.method}' not supported"
                    }
                )

        except Exception as e:
            logger.error(f"Error handling request: {e}")
            return MCPResponse(
                id=request.id,
                error={
                    "code": -32603,  # Internal error
                    "message": str(e)
                }
            )

    async def run(self):
        """Run the MCP server - reads from stdin, writes to stdout"""
        logger.info("MCP Server starting...")

        # Send initialization message
        init_response = {
            "jsonrpc": "2.0",
            "method": "initialized"
        }
        print(json.dumps(init_response), flush=True)

        # Main loop - read requests from stdin
        for line in sys.stdin:
            try:
                # Parse the incoming request
                request_data = json.loads(line.strip())

                # Create MCPRequest object
                mcp_request = MCPRequest(
                    method=request_data.get("method"),
                    id=request_data.get("id"),
                    params=request_data.get("params")
                )

                # Handle the request
                response = await self.handle_request(mcp_request)

                # Send response back
                response_data = {
                    "jsonrpc": "2.0",
                    "id": response.id,
                }

                if response.result:
                    response_data["result"] = response.result
                elif response.error:
                    response_data["error"] = response.error

                print(json.dumps(response_data), flush=True)

            except json.JSONDecodeError:
                # Invalid JSON, send error response
                error_response = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": -32700,  # Parse error
                        "message": "Invalid JSON"
                    }
                }
                print(json.dumps(error_response), flush=True)

            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                error_response = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": -32603,  # Internal error
                        "message": str(e)
                    }
                }
                print(json.dumps(error_response), flush=True)


# Global server instance
mcp_server = MCPToolServer()


async def main():
    """Main entry point for the MCP server"""
    await mcp_server.run()


if __name__ == "__main__":
    asyncio.run(main())