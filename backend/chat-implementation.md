# AI Chatbot Implementation Documentation

## Overview

This document describes the implementation of the AI-powered todo chatbot that allows users to manage their tasks through natural language interactions using MCP (Model Context Protocol) server architecture.

## Architecture

### Backend Components

1. **Chat Endpoint** (`routes/chat.py`):
   - Implements `/api/{user_id}/chat` endpoint
   - Stateless design with database-persisted conversation state
   - Integrates with OpenAI Agents SDK and MCP tools
   - Handles conversation history management

2. **AI Chatbot Agent** (`routes/chat.py`):
   - Encapsulated agent class following reusable skill pattern
   - Handles natural language processing
   - Manages conversation context
   - Falls back to rule-based processing when OpenAI Agents unavailable

3. **MCP Server** (`mcp-server/`):
   - Implements MCP protocol for tool communication
   - Provides 5 core task operation tools (add, list, complete, delete, update)
   - Follows MCP specification for tool discovery and execution

4. **Database Models** (`models.py`):
   - `Conversation` model for storing conversation metadata
   - `Message` model for storing individual messages
   - Integration with existing `User` and `Task` models

### Frontend Components

1. **ChatBot Component** (`src/app/components/ChatBot.tsx`):
   - Interactive chat interface
   - Real-time messaging with loading states
   - Conversation history management
   - Natural language command examples

2. **Chat Page** (`src/app/chat/page.tsx`):
   - Protected route requiring authentication
   - Integration with auth context
   - Conversation management

## API Endpoints

### Chat Endpoint
- **URL**: `POST /api/{user_id}/chat`
- **Headers**:
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "conversation_id": 123, // optional, creates new if not provided
    "message": "Add a task to buy groceries"
  }
  ```
- **Response**:
  ```json
  {
    "conversation_id": 123,
    "response": "Task 'buy groceries' has been created for you.",
    "tool_calls": [
      {
        "tool_name": "add_task",
        "parameters": {
          "user_id": "user123",
          "title": "buy groceries"
        }
      }
    ]
  }
  ```

### Conversation Endpoints
- `GET /api/conversations/{user_id}` - Get user conversations
- `GET /api/conversations/{conversation_id}/messages` - Get conversation messages
- `DELETE /api/conversations/{conversation_id}` - Delete conversation

## MCP Tools

### add_task
- **Purpose**: Create a new task
- **Parameters**: `{user_id: string, title: string, description?: string}`
- **Returns**: `{task_id: integer, status: string, title: string}`

### list_tasks
- **Purpose**: Retrieve tasks from the list
- **Parameters**: `{user_id: string, status?: "all"|"pending"|"completed"}`
- **Returns**: Array of task objects

### complete_task
- **Purpose**: Mark a task as complete
- **Parameters**: `{user_id: string, task_id: integer}`
- **Returns**: `{task_id: integer, status: string, title: string}`

### delete_task
- **Purpose**: Remove a task from the list
- **Parameters**: `{user_id: string, task_id: integer}`
- **Returns**: `{task_id: integer, status: string, title: string}`

### update_task
- **Purpose**: Modify task title or description
- **Parameters**: `{user_id: string, task_id: integer, title?: string, description?: string}`
- **Returns**: `{task_id: integer, status: string, title: string}`

## Natural Language Commands

The chatbot understands various natural language commands:

### Adding Tasks
- "Add a task to buy groceries"
- "Create a new task for meeting with John"
- "Remember to call mom tomorrow"

### Listing Tasks
- "Show me my tasks"
- "What are my pending tasks?"
- "List all completed tasks"

### Completing Tasks
- "Complete task 1"
- "Mark the shopping task as done"
- "Finish task with ID 5"

### Deleting Tasks
- "Delete task 3"
- "Remove the meeting task"
- "Cancel task 2"

### Updating Tasks
- "Update task 1 to 'Buy groceries and fruits'"
- "Change the title of task 4"

## Implementation Patterns

### Reusable Skills Integration
The implementation follows the reusable skill pattern with:
- Standardized AIChatbotAgent class
- Consistent error handling
- Fallback mechanisms
- Modular design for easy maintenance

### Security Considerations
- All endpoints protected with JWT authentication
- User data isolation (users can only access their own data)
- Input validation for all API parameters
- Rate limiting considerations (to be implemented)

## Dependencies

### Backend
- `agents-mcp==0.1.0` - MCP protocol implementation
- `openai==1.55.0` - OpenAI API integration
- `fastapi==0.115.4` - Web framework
- `sqlmodel==0.0.22` - ORM
- `better-auth==0.0.1-beta.99` - Authentication

### Frontend
- React with TypeScript
- Next.js 14 with App Router
- Tailwind CSS for styling

## Configuration

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API key for AI processing
- `DATABASE_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Authentication secret
- `FRONTEND_URL` - Frontend URL for CORS configuration

### MCP Configuration
The `mcp_agent.config.yaml` file defines the MCP server configuration:
```yaml
$schema: "https://raw.githubusercontent.com/lastmile-ai/mcp-agent/main/schema/mcp-agent.config.schema.json"
mcp:
  servers:
    todo-tools:
      command: "python"
      args: ["-m", "mcp_server.server"]
```

## Running the Application

### Backend
1. Install dependencies: `pip install -r requirements.txt`
2. Set environment variables
3. Run the server: `uvicorn main:app --reload`

### Frontend
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`

## Testing

The implementation includes:
- Unit tests for MCP tools
- Integration tests for chat endpoints
- Frontend component tests
- End-to-end tests for the complete chat flow

## Troubleshooting

### Common Issues
1. **MCP Server Not Connecting**: Ensure the MCP server is running and properly configured
2. **Authentication Errors**: Verify JWT tokens are properly formatted and not expired
3. **Database Connection Issues**: Check DATABASE_URL configuration
4. **OpenAI API Errors**: Verify API key is valid and has sufficient quota

### Logging
- Backend logs available through FastAPI/Uvicorn
- Database query logs available in debug mode
- MCP server communication logs (when enabled)

## Future Enhancements

- Enhanced natural language understanding
- Rich message formatting support
- File attachment capabilities
- Multi-language support
- Advanced conversation context management
- Integration with calendar and scheduling tools