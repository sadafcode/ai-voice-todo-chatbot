# Todo App - Hackathon II - AI Chatbot with MCP Integration

## 🎯 Project Overview
Full-stack todo app with **AI Chatbot** that uses **MCP (Model Context Protocol) tools** for task management.
**Bilingual support: English + Urdu (اردو)** with proper RTL rendering.
**Voice input capability** using Web Speech API for hands-free task management.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL database (Neon recommended)
- OpenAI API key

### 1. Backend Setup & Start
```bash
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Set environment variables in .env file:
# - DATABASE_URL=<your_neon_postgres_url>
# - OPENAI_API_KEY=<your_openai_key>
# - BETTER_AUTH_SECRET=<any_secret_key>

# Start backend (Port 8000)
uvicorn main:app --reload

# Backend starts TWO servers:
# ✅ FastAPI Backend: http://127.0.0.1:8000
# ✅ MCP Server: http://127.0.0.1:8001 (auto-started in background)
```

### 2. Frontend Setup & Start
```bash
cd frontend

# Install dependencies (first time only)
npm install

# Set environment variables in .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Start frontend (Port 3000)
npm run dev

# Frontend: http://localhost:3000
```

### 3. Access Points
- **Frontend**: http://localhost:3000
- **Chat Interface**: http://localhost:3000/chat
- **Backend API**: http://localhost:8000
- **MCP Server**: http://localhost:8001 (internal use)

---

## 🏗️ Architecture

### Port Configuration (CRITICAL - DO NOT CHANGE)
```
Frontend:     Port 3000  (Next.js)
Backend API:  Port 8000  (FastAPI)
MCP Server:   Port 8001  (HTTP-based MCP tools)
```

### Data Flow
```
User Browser (3000)
    ↓ HTTP
FastAPI Backend (8000)
    ↓ /api/{user_id}/chat
AI Agent (OpenAI Agents SDK)
    ↓ HTTP (function_tool wrapper)
MCP Server (8001)
    ↓ /mcp/tools, /mcp/call
MCP Tools (5 tools)
    ↓
Neon PostgreSQL Database
```

### Stateless Architecture
- ✅ Backend is STATELESS (no session storage)
- ✅ All conversation history stored in database
- ✅ Can restart servers without losing data
- ✅ Each request is independent

---

## 🔧 Key Components

### Backend Files (Most Important)
1. **main.py**
   - FastAPI app entry point
   - Starts MCP server in background thread on port 8001
   - Database initialization
   - CORS configuration

2. **routes/chat.py**
   - Chat endpoint: POST /api/{user_id}/chat
   - AI Agent with OpenAI Agents SDK
   - Bilingual support (English + Urdu)
   - MCP tools integration via HTTP wrapper
   - Natural language intent recognition

3. **mcp-server/http_server.py**
   - HTTP-based MCP server (Port 8001)
   - Endpoints: GET /mcp/tools, POST /mcp/call, GET /health
   - FastAPI app (separate from main backend)

4. **mcp-server/tools.py**
   - 5 MCP tools implementation:
     - add_task(user_id, title, description?)
     - list_tasks(user_id, status?)
     - complete_task(user_id, task_id)
     - delete_task(user_id, task_id)
     - update_task(user_id, task_id, title?, description?)

5. **mcp_client_wrapper.py**
   - HTTP client wrapper for MCP tools
   - Functions that call MCP server via HTTP
   - Used by AI agent (via function_tool)

6. **db.py**
   - Database connection with get_engine()
   - IMPORTANT: Use get_engine() NOT engine

7. **models.py**
   - Conversation, Message, Task, User models
   - SQLModel for ORM

### Frontend Files (Most Important)
1. **src/app/chat/page.tsx**
   - Chat UI with bilingual support
   - Language selector (English ↔ اردو)
   - RTL support for Urdu text
   - Auto-detect message direction
   - Real-time chat interface

2. **src/app/layout.tsx**
   - Noto_Nastaliq_Urdu font loading (Next.js optimized)
   - Font variable: --font-urdu
   - AuthProvider wrapper

3. **src/app/globals.css**
   - .font-urdu class for Urdu font
   - RTL support with [dir="rtl"]
   - Font rendering optimizations

4. **src/lib/api.ts**
   - API_BASE_URL: http://localhost:8000 (NOT 8001!)
   - authFetch helper
   - handleResponse helper

---

## 🌐 Bilingual Support (English + Urdu)

