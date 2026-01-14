# Phase III: AI-Powered Todo Chatbot Implementation Plan

## Overview
This plan outlines the implementation approach for the AI-powered todo chatbot that will allow users to manage their tasks through natural language interactions using MCP (Model Context Protocol) server architecture.

## Architecture Components

### 1. MCP Server Layer
- **Objective**: Implement MCP server with Official MCP SDK that exposes task operations as tools
- **Scope**:
  - Create MCP tool definitions for all 5 basic task operations
  - Implement MCP protocol compliance
  - Integrate with existing authentication system
- **Out of Scope**:
  - UI development
  - Database schema changes

### 2. AI Agent Layer
- **Objective**: Configure OpenAI Agents SDK for natural language processing
- **Scope**:
  - Set up agent with MCP tools
  - Define system prompt for todo management
  - Implement conversation context management
- **Out of Scope**:
  - Training custom models
  - External AI service development

### 3. Chat Endpoint Layer
- **Objective**: Create stateless chat endpoint with database-persisted conversation state
- **Scope**:
  - Implement chat API endpoint
  - Handle conversation state persistence
  - Integrate with AI agent
  - Add authentication middleware
- **Out of Scope**:
  - Frontend implementation
  - Complex business logic beyond chat handling

### 4. Frontend Integration
- **Objective**: Implement OpenAI ChatKit interface
- **Scope**:
  - Create chat UI components
  - Connect to chat endpoint
  - Handle authentication
  - Display conversation history
- **Out of Scope**:
  - Backend infrastructure
  - AI model training

## Key Decisions and Rationale

### 1. MCP-First Architecture Decision
- **Options Considered**:
  - Direct API calls from AI to backend
  - MCP tool-based architecture
  - Custom middleware layer
- **Trade-offs**:
  - MCP adds complexity but provides standardization
  - More maintainable long-term
  - Better tool discoverability
- **Rationale**: MCP provides standardized approach for AI tool integration and follows modern AI development patterns

### 2. Stateless Design Decision
- **Options Considered**:
  - Server-side session storage
  - Database-persisted state
  - Hybrid approach
- **Trade-offs**:
  - Database persistence adds latency but enables scalability
  - Stateless design supports horizontal scaling
  - Slight performance impact for faster scaling
- **Rationale**: Stateless design with database persistence provides optimal balance of scalability and functionality

### 3. OpenAI Agents SDK Decision
- **Options Considered**:
  - OpenAI Functions API
  - OpenAI Agents SDK
  - Custom NLP solution
- **Trade-offs**:
  - SDK provides higher-level abstractions
  - Less control over fine-grained behavior
  - Vendor lock-in considerations
- **Rationale**: OpenAI Agents SDK provides the most robust solution for conversation management and tool calling

## Interfaces and API Contracts

### 1. MCP Tool Contracts

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

### 2. Chat Endpoint Contract
```
POST /api/{user_id}/chat
- Input: {conversation_id?: integer, message: string}
- Output: {conversation_id: integer, response: string, tool_calls?: array}
- Headers: Authorization: Bearer <token>

Request Fields:
- conversation_id: Existing conversation ID (creates new if not provided)
- message: User's natural language message (required)

Response Fields:
- conversation_id: The conversation ID
- response: AI assistant's response
- tool_calls: List of MCP tools invoked
```

### 3. Natural Language Commands
The chatbot should understand and respond to:
- User Says: "Add a task to buy groceries" → Agent Should: Call add_task with title "Buy groceries"
- User Says: "Show me all my tasks" → Agent Should: Call list_tasks with status "all"
- User Says: "What's pending?" → Agent Should: Call list_tasks with status "pending"
- User Says: "Mark task 3 as complete" → Agent Should: Call complete_task with task_id 3
- User Says: "Delete the meeting task" → Agent Should: Call list_tasks first, then delete_task
- User Says: "Change task 1 to 'Call mom tonight'" → Agent Should: Call update_task with new title
- User Says: "I need to remember to pay bills" → Agent Should: Call add_task with title "Pay bills"
- User Says: "What have I completed?" → Agent Should: Call list_tasks with status "completed"

### 4. Agent Behavior Specification
- Task Creation: When user mentions adding/creating/remembering something, use add_task
- Task Listing: When user asks to see/show/list tasks, use list_tasks with appropriate filter
- Task Completion: When user says done/complete/finished, use complete_task
- Task Deletion: When user says delete/remove/cancel, use delete_task
- Task Update: When user says change/update/rename, use update_task
- Confirmation: Always confirm actions with friendly response
- Error Handling: Gracefully handle task not found and other errors

### 5. Conversation Flow (Stateless Request Cycle)
1. Receive user message
2. Fetch conversation history from database
3. Build message array for agent (history + new message)
4. Store user message in database
5. Run agent with MCP tools
6. Agent invokes appropriate MCP tool(s)
7. Store assistant response in database
8. Return response to client
9. Server holds NO state (ready for next request)

