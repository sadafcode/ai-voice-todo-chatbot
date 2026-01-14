"""
Reusable skill for implementing AI Chatbot backend using FastAPI and OpenAI MCP

This skill provides standardized components and patterns for building
the AI-powered todo chatbot backend that handles natural language
interactions and MCP server functionality.
"""

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import asyncio
import json
from datetime import datetime
import os
from sqlmodel import SQLModel, Field, create_engine, Session, select
from contextlib import asynccontextmanager
from agents_mcp import Agent, Runner, RunnerContext
import better_auth


# ========================
# Database Models
# ========================
class Conversation(SQLModel, table=True):
    """Database model for storing conversation history"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    """Database model for storing individual messages"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    conversation_id: int = Field(foreign_key="conversation.id")
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ========================
# Request/Response Models
# ========================
class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    conversation_id: Optional[int] = None
    message: str
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    conversation_id: int
    response: str
    tool_calls: Optional[List[Dict[str, Any]]] = []


class MCPToolDefinition(BaseModel):
    """Model for MCP tool definitions"""
    name: str
    description: str
    input_schema: Dict[str, Any]


# ========================
# MCP Server Configuration
# ========================
class MCPConfig:
    """Configuration for MCP servers"""

    @staticmethod
    def get_default_config():
        """Returns default MCP server configuration"""
        return {
            "mcp": {
                "servers": {
                    "todo_tools": {
                        "command": "uvx",
                        "args": ["mcp-server-todo"]
                    }
                }
            }
        }

    @staticmethod
    def get_todo_mcp_config():
        """Returns MCP configuration specifically for todo tools"""
        return {
            "$schema": "https://raw.githubusercontent.com/lastmile-ai/mcp-agent/main/schema/mcp-agent.config.schema.json",
            "mcp": {
                "servers": {
                    "add_task": {
                        "command": "python",
                        "args": ["-m", "mcp_tools.add_task"]
                    },
                    "list_tasks": {
                        "command": "python",
                        "args": ["-m", "mcp_tools.list_tasks"]
                    },
                    "complete_task": {
                        "command": "python",
                        "args": ["-m", "mcp_tools.complete_task"]
                    },
                    "delete_task": {
                        "command": "python",
                        "args": ["-m", "mcp_tools.delete_task"]
                    },
                    "update_task": {
                        "command": "python",
                        "args": ["-m", "mcp_tools.update_task"]
                    }
                }
            }
        }


# ========================
# AI Agent Configuration
# ========================
class AIChatbotAgent:
    """AI Agent for handling chatbot interactions"""

    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.agent = None
        self._initialize_agent()

    def _initialize_agent(self):
        """Initialize the OpenAI agent with MCP tools"""
        # Create agent with MCP servers
        self.agent = Agent(
            name="Todo Chatbot Assistant",
            instructions="""You are a helpful assistant that helps users manage their tasks through natural language.
            Use the available tools to add, list, update, complete, or delete tasks.
            Always maintain a friendly and helpful tone.
            If you're unsure about a user's request, ask for clarification.""",
            mcp_servers=["add_task", "list_tasks", "complete_task", "delete_task", "update_task"]
        )

    async def process_message(self, user_id: str, message: str, conversation_id: Optional[int] = None):
        """Process a user message and return AI response"""
        # Get or create conversation
        if conversation_id is None:
            conversation = Conversation(user_id=user_id)
            self.db_session.add(conversation)
            self.db_session.commit()
            self.db_session.refresh(conversation)
            conversation_id = conversation.id
        else:
            conversation = self.db_session.get(Conversation, conversation_id)
            if not conversation or conversation.user_id != user_id:
                raise HTTPException(status_code=403, detail="Access denied")

        # Store user message
        user_message = Message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="user",
            content=message
        )
        self.db_session.add(user_message)
        self.db_session.commit()

        # Get conversation history for context
        history = self._get_conversation_history(conversation_id)

        # Run agent with context
        context = RunnerContext()
        result = await Runner.run(
            self.agent,
            input=message,
            context=context
        )

        # Store assistant response
        assistant_message = Message(
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=result.response.value
        )
        self.db_session.add(assistant_message)
        self.db_session.commit()

        # Update conversation timestamp
        conversation.updated_at = datetime.utcnow()
        self.db_session.add(conversation)
        self.db_session.commit()

        return {
            "conversation_id": conversation_id,
            "response": result.response.value,
            "tool_calls": getattr(result, 'tool_calls', [])
        }

    def _get_conversation_history(self, conversation_id: int) -> List[Dict[str, str]]:
        """Retrieve conversation history for context"""
        messages = self.db_session.exec(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        ).all()

        return [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]