### Features
- ✅ Language toggle button in UI
- ✅ Automatic language detection in backend
- ✅ RTL (Right-to-Left) rendering for Urdu
- ✅ Noto Nastaliq Urdu font (Google Fonts via Next.js)
- ✅ Per-message direction detection
- ✅ Bilingual UI elements (titles, placeholders, buttons)
- ✅ Mixed language support in same conversation

### English Commands
```
"show my tasks"
"add a task to buy groceries"
"update dentist task to tomorrow urgent"
"mark task 1 as done"
"delete meeting task"
```

### Urdu Commands (اردو)
```
"میرے کام دکھائیں"
"گروسری خریدنے کا کام شامل کریں"
"ڈینٹسٹ کا کام کل کے لیے فوری بنائیں"
"کام نمبر 1 مکمل کریں"
"میٹنگ کا کام حذف کریں"
```

### How It Works
1. User selects language or AI auto-detects from message
2. AI Agent processes intent (language-agnostic)
3. MCP tools execute (work with any language)
4. Response generated in user's language
5. Frontend displays with correct direction (LTR/RTL)

---

## 🎤 Voice Commands Feature

### Overview
Voice input capability using **Web Speech API** for hands-free task management. Users can speak commands in **English or Urdu** with automatic language detection and real-time transcription.

### Browser Support
- ✅ **Chrome 25+**: Full support (English + Urdu)
- ✅ **Edge 79+**: Full support (English + Urdu)
- ✅ **Opera 27+**: Full support (English + Urdu)
- ⚠️ **Safari 14.1+**: Limited support (English only on mobile)
- ❌ **Firefox**: Not supported (feature automatically hidden)

### Key Features
- ✅ **Microphone button** next to Send button (only in supported browsers)
- ✅ **Real-time transcription preview** as you speak
- ✅ **Automatic language detection** using Unicode analysis (U+0600-U+06FF for Urdu)
- ✅ **Auto-send** after 300ms preview delay
- ✅ **Visual indicators**: Listening (pulsing red), Transcribing (blue)
- ✅ **Bilingual UI feedback**: "Listening..." / "سن رہا ہے..."
- ✅ **Error handling** with localized messages
- ✅ **Zero backend changes** (frontend-only feature)
- ✅ **Privacy-first**: Audio processed in browser only (never sent to our servers)

### Voice Commands Implementation Files

**New Files Created**:
1. **frontend/src/hooks/useVoiceRecognition.ts** (~200 lines)
   - Custom React hook for Web Speech API
   - Browser compatibility detection
   - Speech recognition lifecycle management
   - Event handlers (onstart, onresult, onerror, onend)
   - Language detection and state management

2. **frontend/src/types/speech.ts** (~50 lines)
   - TypeScript interfaces for Web Speech API
   - VoiceRecognitionConfig interface
   - UseVoiceRecognitionReturn interface
   - SpeechRecognitionErrorCode type

3. **frontend/src/utils/languageDetection.ts** (~80 lines)
   - containsUrdu() - Detect Urdu characters (U+0600-U+06FF)
   - detectLanguage() - Binary language detection (en/ur)
   - getLanguageCode() - Map to speech API codes (en-US, ur-PK)
   - getVoiceErrorMessage() - Localized error messages

**Modified Files**:
1. **frontend/src/app/chat/page.tsx** (voice UI integration)
   - Voice hook initialization
   - Microphone button with icon
   - Recording indicator with animation
   - Transcription preview display
   - Error message display with dismiss button
   - Auto-send functionality with 300ms delay

2. **frontend/src/app/globals.css** (animations)
   - @keyframes pulse animation for recording indicator

### How Voice Input Works

```
User clicks microphone button
    ↓
Browser requests microphone permission
    ↓
Recording starts (red pulsing indicator)
    ↓
User speaks: "show my tasks"
    ↓
Real-time transcription: "show" → "show my" → "show my tasks"
    ↓
Language detected (en or ur)
    ↓
UI language switches if needed
    ↓
Message auto-sent to existing chat endpoint after 300ms
    ↓
AI processes with MCP tools (identical to text)
    ↓
Response displayed normally
```

### Voice Command Examples

**English**:
- "Show my tasks"
- "Add a new task to buy groceries tomorrow"
- "Delete task number three"
- "Mark the homework task as completed"
- "Update the dentist appointment to urgent"

**Urdu**:
- "میرے کام دکھائیں" (Show my tasks)
- "کل کے لیے گروسری خریدنے کا کام شامل کریں" (Add task to buy groceries tomorrow)
- "تیسرا کام حذف کریں" (Delete task number three)
- "ہوم ورک کا کام مکمل کریں" (Mark homework task completed)
- "ڈینٹسٹ کا کام فوری بنائیں" (Make dentist appointment urgent)