### 6. Error Taxonomy
- 400: Bad Request - Invalid input format
- 401: Unauthorized - Missing or invalid token
- 403: Forbidden - User lacks permission for operation
- 429: Too Many Requests - Rate limiting
- 500: Internal Server Error - System failure

## Non-Functional Requirements and Budgets

### Performance
- P95 response time: <2 seconds for AI processing
- Support for 100 concurrent users
- Database query time: <200ms for conversation history

### Reliability
- 99.9% uptime for chat endpoint
- 99.5% AI service availability
- Graceful degradation when AI service unavailable

### Security
- All endpoints protected with JWT authentication
- Input sanitization for natural language processing
- Rate limiting: 100 requests/hour per user for AI calls

### Cost
- OpenAI API costs: Budget $50/month for Phase 3 development
- Database costs: Included in existing Neon PostgreSQL plan

## Data Management and Migration

### Source of Truth
- Task data: Existing PostgreSQL database (inherited from Phase II)
- Conversation data: New conversations table
- Message data: New messages table

### Schema Evolution
- Add conversations table with user_id, created_at, updated_at
- Add messages table with conversation_id, role, content, timestamp
- Maintain existing task table structure

### Migration Strategy
- Create new tables without disrupting existing functionality
- No data migration needed from Phase II (new feature)
- Rollback plan: Remove new tables if needed

## Operational Readiness

### Observability
- Log all chat interactions with user_id and timestamp
- Monitor AI API call success/failure rates
- Track conversation length and user engagement

### Alerting
- AI service failure: Alert on >5% error rate
- Database connection issues: Alert immediately
- High latency: Alert on >5s response time

### Runbooks
- AI service outage handling
- Database performance degradation
- Authentication system failures

### Deployment Strategy
- Deploy MCP server and backend changes first
- Deploy frontend changes second
- Blue-green deployment for zero-downtime

## Risk Analysis and Mitigation

### 1. AI Service Dependency Risk
- **Risk**: OpenAI service outage affects functionality
- **Blast Radius**: All chatbot functionality unavailable
- **Mitigation**: Implement graceful fallback messages, cache responses when possible
- **Kill Switch**: Toggle to disable AI chat and show maintenance message

### 2. Data Privacy Risk
- **Risk**: Natural language processing may expose sensitive data
- **Blast Radius**: User data privacy breach
- **Mitigation**: Sanitize inputs, implement data retention policies
- **Guardrails**: Input/output filtering, audit logging

### 3. Performance Risk
- **Risk**: AI processing creates slow response times
- **Blast Radius**: Poor user experience
- **Mitigation**: Caching, async processing where appropriate
- **Guardrails**: Timeout handling, progressive loading

## Evaluation and Validation

### Definition of Done
- [ ] All 5 MCP tools implemented and tested
- [ ] Chat endpoint handles conversations statelessly
- [ ] Frontend integrates with OpenAI ChatKit
- [ ] Authentication works with existing system
- [ ] All Phase II functionality preserved
- [ ] Error handling implemented for all scenarios

### Output Validation
- Natural language commands successfully trigger appropriate task operations
- Conversation context maintained across multiple turns
- User authentication and data isolation preserved
- Performance targets met (response time <2s)

## Implementation Tasks Breakdown

### Phase 1: MCP Server Setup
1. Set up MCP server with Official MCP SDK
2. Define MCP tool interfaces for task operations
3. Implement tool authentication integration
4. Test MCP tools with mock AI agent

### Phase 2: AI Agent Configuration
1. Configure OpenAI Agents SDK
2. Register MCP tools with AI agent
3. Set up system prompt for todo management
4. Implement conversation context management

### Phase 3: Backend Integration
1. Create chat endpoint
2. Implement conversation state persistence
3. Add authentication middleware
4. Integrate with AI agent

### Phase 4: Frontend Implementation
1. Set up OpenAI ChatKit interface
2. Connect to chat endpoint
3. Handle authentication flow
4. Implement conversation history display

### Phase 5: Testing and Validation
1. End-to-end testing of chat functionality
2. Security and authentication validation
3. Performance testing
4. User acceptance testing

## Clarifications

### Session 2026-01-05

- Q: What level of natural language understanding should the AI have for extracting task details? → A: Advanced NLU with complex date expressions and contextual priority extraction
- Q: How should the AI chatbot handle ambiguous or unclear user requests? → A: Ask for clarification to prevent errors and maintain user trust
- Q: How should the AI handle multiple matching tasks? → A: Show options and ask user to confirm which task they mean
- Q: Should the AI maintain conversation context? → A: Yes, with limited context for current session following stateless architecture
- Q: What authentication approach? → A: Same as existing (Better Auth/JWT tokens from Phase II)