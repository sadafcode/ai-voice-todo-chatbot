# Phase III: AI-Powered Todo Chatbot Specification

## Overview
This specification defines the AI-powered todo chatbot that will allow users to manage their tasks through natural language interactions using MCP (Model Context Protocol) server architecture.

## Objective
Create an AI-powered chatbot interface for managing todos through natural language using MCP (Model Context Protocol) server architecture and using Claude Code and Spec-Kit Plus.

## Requirements

### Functional Requirements

#### 1. Conversational Interface for Basic Level Features
- **Requirement**: Implement conversational interface for all 5 Basic Level features (Add, Delete, Update, View, Mark Complete)
- **Acceptance Criteria**:
  - User can add tasks via natural language: "Add a task to buy groceries tomorrow"
  - User can delete tasks via natural language: "Remove my meeting with John"
  - User can update tasks via natural language: "Change the deadline of the report to Friday"
  - User can view tasks via natural language: "Show me all pending tasks"
  - User can mark tasks complete/incomplete via natural language: "Mark the shopping task as completed"

#### 2. OpenAI Agents SDK Integration
- **Requirement**: Use OpenAI Agents SDK for AI logic and natural language processing
- **Acceptance Criteria**:
  - AI agent correctly interprets user intents from natural language
  - AI agent can handle various phrasing styles for the same intent
  - AI agent maintains conversation context across multiple turns
  - AI agent provides helpful responses when it doesn't understand

#### 3. MCP Server with Official MCP SDK
- **Requirement**: Build MCP server with Official MCP SDK that exposes task operations as tools
- **Acceptance Criteria**:
  - MCP server exposes all 5 task operations as MCP tools
  - Tools follow MCP protocol specifications
  - Tools integrate with existing backend infrastructure
  - Tools maintain security and authentication

#### 4. Stateless Chat Endpoint
- **Requirement**: Implement stateless chat endpoint that persists conversation state to database
- **Acceptance Criteria**:
  - Chat endpoint is stateless (no server-side session storage)
  - Conversation state stored in Neon PostgreSQL database
  - Conversation history maintained per user
  - Endpoint can be horizontally scaled

#### 5. MCP Tools with Database State Storage
- **Requirement**: AI agents use MCP tools to manage tasks, with tools storing state in database
- **Acceptance Criteria**:
  - MCP tools are stateless but use database for persistence
  - Tools maintain user data isolation
  - Tools integrate with existing authentication system
  - Tools perform the same operations as existing API endpoints

### Non-Functional Requirements

#### 1. Performance
- Response time under 2 seconds for AI processing
- Support for concurrent users
- Efficient database queries for conversation history

#### 2. Security
- Maintain user authentication and data isolation
- Secure AI API key management
- Input sanitization for natural language processing
- Rate limiting for AI API calls

#### 3. Reliability
- Graceful error handling for AI service failures
- Fallback responses when AI doesn't understand
- Database transaction integrity for task operations

#### 4. Scalability
- Stateless architecture for horizontal scaling
- Efficient database indexing for conversation queries
- Connection pooling for database operations

## Technical Architecture

### Frontend: OpenAI ChatKit
- Chat interface for natural language interaction
- Real-time messaging capabilities
- User authentication integration
- Responsive design for multiple devices

### Backend: Python FastAPI
- MCP server implementation
- Chat endpoint with conversation state management
- Integration with existing authentication
- Database connection management

### AI Framework: OpenAI Agents SDK
- Natural language intent recognition
- Conversation context management
- Tool calling for task operations
- Response generation

### MCP Server: Official MCP SDK
- MCP tool definitions for task operations
- Protocol compliance
- Tool discovery and registration
- Security integration

### ORM: SQLModel
- Database models for conversations
- Task model integration
- User model integration
- Relationship management

### Database: Neon Serverless PostgreSQL
- Task data storage (inherited from Phase II)
- Conversation history storage
- Message storage
- User data isolation

### Authentication: Better Auth
- User session management
- API endpoint protection
- MCP tool access control
- Conversation ownership

## Implementation Approach

### 1. MCP Tool Development
- Define MCP tools for each task operation (Add, Delete, Update, View, Mark Complete)
- Implement tools to interact with existing database models
- Ensure tools follow MCP protocol specifications
- Integrate tools with authentication system

### 2. AI Agent Configuration
- Configure OpenAI Agent with MCP tools
- Define system prompt for todo management
- Set up conversation context management
- Implement error handling and fallbacks

### 3. Chat Endpoint Development
- Create stateless chat endpoint
- Implement conversation state persistence
- Integrate with AI agent
- Add authentication middleware

### 4. Frontend Integration
- Implement OpenAI ChatKit interface
- Connect to chat endpoint
- Handle authentication
- Display conversation history

## Data Models