### Error Handling

Voice errors are handled gracefully with localized messages:

| Error Code | English Message | Urdu Message |
|------------|-----------------|--------------|
| not-allowed | Microphone access denied. Please allow microphone permissions. | مائیکروفون کی اجازت نہیں ملی۔ براہ کرم اجازت دیں۔ |
| no-speech | No speech detected. Please try again. | کوئی آواز نہیں ملی۔ دوبارہ کوشش کریں۔ |
| audio-capture | Microphone not found. Please check your device. | مائیکروفون دستیاب نہیں۔ اپنا آلہ چیک کریں۔ |
| network | Network error. Please check your connection. | نیٹ ورک کا مسئلہ۔ اپنا کنکشن چیک کریں۔ |

**Error Behavior**:
- All errors are dismissible (X button)
- Errors never block text input
- User can retry after dismissing error
- Text input always works as fallback

### Language Detection

Language is automatically detected from transcribed text:
- **Urdu**: Detected if text contains characters in Unicode range U+0600-U+06FF (Arabic script)
- **English**: Default if no Urdu characters detected
- **Auto-switch**: UI language automatically switches if detected language differs
- **Manual toggle**: Language toggle button remains functional

### Performance

- **Voice activation**: <500ms from button tap to listening
- **Transcription updates**: Real-time (<100ms)
- **Auto-send delay**: Exactly 300ms after speech ends
- **Page load impact**: <100ms increase (lazy initialization)
- **Memory usage**: <5MB during active recording
- **Zero server impact**: All processing happens in browser

### Privacy & Security

- ✅ **Audio NEVER sent to our servers** - processed entirely in browser
- ✅ **Only text transcription sent** - via existing authenticated chat endpoint
- ✅ **Same security as typed messages** - no additional security concerns
- ✅ **Microphone permission** - requested only when user clicks mic button
- ✅ **No audio storage** - audio exists only in browser memory during recording

### Reusable Skill

Voice commands documented as **reusable skill** at `.claude/skills/voice-commands-chatbot.md`:
- **Skill Name**: voice-commands-chatbot
- **Version**: 1.0.0
- **Activation**: Triggered when user mentions voice, microphone, speech, or hands-free interaction
- **Type**: Frontend Interaction
- **Risk Level**: Low (graceful degradation)

---

## 🤖 AI Agent Details

### OpenAI Agents SDK Configuration
- **Library**: `openai-agents-mcp` (version 0.0.8)
- **Import**: `from agents_mcp import Agent, RunnerContext`
- **Import**: `from agents import Runner, function_tool` (NOT function_to_tool!)
- **Model**: GPT-4 (configured via OpenAI API)

### Agent Instructions (Key Points)
- MANDATORY: Always call list_tasks_tool FIRST before update/delete/complete
- NEVER ask for clarification before calling tools
- Fuzzy matching for task names (e.g., "dentist" matches "Dentist appointment")
- Bilingual response generation
- Tool chaining for complex requests
- Natural language understanding (dates, urgency, etc.)

### Tool Integration Method
```python
# MCP tools wrapped as HTTP client functions
from mcp_client_wrapper import MCP_TOOL_FUNCTIONS

# Convert to agent tools
mcp_tools = []
for tool_name, tool_func in MCP_TOOL_FUNCTIONS.items():
    mcp_tools.append(function_tool(tool_func))

# Create agent with tools
agent = Agent(
    name="Todo Assistant",
    instructions="...",
    tools=mcp_tools
)

# Run agent
result = await Runner().run(
    starting_agent=agent,
    input=message,
    context=RunnerContext()
)

# Extract response
response_text = result.final_output
```

---

## 🔍 MCP Server Implementation

### HTTP Endpoints
```
GET  /health              → Health check
GET  /mcp/tools           → List all 5 tools with schemas
POST /mcp/call            → Execute a tool
     Body: {tool_name: str, parameters: dict}
     Response: {result: dict | null, error: str | null}
```

### Tool Execution Flow
```
1. Agent calls tool function (e.g., list_tasks_tool)
2. Function makes HTTP POST to http://127.0.0.1:8001/mcp/call
3. MCP server receives request
4. Validates parameters using Pydantic models
5. Executes tool function with database session
6. Returns result to agent via HTTP response
7. Agent processes result and formulates response
8. Response stored in database and sent to frontend
```

### Starting MCP Server
- **Automatic**: Started by main.py in background thread
- **Manual Test**: `python backend/mcp-server/http_server.py`
- **Health Check**: `curl http://127.0.0.1:8001/health`

---

## 📦 Dependencies

