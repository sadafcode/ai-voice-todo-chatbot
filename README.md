# Phase III: Todo AI Chatbot with MCP Integration

AI-powered chatbot interface for managing todos through natural language using MCP (Model Context Protocol) server architecture.

---

## 🎯 Project Evolution

### Phase I - Core Features
- User Authentication (JWT + bcrypt)
- Task CRUD operations
- Task filtering & sorting
- User data isolation

### Phase II - Enhanced UX
- Landing page with navigation
- Auto-login after signup
- Smart redirects
- Improved error messages

### Phase III - AI Chatbot (Current)
- Natural language task management
- OpenAI Agents SDK integration
- MCP Server with 5 tools
- Bilingual support (English + Urdu)
- Voice commands (Web Speech API)
- Stateless chat architecture

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | OpenAI ChatKit |
| Backend | Python FastAPI |
| AI Framework | OpenAI Agents SDK |
| MCP Server | Official MCP SDK |
| ORM | SQLModel |
| Database | Neon Serverless PostgreSQL |
| Authentication | Better Auth |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────────┐     ┌─────────────────┐
│                 │     │              FastAPI Server                   │     │                 │
│                 │     │  ┌────────────────────────────────────────┐  │     │                 │
│  ChatKit UI     │────▶│  │         Chat Endpoint                  │  │     │    Neon DB      │
│  (Frontend)     │     │  │  POST /api/{user_id}/chat              │  │     │  (PostgreSQL)   │
│                 │     │  └───────────────┬────────────────────────┘  │     │                 │
│                 │     │                  │                           │     │  - tasks        │
│                 │     │                  ▼                           │     │  - conversations│
│                 │     │  ┌────────────────────────────────────────┐  │     │  - messages     │
│                 │◀────│  │      OpenAI Agents SDK                 │  │     │                 │
│                 │     │  │      (Agent + Runner)                  │  │     │                 │
│                 │     │  └───────────────┬────────────────────────┘  │     │                 │
│                 │     │                  │                           │     │                 │
│                 │     │                  ▼                           │     │                 │
│                 │     │  ┌────────────────────────────────────────┐  │────▶│                 │
│                 │     │  │         MCP Server (Port 8001)         │  │     │                 │
│                 │     │  │  (MCP Tools for Task Operations)       │  │◀────│                 │
│                 │     │  └────────────────────────────────────────┘  │     │                 │
└─────────────────┘     └──────────────────────────────────────────────┘     └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL (Neon recommended)
- OpenAI API key

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file:
DATABASE_URL=<your_neon_postgres_url>
OPENAI_API_KEY=<your_openai_key>
BETTER_AUTH_SECRET=<any_secret_key>

# Start backend (auto-starts MCP server on 8001)
uvicorn main:app --reload
```

**Servers Started:**
- ✅ FastAPI Backend: http://localhost:8000
- ✅ MCP Server: http://localhost:8001 (auto-started)

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000

# Start frontend
npm run dev
```

**Frontend:** http://localhost:3000

### 3. Port Configuration
```
Frontend:     Port 3000  (Next.js)
Backend API:  Port 8000  (FastAPI)
MCP Server:   Port 8001  (HTTP-based MCP tools)
```

---

## 🔧 MCP Tools (5 Tools)

| Tool | Purpose | Parameters |
|------|---------|------------|
| `add_task` | Create new task | user_id, title, description? |
| `list_tasks` | Get tasks | user_id, status? |
| `complete_task` | Mark complete | user_id, task_id |
| `delete_task` | Remove task | user_id, task_id |
| `update_task` | Modify task | user_id, task_id, title?, description? |

---

## 💬 Natural Language Commands

| User Says | Agent Action |
|-----------|--------------|
| "Add a task to buy groceries" | `add_task` |
| "Show me all my tasks" | `list_tasks` |
| "Mark task 3 as complete" | `complete_task` |
| "Delete the meeting task" | `list_tasks` → `delete_task` |
| "Change task 1 to 'Call mom'" | `update_task` |

### Urdu Commands (اردو)
```
"میرے کام دکھائیں" → list_tasks
"گروسری کا کام شامل کریں" → add_task
"کام نمبر 1 مکمل کریں" → complete_task
```

---

## 📝 API Endpoints

### Authentication (Better Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login (JWT) |
| GET | `/auth/me` | Current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List tasks |
| POST | `/api/{user_id}/tasks` | Create task |
| PUT | `/api/{user_id}/tasks/{id}` | Update task |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle complete |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/{user_id}/chat` | AI chat message |

---

## 📊 Database Models

| Model | Fields |
|-------|--------|
| Task | user_id, id, title, description, completed, created_at, updated_at |
| Conversation | user_id, id, created_at, updated_at |
| Message | user_id, id, conversation_id, role, content, created_at |

---

## 🧪 Testing

### Test User
```
Email: test@example.com
Password: password123
Name: Test User
```

### Health Checks
```bash
curl http://localhost:8000/
curl http://localhost:8001/health
curl http://localhost:8001/mcp/tools
```

---

## 🔑 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host/db
OPENAI_API_KEY=sk-proj-...
BETTER_AUTH_SECRET=random_secret_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🎯 Key Features

- ✅ AI-powered task management via natural language
- ✅ OpenAI Agents SDK with MCP tools
- ✅ Stateless architecture (scalable)
- ✅ Bilingual support (English + Urdu)
- ✅ Voice commands (Web Speech API)
- ✅ Database-persisted conversations
- ✅ Better Auth with JWT tokens

---

## 📄 License

MIT License

---

**Full-stack AI-powered Todo Application** with Natural Language Processing

Built with FastAPI, OpenAI Agents SDK, MCP Protocol, and Next.js
