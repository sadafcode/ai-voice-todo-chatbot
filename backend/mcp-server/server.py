"""
MCP Server Implementation for Todo Chatbot
Implements the MCP protocol to expose task operations as tools for AI agents
"""
import asyncio
from typing import Dict, Any, Callable
from pydantic import BaseModel
import json
from .tools import (
    add_task, list_tasks, complete_task, delete_task, update_task,
    AddTaskInput, ListTasksInput, CompleteTaskInput, DeleteTaskInput, UpdateTaskInput
)


class MCPToolCall(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]


class MCPResponse(BaseModel):
    result: Any
    error: str = None


class MCPServer:
    def __init__(self):
        self.tools: Dict[str, Callable] = {
            "add_task": add_task,
            "list_tasks": list_tasks,
            "complete_task": complete_task,
            "delete_task": delete_task,
            "update_task": update_task,
        }

    async def call_tool(self, tool_name: str, parameters: Dict[str, Any]) -> MCPResponse:
        """
        Execute an MCP tool call with the given parameters
        """
        if tool_name not in self.tools:
            return MCPResponse(error=f"Tool '{tool_name}' not found")

        tool_func = self.tools[tool_name]

        try:
            # Determine the input model for the tool
            if tool_name == "add_task":
                input_model = AddTaskInput
            elif tool_name == "list_tasks":
                input_model = ListTasksInput
            elif tool_name == "complete_task":
                input_model = CompleteTaskInput
            elif tool_name == "delete_task":
                input_model = DeleteTaskInput
            elif tool_name == "update_task":
                input_model = UpdateTaskInput
            else:
                return MCPResponse(error=f"Unknown tool: {tool_name}")

            # Validate input parameters
            input_data = input_model(**parameters)

            # Call the tool function
            result = await tool_func(input_data)
            return MCPResponse(result=result)

        except Exception as e:
            return MCPResponse(error=str(e))

    async def process_tool_calls(self, tool_calls: list) -> list:
        """
        Process multiple tool calls sequentially
        """
        results = []
        for call in tool_calls:
            if isinstance(call, dict):
                tool_name = call.get("tool_name") or call.get("name")
                parameters = call.get("parameters") or call.get("arguments", {})
            else:
                # Assume it's an MCPToolCall object
                tool_name = call.tool_name
                parameters = call.parameters

            result = await self.call_tool(tool_name, parameters)
            results.append({
                "tool_name": tool_name,
                "result": result.result,
                "error": result.error
            })

        return results

    def get_tool_descriptions(self) -> Dict[str, Any]:
        """
        Return descriptions of all available tools for tool discovery
        """
        return {
            "add_task": {
                "description": "Create a new task",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "title": {"type": "string", "description": "Task title"},
                        "description": {"type": "string", "description": "Task description (optional)"}
                    },
                    "required": ["user_id", "title"]
                },
                "returns": {
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "integer", "description": "ID of created task"},
                        "status": {"type": "string", "description": "Status of operation"},
                        "title": {"type": "string", "description": "Title of created task"}
                    }
                }
            },
            "list_tasks": {
                "description": "Retrieve tasks from the list",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "status": {"type": "string", "enum": ["all", "pending", "completed"], "description": "Filter by status (optional)"}
                    },
                    "required": ["user_id"]
                },
                "returns": {
                    "type": "object",
                    "properties": {
                        "tasks": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "integer"},
                                    "title": {"type": "string"},
                                    "description": {"type": "string"},
                                    "completed": {"type": "boolean"},
                                    "created_at": {"type": "string"},
                                    "updated_at": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            },
            "complete_task": {
                "description": "Mark a task as complete",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to complete"}
                    },
                    "required": ["user_id", "task_id"]
                },
                "returns": {
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "integer", "description": "ID of completed task"},
                        "status": {"type": "string", "description": "Status of operation"},
                        "title": {"type": "string", "description": "Title of completed task"}
                    }
                }
            },
            "delete_task": {
                "description": "Remove a task from the list",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to delete"}
                    },
                    "required": ["user_id", "task_id"]
                },
                "returns": {
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "integer", "description": "ID of deleted task"},
                        "status": {"type": "string", "description": "Status of operation"},
                        "title": {"type": "string", "description": "Title of deleted task"}
                    }
                }
            },
            "update_task": {
                "description": "Modify task title or description",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "User ID"},
                        "task_id": {"type": "integer", "description": "Task ID to update"},
                        "title": {"type": "string", "description": "New title (optional)"},
                        "description": {"type": "string", "description": "New description (optional)"}
                    },
                    "required": ["user_id", "task_id"]
                },
                "returns": {
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "integer", "description": "ID of updated task"},
                        "status": {"type": "string", "description": "Status of operation"},
                        "title": {"type": "string", "description": "Title of updated task"}
                    }
                }
            }
        }


# Global MCP server instance
mcp_server = MCPServer()


if __name__ == "__main__":
    # This would be the entry point for the MCP server when run directly
    # For now, we'll just keep it running to simulate the MCP server
    import time
    print("MCP Server for Todo Tools is running...")
    try:
        # In a real implementation, this would connect to the MCP protocol
        # and handle tool requests from AI agents
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nMCP Server shutting down...")