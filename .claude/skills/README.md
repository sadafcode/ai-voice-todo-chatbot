# Reusable Skills for AI Chatbot

This directory contains standardized components and patterns for implementing the AI-powered todo chatbot.

## Available Skills

### 1. AI Chatbot Frontend Skill

This skill provides standardized components for implementing the AI-powered todo chatbot frontend using OpenAI ChatKit.

#### Overview

This skill enables the creation of a conversational interface that allows users to manage their tasks through natural language interactions. It uses OpenAI ChatKit to provide a rich, interactive chat experience.

#### Components

- **TodoChatBot React Component**: A React component wrapper for OpenAI ChatKit
- **initVanillaChatBot Function**: Vanilla JavaScript implementation for non-React environments

#### Features

- **API Integration**: Configurable API endpoints for chat functionality
- **Authentication Support**: Built-in authentication handling
- **Theming**: Light and dark theme options
- **Responsive Design**: Adapts to different screen sizes
- **Reusable**: Standardized implementation across projects

#### Usage

##### In React Applications:

```tsx
import { TodoChatBot } from './skills/ai-chatbot-frontend';

const chatConfig = {
  apiEndpoint: 'http://localhost:8000/api/chat',
  domainKey: 'local-dev',
  theme: 'light',
  className: 'my-chatbot'
};

<TodoChatBot config={chatConfig} />
```

##### In Vanilla JavaScript:

```javascript
import { initVanillaChatBot } from './skills/ai-chatbot-frontend';

const chatConfig = {
  apiEndpoint: 'http://localhost:8000/api/chat',
  domainKey: 'local-dev'
};

initVanillaChatBot('chat-container', chatConfig);
```

##### Configuration Options

- `apiEndpoint`: URL for the chat API endpoint
- `domainKey`: Domain key for ChatKit authentication
- `theme`: Light or dark theme option
- `className`: Additional CSS classes for styling
- `userId`: Optional user identifier

##### API Endpoints

The skill expects the following API endpoints:
- `/api/chat` - Main chat endpoint
- `/api/conversations` - Conversation management
- `/api/messages` - Message history

##### Authentication

The skill includes built-in authentication support using the `setupChatBotAuth` function to handle user sessions and tokens.

---

### 2. AI Chatbot Backend Skill

This skill provides standardized components for implementing the AI-powered todo chatbot backend using FastAPI and OpenAI MCP.

#### Overview

This skill provides a complete backend solution with MCP server integration, OpenAI agent configuration, conversation management, and database persistence. It handles natural language processing and integrates with existing task management systems.

#### Components

- **AIChatbotBackend**: Main FastAPI application with all necessary routes
- **AIChatbotAgent**: AI agent with MCP tool integration
- **MCPTodoTools**: MCP tool implementations for task operations
- **Database Models**: Conversation and message storage models
- **MCP Configuration**: Standardized MCP server configuration

#### Features

- **MCP Server Integration**: Full support for Model Context Protocol tools
- **Conversation Management**: Persistent conversation history in database
- **OpenAI Agent**: Natural language processing with MCP tools
- **Database Persistence**: SQLModel-based storage for conversations
- **Authentication Ready**: Integration points for Better Auth
- **Scalable Architecture**: Stateless design with database persistence

#### Usage

```python
from ai_chatbot_backend import create_chatbot_backend

# Create backend instance
backend = create_chatbot_backend(database_url="postgresql://...")

# Get the FastAPI app
app = backend.get_app()

# Or run directly
if __name__ == "__main__":
    backend.run(host="0.0.0.0", port=8000)
```

##### Endpoints

- `POST /api/chat` - Main chat endpoint for AI interactions
- `GET /api/conversations/{user_id}` - Get user conversations
- `GET /api/conversations/{conversation_id}/messages` - Get conversation messages
- `DELETE /api/conversations/{conversation_id}` - Delete conversation

##### Configuration

- Database URL via environment variable or parameter
- MCP server configuration for tool integration
- Authentication integration with existing systems
- CORS settings for frontend integration

##### MCP Tools

The backend includes standardized MCP tools for all task operations:
- `add_task`: Create new tasks
- `list_tasks`: Retrieve task lists
- `complete_task`: Mark tasks as complete
- `delete_task`: Remove tasks
- `update_task`: Modify task details

---

## Dependencies

The skills include properly versioned dependencies to ensure compatibility:

### Backend Dependencies (requirements.txt)
- **FastAPI**: Latest stable version for API framework
- **SQLModel**: For database models and ORM operations
- **OpenAI**: For AI integration
- **agents-mcp**: For MCP server integration
- **Better Auth**: For authentication
- **Pydantic**: For data validation
- **And other supporting packages**

### Frontend Dependencies (package.json)
- **@openai/chatkit**: Core ChatKit library
- **@openai/chatkit-react**: React components for ChatKit
- **React 18+**: For React component support
- **TypeScript**: For type safety
- **Vite**: For development and build tools