### Task Model (inherited from Phase II)
- user_id (foreign key to users)
- id (primary key)
- title
- description
- completed
- created_at
- updated_at

### Conversation Model
- user_id (foreign key to users)
- id (primary key)
- created_at
- updated_at

### Message Model
- user_id (foreign key to users)
- id (primary key)
- conversation_id (foreign key to conversations)
- role (user/assistant)
- content
- created_at

## API Endpoints

### Chat Endpoint
- `POST /api/{user_id}/chat` - Process user message and return AI response
- Request: {conversation_id?: integer, message: string}
- Response: {conversation_id: integer, response: string, tool_calls?: array}

Request Fields:
- conversation_id: Existing conversation ID (creates new if not provided)
- message: User's natural language message (required)

Response Fields:
- conversation_id: The conversation ID
- response: AI assistant's response
- tool_calls: List of MCP tools invoked

### MCP Server Endpoints
- MCP protocol endpoints for tool communication
- Tool discovery and registration endpoints
- Authentication-protected tool access

#### MCP Tool Specifications

Tool: add_task
- Purpose: Create a new task
- Parameters: {user_id: string, title: string, description?: string}
- Returns: {task_id: integer, status: string, title: string}
- Example Input: {"user_id": "ziakhan", "title": "Buy groceries", "description": "Milk, eggs, bread"}
- Example Output: {"task_id": 5, "status": "created", "title": "Buy groceries"}

Tool: list_tasks
- Purpose: Retrieve tasks from the list
- Parameters: {user_id: string, status?: "all"|"pending"|"completed"}
- Returns: Array of task objects
- Example Input: {"user_id": "ziakhan", "status": "pending"}
- Example Output: [{"id": 1, "title": "Buy groceries", "completed": false}, ...]

Tool: complete_task
- Purpose: Mark a task as complete
- Parameters: {user_id: string, task_id: integer}
- Returns: {task_id: integer, status: string, title: string}
- Example Input: {"user_id": "ziakhan", "task_id": 3}
- Example Output: {"task_id": 3, "status": "completed", "title": "Call mom"}

Tool: delete_task
- Purpose: Remove a task from the list
- Parameters: {user_id: string, task_id: integer}
- Returns: {task_id: integer, status: string, title: string}
- Example Input: {"user_id": "ziakhan", "task_id": 2}
- Example Output: {"task_id": 2, "status": "deleted", "title": "Old task"}

Tool: update_task
- Purpose: Modify task title or description
- Parameters: {user_id: string, task_id: integer, title?: string, description?: string}
- Returns: {task_id: integer, status: string, title: string}
- Example Input: {"user_id": "ziakhan", "task_id": 1, "title": "Buy groceries and fruits"}
- Example Output: {"task_id": 1, "status": "updated", "title": "Buy groceries and fruits"}

## Security Considerations

### 1. Authentication
- All endpoints protected with Better Auth
- MCP tools respect user permissions
- Conversation history access limited to owner

### 2. Authorization
- Users can only access their own conversations
- MCP tools enforce user data isolation
- Task operations limited to user's tasks

### 3. AI Safety
- Input sanitization for natural language
- Rate limiting for AI API calls
- Content filtering for inappropriate requests

## Testing Strategy

### Unit Tests
- MCP tool functionality
- AI agent configuration
- Database operations
- Authentication integration

### Integration Tests
- End-to-end chat functionality
- MCP tool calling
- Conversation state management
- Authentication flow

### User Acceptance Tests
- Natural language command processing
- Task operation verification
- Conversation context maintenance
- Error handling scenarios

## Deployment Considerations

### Environment Variables
- OPENAI_API_KEY
- DATABASE_URL
- BETTER_AUTH_SECRET
- MCP_SERVER_CONFIG

### Infrastructure
- Neon PostgreSQL database
- FastAPI backend hosting
- Frontend hosting (Vercel/Netlify)
- OpenAI API access

## Success Metrics

### Functional
- 100% of basic task operations available through chat
- Natural language understanding accuracy >90%
- User authentication maintained across chat sessions

### Performance
- Average response time <2 seconds
- 99% uptime for chat endpoint
- Efficient database query performance

### User Experience
- Natural, conversational interaction
- Helpful error messages
- Consistent with existing UI functionality

## Clarifications

### Session 2026-01-05

- Q: What level of natural language understanding should the AI have for extracting task details? → A: Advanced NLU with complex date expressions and contextual priority extraction
- Q: How should the AI chatbot handle ambiguous or unclear user requests? → A: Ask for clarification to prevent errors and maintain user trust
- Q: How should the AI handle multiple matching tasks? → A: Show options and ask user to confirm which task they mean
- Q: Should the AI maintain conversation context? → A: Yes, with limited context for current session following stateless architecture
- Q: What authentication approach? → A: Same as existing (Better Auth/JWT tokens from Phase II)