### Backend (requirements.txt)
```
fastapi>=0.128.0
sqlmodel==0.0.22
uvicorn[standard]==0.32.1
python-dotenv==1.0.1
pyjwt>=2.10.1
bcrypt==4.2.0
psycopg2-binary==2.9.9
httpx==0.28.1
openai>=2.14.0
openai-agents>=0.6.5
openai-agents-mcp>=0.0.8
mcp>=1.25.0
mcp-agent>=0.2.6
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "next": "16.0.10",
    "react": "^19",
    "react-dom": "^19"
  }
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Error starting MCP server: No module named 'mcp_server'"
**Solution**: MCP server uses hyphenated directory name. Import uses importlib.
**Fixed in**: main.py with proper importlib loading

### Issue 2: "cannot import name 'engine' from 'db'"
**Solution**: Use `get_engine()` not `engine`
**Fixed in**: mcp-server/tools.py (all 5 tools)

### Issue 3: "function_to_tool not found"
**Solution**: Correct import is `function_tool` not `function_to_tool`
**Fixed in**: routes/chat.py line 25

### Issue 4: Login shows "Not Found"
**Solution**: Frontend API URL was pointing to 8001 (MCP) instead of 8000 (Backend)
**Fixed in**: frontend/src/lib/api.ts and frontend/.env.local

### Issue 5: "I processed your request" (no real response)
**Solution**: Extract response from result.final_output
**Fixed in**: routes/chat.py with proper RunResult handling

### Issue 6: CSS Parsing Error "@import rules must precede"
**Solution**: Use Next.js font loading instead of @import in CSS
**Fixed in**: layout.tsx with Noto_Nastaliq_Urdu import, globals.css uses --font-urdu variable

### Issue 7: Agent falls back to NLU instead of using MCP tools
**Solution**: Check OpenAI API key is set, MCP server is running on 8001
**Debug**: Look for "DEBUG: MCP server is healthy" in console

### Issue 8: Urdu text displays left-to-right
**Solution**: Add dir="rtl" to elements with Urdu text
**Fixed in**: chat/page.tsx with automatic direction detection

### Issue 9: Voice button not appearing in Chrome/Edge
**Solution**: Check browser version (Chrome 25+, Edge 79+). Check console for errors.
**Debug**: Look for `isSupported` in voice hook, verify `SpeechRecognition` in window
**Common causes**: Very old browser version, browser privacy settings blocking speech API

### Issue 10: Voice permission denied error
**Solution**: Browser blocked microphone access
**User action**: Click lock icon in address bar → Site settings → Allow microphone
**Alternative**: User can always use text input as fallback

### Issue 11: Voice transcription inaccurate
**Solution**: This is a browser limitation, not a bug
**Mitigation**:
- Speak clearly and at normal pace
- Use in quiet environment
- User sees 300ms preview before auto-send (can verify transcription)
- Text input always available for corrections

### Issue 12: Voice button appears in Firefox
**Solution**: Should NOT appear - check browser detection in useVoiceRecognition hook
**Fixed**: Voice hook checks for both `SpeechRecognition` and `webkitSpeechRecognition`
**Debug**: Firefox should return `isSupported = false`

### Issue 13: Urdu voice recognition not working
**Solution**: Ensure language code is set to `ur-PK` not just `ur`
**Debug**: Check recognition.lang in voice hook when language is Urdu
**Note**: Safari does not support Urdu voice (English only)

---

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://localhost:8000/

# MCP server health
curl http://localhost:8001/health

# List MCP tools
curl http://localhost:8001/mcp/tools
```

### Test Chat Agent
1. Login to frontend
2. Go to /chat
3. Try: "show my tasks"
4. Check backend console for:
   - "DEBUG: OpenAI API key is set"
   - "DEBUG: MCP server is healthy"
   - "DEBUG: Created 5 MCP tools for agent"
   - "DEBUG: Agent created successfully"

### Test Urdu Support
1. Click language toggle button (اردو)
2. Type: "میرے کام دکھائیں"
3. Check text displays RTL
4. Check font is Noto Nastaliq Urdu

### Test Voice Commands
1. Open chat in **Chrome or Edge** (not Firefox)
2. Check microphone button appears next to Send button
3. Click microphone button
4. Allow microphone permission if prompted
5. Speak: "show my tasks"
6. Check:
   - Recording indicator shows "Listening..." with pulsing animation
   - Transcription preview appears below
   - Message auto-sends after 300ms
   - AI responds normally
7. Test Urdu voice:
   - Click language toggle to Urdu (اردو)
   - Click microphone button
   - Speak in Urdu: "میرے کام دکھائیں"
   - Check Urdu text displays with correct font and RTL
