# Phase 3: AI-Powered Todo Chatbot (Spec-Driven Development)

A modern, full-stack AI-powered task management application built with Next.js 14, FastAPI, and OpenAI Agents SDK using spec-driven development methodology.

## 🏗️ Spec-Driven Development Approach

This project follows the Spec-Driven Development (SDD) methodology:
- **Specifications-first**: All features are specified before implementation
- **Reusable Skills**: Modular, reusable components and functions
- **Constitution-Governed**: Project principles documented in specs/constitution.md
- **AI-Assisted Development**: Leveraging Claude AI for development with .claude configuration

## 🚀 Features

### Phase 3 - AI-Powered Chatbot Interface ✅

- **Natural Language Task Management**: Users can manage tasks using conversational language
- **Multi-language Support**: Full support for English and Urdu languages
- **Voice Commands**: Voice input functionality for todo commands
- **MCP Server Integration**: Model Context Protocol for standardized AI tool interactions
- **OpenAI Agents SDK**: Advanced AI processing with MCP tool integration
- **Stateless Chat Architecture**: Database-persisted conversation state with scalable design
- **Calm Productivity Theme**: Modern UI with dark mode support
- **Seamless Integration**: Maintains all Phase II features with enhanced AI capabilities

### Phase 2 - Enhanced Auth Flow & UI Improvements ✅

- **Beautiful Landing Page**: Welcoming homepage with clear navigation to signup/login
- **Auto-Login After Signup**: Users are automatically logged in after successful registration
- **Smart Redirects**: Authenticated users are automatically redirected to tasks from auth pages
- **Enhanced Error Messages**: Clear, actionable error feedback from the backend
- **Improved UI Readability**: Dark text inputs with helpful placeholders
- **Seamless User Experience**: Intuitive flow from landing → signup → tasks

### Core Features (Phase 1)

- **User Authentication**: Secure JWT-based auth with bcrypt password hashing
- **Task Management**: Full CRUD operations for tasks
- **Task Filtering**: Filter by status (all, pending, completed)
- **Task Sorting**: Sort by creation date, title, or update date
- **User Data Isolation**: Users only see their own tasks
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Calm Productivity theme
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom error handling
- **Voice Integration**: Web Speech API
- **Multi-language**: Urdu/English support

### Backend
- **Framework**: FastAPI
- **ORM**: SQLModel
- **Database**: PostgreSQL (Neon)
- **Authentication**: Better Auth with JWT tokens
- **Password Hashing**: bcrypt
- **AI Integration**: OpenAI Agents SDK
- **MCP Protocol**: Model Context Protocol for tool integration
- **Natural Language Processing**: MCP tools for task operations

## 📁 Project Structure

```
phase3-ai-chatbot/
├── frontend/
│   ├── app/                       # Next.js pages
│   │   ├── chat/                  # AI Chatbot interface
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Signup page
│   │   └── layout.tsx             # Root layout
│   ├── components/                # Reusable components
│   │   └── ChatBot.tsx            # AI Chatbot component
│   ├── context/                   # React Context
│   │   └── AuthContext.tsx        # Auth state management
│   └── lib/                       # Utilities
│       └── api.ts                 # API client
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── models.py                  # Database models
│   ├── db.py                      # Database connection
│   ├── auth.py                    # JWT verification
│   ├── mcp_server/                # Model Context Protocol server
│   │   ├── server.py              # MCP protocol implementation
│   │   ├── tools.py               # MCP task operation tools
│   │   └── mcp_agent.config.yaml  # MCP agent configuration
│   └── routes/
│       ├── auth.py                # Auth endpoints
│       ├── tasks.py               # Task endpoints
│       └── chat.py                # AI Chatbot endpoints
├── specs/                         # Project specifications (Spec-Driven Development)
│   ├── constitution.md            # Project constitution and principles
│   ├── overview.md                # Project overview
│   ├── features/                  # Feature specifications
│   ├── api/                       # API specifications
│   ├── database/                  # Database schema specifications
│   ├── task-crud/                 # Task CRUD implementation specs
│   └── ai-chatbot/                # AI Chatbot specifications
│       ├── spec.md                # AI Chatbot feature specification
│       ├── plan.md                # AI Chatbot implementation plan
│       └── tasks.md               # AI Chatbot development tasks
├── .claude/                       # Claude AI configuration and reusable skills
│   ├── commands/                  # Custom Claude commands
│   └── skills/                    # Reusable skills and components
└── README.md                      # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL database (or use Neon)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

Backend runs on: **http://localhost:8000**

### Frontend Setup

```bash
# Navigate to frontend
cd frontend/temp_next_app

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=your_postgresql_connection_string
BETTER_AUTH_SECRET=your_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here  # For AI chatbot functionality
```

## 📝 API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login with credentials
- `GET /auth/me` - Get current user info

### Tasks (Authenticated)
- `GET /api/{user_id}/tasks` - List all tasks (with filters)
- `POST /api/{user_id}/tasks` - Create new task
- `GET /api/{user_id}/tasks/{id}` - Get specific task
- `PUT /api/{user_id}/tasks/{id}` - Update task
- `DELETE /api/{user_id}/tasks/{id}` - Delete task
- `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle completion

### AI Chatbot (Authenticated)
- `POST /api/{user_id}/chat` - Chat with AI assistant using natural language
- Supports multi-language (English/Urdu) processing
- Handles voice command processing
- MCP tool integration for task operations

## 🎯 User Flow

1. **New User**:
   - Lands on homepage
   - Clicks "Get Started"
   - Signs up with email/password (min 8 chars)
   - Automatically logged in
   - Redirected to tasks dashboard or AI chatbot

2. **Returning User**:
   - Lands on homepage
   - Clicks "Sign In"
   - Logs in with credentials
   - Redirected to tasks dashboard or AI chatbot

3. **Authenticated User**:
   - Visiting `/`, `/login`, or `/signup` automatically redirects to `/tasks`
   - Can access `/chat` for AI-powered task management
   - Interact with chatbot using natural language, voice commands, or text

4. **AI Chatbot Interaction**:
   - Navigate to `/chat` to access the AI assistant
   - Use natural language to manage tasks (e.g., "Add a task to buy groceries")
   - Switch between English and Urdu languages
   - Use voice commands for hands-free task management

## 🔒 Security Features

- Better Auth-based authentication with JWT tokens
- Bcrypt password hashing (cost factor 12)
- User data isolation at API level
- CORS protection
- Input validation (frontend + backend)

## ✨ Phase 3 Highlights

### Before Phase 3
- ❌ Limited to manual task entry via forms
- ❌ English-only interface
- ❌ No voice command support
- ❌ Basic text-based interaction

### After Phase 3
- ✅ Natural language task management with AI assistance
- ✅ Multi-language support (English/Urdu)
- ✅ Voice command functionality for hands-free task management
- ✅ MCP protocol integration for standardized AI tool interactions
- ✅ Calm Productivity visual theme with dark mode
- ✅ Enhanced conversational experience
- ✅ Intelligent task processing via OpenAI integration
- ✅ MCP tools for reliable task operations

## 🧪 Testing

Create a test user:
```
Email: test@example.com
Password: password123
Name: Test User
```

## 📄 License

MIT License

## 👨‍💻 Developer

Built with ❤️ for Phase 3: AI-Powered Todo Chatbot

---

**Note**: This is a full-stack AI-powered application demonstrating modern web technologies with natural language processing.