# ========================
# Main Backend Application
# ========================
class AIChatbotBackend:
    """Main backend application class for AI Chatbot"""

    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv("DATABASE_URL")
        self.engine = create_engine(self.database_url)
        self.app = self._create_app()
        self._setup_middleware()
        self._setup_routes()

    def _create_app(self) -> FastAPI:
        """Create FastAPI application instance"""
        # Use lifespan to handle startup/shutdown
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            # Startup
            SQLModel.metadata.create_all(self.engine)
            yield
            # Shutdown
            # Add any cleanup code here

        app = FastAPI(lifespan=lifespan)
        return app

    def _setup_middleware(self):
        """Setup application middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure based on your needs
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _setup_routes(self):
        """Setup application routes"""

        @self.app.post("/api/chat", response_model=ChatResponse)
        async def chat_endpoint(request: ChatRequest):
            """Main chat endpoint for AI interactions"""
            with Session(self.engine) as session:
                agent = AIChatbotAgent(session)
                result = await agent.process_message(
                    user_id=request.user_id or "default_user",
                    message=request.message,
                    conversation_id=request.conversation_id
                )
                return ChatResponse(**result)

        @self.app.get("/api/conversations/{user_id}")
        async def get_user_conversations(user_id: str):
            """Get all conversations for a user"""
            with Session(self.engine) as session:
                conversations = session.exec(
                    select(Conversation)
                    .where(Conversation.user_id == user_id)
                    .order_by(Conversation.updated_at.desc())
                ).all()
                return conversations

        @self.app.get("/api/conversations/{conversation_id}/messages")
        async def get_conversation_messages(conversation_id: int):
            """Get all messages in a conversation"""
            with Session(self.engine) as session:
                messages = session.exec(
                    select(Message)
                    .where(Message.conversation_id == conversation_id)
                    .order_by(Message.created_at)
                ).all()
                return messages

        @self.app.delete("/api/conversations/{conversation_id}")
        async def delete_conversation(conversation_id: int, user_id: str = Depends(self._get_current_user)):
            """Delete a conversation"""
            with Session(self.engine) as session:
                conversation = session.get(Conversation, conversation_id)
                if not conversation or conversation.user_id != user_id:
                    raise HTTPException(status_code=403, detail="Access denied")

                session.delete(conversation)
                session.commit()
                return {"message": "Conversation deleted successfully"}

    def _get_current_user(self, request: Request):
        """Get current user from authentication"""
        # This would integrate with Better Auth
        # For now, returning a placeholder
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        # In real implementation, validate token with Better Auth
        return "current_user_id"

    def get_app(self) -> FastAPI:
        """Return the FastAPI application instance"""
        return self.app

    def run(self, host: str = "0.0.0.0", port: int = 8000):
        """Run the application"""
        import uvicorn
        uvicorn.run(self.app, host=host, port=port)


# ========================
# MCP Tool Implementations
# ========================
class MCPTodoTools:
    """Implementation of MCP tools for todo operations"""

    def __init__(self, db_session: Session):
        self.db_session = db_session

    async def add_task(self, user_id: str, title: str, description: Optional[str] = None):
        """MCP tool to add a new task"""
        # This would interface with the existing task system
        # For now, returning a mock response
        return {
            "task_id": 123,
            "status": "created",
            "title": title
        }

    async def list_tasks(self, user_id: str, status: Optional[str] = "all"):
        """MCP tool to list tasks"""
        # This would interface with the existing task system
        # For now, returning a mock response
        return [
            {"id": 1, "title": "Sample task", "completed": False},
            {"id": 2, "title": "Another task", "completed": True}
        ]

    async def complete_task(self, user_id: str, task_id: int):
        """MCP tool to mark a task as complete"""
        # This would interface with the existing task system
        # For now, returning a mock response
        return {
            "task_id": task_id,
            "status": "completed",
            "title": f"Task {task_id}"
        }

    async def delete_task(self, user_id: str, task_id: int):
        """MCP tool to delete a task"""
        # This would interface with the existing task system
        # For now, returning a mock response
        return {
            "task_id": task_id,
            "status": "deleted",
            "title": f"Task {task_id}"
        }

    async def update_task(self, user_id: str, task_id: int, title: Optional[str] = None, description: Optional[str] = None):
        """MCP tool to update a task"""
        # This would interface with the existing task system
        # For now, returning a mock response
        return {
            "task_id": task_id,
            "status": "updated",
            "title": title or f"Task {task_id}"
        }


# ========================
# Example Usage
# ========================
def create_chatbot_backend(database_url: str = None) -> AIChatbotBackend:
    """Factory function to create AI Chatbot Backend instance"""
    return AIChatbotBackend(database_url=database_url)


# Example of how to use this skill:
if __name__ == "__main__":
    # Create and run the backend
    backend = AIChatbotBackend()
    backend.run(host="0.0.0.0", port=8000)