8. Test error handling:
   - Deny microphone permission → Check error message appears
   - Click microphone without speaking → Check "No speech" error

**Voice Browser Requirements**:
- ✅ Chrome/Edge: Full test (English + Urdu)
- ⚠️ Safari: Test English only
- ❌ Firefox: Voice button should not appear

---

## 📝 Spec-Kit Structure
Specifications are organized in /specs:
- /specs/overview.md - Project overview
- /specs/features/ - Feature specs (what to build)
- /specs/api/ - API endpoint and MCP tool specs
- /specs/database/ - Schema and model specs
- /specs/ui/ - Component and page specs

## How to Use Specs
1. Always read relevant spec before implementing
2. Reference specs with: @specs/features/task-crud.md
3. Update specs if requirements change

---

## 🎨 Reusable Skills
- Standardized components in .claude/skills/
- **AI chatbot frontend**: .claude/skills/ai-chatbot-frontend.ts
- **AI chatbot backend**: .claude/skills/ai-chatbot-backend.py
- **Voice commands**: .claude/skills/voice-commands-chatbot.md (Web Speech API integration)
- Dependencies: .claude/skills/requirements.txt and .claude/skills/package.json

---

## 📊 Database Schema

### Key Tables
1. **users** - User accounts (via Better Auth)
2. **tasks** - Todo tasks (title, description, completed, user_id, priority, recurrence_pattern)
3. **conversations** - Chat conversations (user_id, created_at, updated_at)
4. **messages** - Chat messages (conversation_id, user_id, role, content, created_at)

---

## 🔑 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host/db
OPENAI_API_KEY=sk-proj-...
BETTER_AUTH_SECRET=random_secret_key
FRONTEND_URL=http://localhost:3004
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🎯 Key Features Summary
✅ AI-powered task management chatbot
✅ Natural language understanding (English + Urdu)
✅ **Voice input with speech recognition** (English + Urdu)
✅ **Automatic language detection** (text and voice)
✅ MCP protocol for tool integration
✅ Stateless backend architecture
✅ Real-time chat interface
✅ Bilingual UI with RTL support
✅ **Hands-free task management** via voice
✅ Automatic intent recognition
✅ Task fuzzy matching
✅ Tool chaining for complex requests
✅ Database-persisted conversations
✅ Production-ready error handling
✅ **Browser-native speech processing** (zero cost, privacy-first)

---

## 💡 Important Notes for New Sessions
1. **Always check ports**: Backend=8000, MCP=8001, Frontend=3000
2. **Backend starts MCP automatically** - don't start separately
3. **Use function_tool NOT function_to_tool** in routes/chat.py
4. **Use get_engine() NOT engine** in database operations
5. **API URL must be 8000** in frontend, not 8001
6. **Urdu font loads via Next.js** in layout.tsx, not CSS @import
7. **Check .env files** if API calls fail
8. **Clear .next folder** if frontend build fails
9. **Check backend console** for debug messages about MCP/Agent
10. **Agent instructions are in routes/chat.py** - very detailed for bilingual support
11. **Voice commands are frontend-only** - no backend or database changes
12. **Voice button only appears in Chrome/Edge/Opera** - hidden in Firefox
13. **Voice uses Web Speech API** - free, browser-native, privacy-first
14. **Voice transcriptions become regular messages** - processed identically to text
15. **Voice errors never block text input** - text always works as fallback

---

## 🚨 Critical Files - DO NOT MODIFY WITHOUT UNDERSTANDING

### Backend (No Voice Changes)
1. backend/main.py - MCP server startup logic
2. backend/routes/chat.py - AI agent configuration
3. backend/mcp_client_wrapper.py - HTTP wrapper for tools
4. backend/mcp-server/http_server.py - MCP server implementation

### Frontend (Core)
5. frontend/src/lib/api.ts - API base URL configuration
6. frontend/src/app/layout.tsx - Font loading
7. frontend/src/app/chat/page.tsx - Chat interface with voice integration

### Frontend (Voice Feature)
8. frontend/src/hooks/useVoiceRecognition.ts - Voice recognition hook (Web Speech API)
9. frontend/src/types/speech.ts - TypeScript interfaces for voice
10. frontend/src/utils/languageDetection.ts - Language detection utilities
11. frontend/src/app/globals.css - Animations including voice pulse

### Skills
12. .claude/skills/voice-commands-chatbot.md - Voice commands reusable skill

---

**Last Updated**: January 2025
**Status**: ✅ Production Ready (with Voice Commands)
**Maintainer**: AI Chatbot with MCP Integration Team
