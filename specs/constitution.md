# Todo App Constitution - All Phases Evolution

## Purpose
A todo application that evolves through three distinct phases: from console app to full-stack web application to AI-powered conversational interface. The application enables users to manage tasks through multiple interaction paradigms while maintaining consistent core functionality.

## Current Phase
Phase III: AI-Powered Chatbot Interface

## Evolution Path
- **Phase I**: Console-based todo app with in-memory Python implementation
- **Phase II**: Full-stack web application with authentication and persistent storage
- **Phase III**: AI-powered chatbot interface using natural language processing and MCP tools

## Tech Stack Evolution

### Phase I Stack
- **Runtime**: Python 3.13+, UV package manager
- **Development**: Claude Code, Spec-Kit Plus
- **Architecture**: In-memory console application

### Phase II Stack
- **Frontend**: Next.js 16+ (App Router)
- **Backend**: Python FastAPI
- **ORM**: SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth
- **Development**: Claude Code, Spec-Kit Plus

### Phase III Stack
- **Frontend**: OpenAI ChatKit
- **Backend**: Python FastAPI
- **AI Framework**: OpenAI Agents SDK
- **MCP Server**: Official MCP SDK
- **ORM**: SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth
- **Development**: Claude Code, Spec-Kit Plus

## Core Architecture Principles

### 1. Evolutionary Design
- Each phase builds upon the previous phase's functionality
- Core task management features (Add, Delete, Update, View, Mark Complete) preserved across all phases
- API contracts and data models evolve but maintain backward compatibility where possible
- Code structure and patterns evolve to accommodate new paradigms

### 2. MCP-First Design (Phase III)
- All task operations exposed as MCP tools in Phase III
- AI agents interact with system through standardized tools
- MCP server maintains stateless architecture with database persistence
- MCP tools provide consistent interface across all task operations

### 3. Natural Language Interface (Phase III)
- OpenAI Agents process user requests in natural language
- AI understands task creation, modification, and queries through conversation
- Conversational context maintained throughout interactions
- Natural language processing preserves core task functionality semantics

### 4. State Management
- Phase I: In-memory state management
- Phase II: Database-persisted state management
- Phase III: Stateless chat endpoint with database-persisted conversation state
- MCP tools are stateless with database persistence
- Conversation history maintained for context awareness

### 5. Security & Data Isolation
- User authentication maintained through Better Auth from Phase II onward
- User data isolation preserved (users only see their own tasks)
- AI operations respect user permissions and data boundaries
- Authentication and authorization consistent across all phases

### 6. Scalability & Performance
- Phase I: Single-user console application
- Phase II: Multi-user web application with database scaling
- Phase III: MCP server architecture enables horizontal scaling
- Stateless design for improved performance
- Database persistence for state management

### 7. Agentic Development
- All phases follow Agentic Dev Stack workflow: Write spec → Generate plan → Break into tasks → Implement via Claude Code
- No manual coding - all implementation through Claude Code and Spec-Kit Plus
- Spec-driven development throughout all phases
- Consistent development methodology across evolution

## Features Matrix

### Core Task Operations (All Phases)
- [x] Add tasks with title and description
- [x] List all tasks with status indicators
- [x] Update task details
- [x] Delete tasks by ID
- [x] Mark tasks as complete/incomplete

### Phase II Additions
- [x] Multi-user support with authentication
- [x] Persistent storage in PostgreSQL
- [x] Responsive web interface
- [x] RESTful API endpoints
- [x] User data isolation

### Phase III Additions
- [ ] Natural language task management
- [ ] MCP tools for task operations
- [ ] OpenAI Agents integration
- [ ] Conversational interface
- [ ] Context-aware responses
- [ ] Stateless chat with persistent state

## Integration Requirements

### Phase I → Phase II Transition
- Console functionality preserved in web interface
- In-memory operations migrated to database operations
- User authentication layer added
- Data model compatibility maintained

### Phase II → Phase III Transition
- Existing backend (FastAPI) hosts MCP server
- Existing database (PostgreSQL) stores conversation state
- Existing auth system secures AI interactions
- Frontend integrates OpenAI ChatKit for conversational UI
- API endpoints adapted for MCP tool usage

### Cross-Phase Consistency
- Task data model remains consistent across phases
- Authentication and authorization patterns maintained
- Error handling and validation preserved
- User experience principles carried forward

## Development Methodology
- **Spec-Driven Development**: All phases use Claude Code and Spec-Kit Plus
- **Agentic Workflow**: Write spec → Generate plan → Break into tasks → Implement via Claude Code
- **No Manual Coding**: All implementation through Claude Code agents
- **Iterative Evolution**: Each phase builds upon previous phase's foundation
- **Quality Assurance**: Process, prompts, and iterations reviewed for each phase
- **Reusable Skills**: Standardized components and patterns stored in .claude/skills for consistent implementation

## Reusable Skills
- **AI Chatbot Frontend**: Standardized component for OpenAI ChatKit integration located at .claude/skills/ai-chatbot-frontend.ts
- **Usage**: Import and use the TodoChatBot component or initVanillaChatBot function for consistent AI chatbot frontend implementation
- **Documentation**: See .claude/skills/README.md for complete usage instructions

- **AI Chatbot Backend**: Standardized backend with MCP server integration located at .claude/skills/ai-chatbot-backend.py
- **Usage**: Import and use the AIChatbotBackend class or create_chatbot_backend factory function for consistent AI chatbot backend implementation
- **Dependencies**: See .claude/skills/requirements.txt and .claude/skills/package.json for compatible versions