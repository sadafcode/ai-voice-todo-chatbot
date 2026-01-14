# Voice Commands: Chat Endpoint Integration Contract

## Overview
This document specifies how voice commands integrate with the existing chat endpoint. Voice transcriptions are processed identically to typed messages through the existing API infrastructure.

## Contract Status: ✅ NO API CHANGES REQUIRED

The voice feature uses the **existing** chat endpoint without any modifications to the backend API.

---

## Existing Chat Endpoint (Unchanged)

### Endpoint Specification

```
POST /api/{user_id}/chat
```

**Request Headers**:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "conversation_id": number | null,  // Optional: existing conversation ID
  "message": string                   // Required: user message (voice transcription goes here)
}
```

**Response Body**:
```json
{
  "conversation_id": number,        // Conversation ID (created if null in request)
  "response": string,                // AI assistant's response
  "tool_calls": array | null         // Optional: MCP tools invoked
}
```

**Status Codes**:
- `200 OK`: Message processed successfully
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have access to conversation
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Voice Integration Pattern

### How Voice Uses Existing Endpoint

Voice transcriptions are sent to the chat endpoint **exactly like typed messages**:

```typescript
// Existing sendMessage function (NO CHANGES)
const sendMessage = async () => {
  if (!user || !inputMessage.trim()) return;

  try {
    setIsLoading(true);

    // Add user message to UI
    const userMsg = {
      id: Date.now(),
      text: inputMessage,  // ← Voice transcription sets this
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // Call existing endpoint
    const response = await authFetch(`/api/${user.id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg.text })
    });

    const data = await handleResponse(response);

    // Add AI response to UI
    const aiMsg = {
      id: Date.now() + 1,
      text: data.response,
      sender: 'assistant',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMsg]);
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false);
  }
};
```

### Voice Integration Flow

```
1. User speaks → "show my tasks"
   ↓
2. useVoiceRecognition hook transcribes → "show my tasks"
   ↓
3. onTranscriptReady callback fires
   ↓
4. setInputMessage("show my tasks")  ← Sets existing state
   ↓
5. setTimeout(300ms)  ← Preview delay
   ↓
6. sendMessage()  ← Calls existing function
   ↓
7. POST /api/{user_id}/chat
   Body: { "message": "show my tasks" }
   ↓
8. Backend processes (EXISTING LOGIC)
   ↓
9. AI agent invokes MCP tools (EXISTING)
   ↓
10. Response returned
    ↓
11. UI updated (EXISTING)
```

**Key Point**: Steps 6-11 are **completely identical** to text input flow.

---

## Message Format Contract

### Voice Message Format

Voice transcriptions sent as plain text in the `message` field:

```json
{
  "message": "add a task to buy groceries tomorrow"
}
```

**No Special Markers**:
- ❌ No `isVoice: true` flag
- ❌ No `inputMethod: "voice"` field
- ❌ No metadata about voice recording
- ✅ Just plain text, indistinguishable from typed input

**Rationale**:
- Backend doesn't care about input method
- AI agent processes text the same way
- Database stores all messages identically
- No backend changes required

### Example Requests

**English Voice Command**:
```json
POST /api/user123/chat
{
  "message": "show my pending tasks"
}
```

**Urdu Voice Command**:
```json
POST /api/user123/chat
{
  "message": "میرے زیر التواء کام دکھائیں"
}
```

**Mixed Language** (if spoken):
```json
POST /api/user123/chat
{
  "message": "add task خریداری کرنی ہے tomorrow"
}
```

All three are processed identically by the backend.

---

## Authentication Contract

### Voice Uses Existing Auth

Voice requests use the **same authentication** as text input:

```typescript
// authFetch helper (EXISTING - NO CHANGES)
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();  // From Better Auth

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
}
```

**Voice Authentication Flow**:
1. User must be logged in (existing requirement)
2. JWT token obtained during login (existing)
3. Token included in Authorization header (existing)
4. Backend validates token (existing)
5. User ID extracted from token (existing)
6. Message associated with user (existing)

**No New Security Concerns**:
- Voice doesn't bypass authentication
- Voice doesn't create new security vectors
- Voice uses existing rate limiting
- Voice respects existing user permissions

---

## Error Handling Contract

### Voice Errors vs Chat Errors

**Voice-Specific Errors** (Client-Side Only):
- Microphone permission denied
- No speech detected
- Browser not supported
- Network error during transcription

**Chat Errors** (Server-Side, Existing):
- Invalid authentication
- Rate limit exceeded
- Server error
- Database error

**Error Isolation**:
- Voice errors **do not affect** chat functionality
- Chat errors **do not affect** voice functionality
- If voice fails, text input still works
- If chat endpoint fails, error shown same as text input

### Error Response Handling

Voice uses **existing** error handling:

```typescript
// Existing error handling (NO CHANGES)
try {
  const response = await authFetch(`/api/${user.id}/chat`, {...});
  const data = await handleResponse(response);
  // Success handling
} catch (error) {
  console.error('Chat error:', error);
  // Show error message to user
  const errorMsg = {
    id: Date.now(),
    text: 'Sorry, there was an error processing your request.',
    sender: 'assistant',
    timestamp: new Date()
  };
  setMessages(prev => [...prev, errorMsg]);
}
```

Voice transcriptions that fail at the chat endpoint level are handled the same as typed messages that fail.

---

## Rate Limiting Contract

### Voice Respects Existing Limits

Voice messages **count toward existing rate limits**:

**Current Rate Limit** (From Phase III):
- 100 requests per hour per user
- Applied to all chat endpoint calls
- Whether message came from voice or text doesn't matter

**Rate Limit Example**:
- User sends 50 typed messages
- User sends 50 voice messages
- Total: 100 messages (limit reached)
- Next message (voice or text) returns 429 status

**No Separate Voice Limit**:
- ❌ No dedicated "voice messages per hour" limit
- ❌ No lower/higher limit for voice
- ✅ Same limit as all chat messages

---

## Language Handling Contract

### Backend Language Agnostic

The existing chat endpoint and AI agent handle both English and Urdu:

**Backend Processing** (Existing):
```python
# backend/routes/chat.py (NO CHANGES)
@router.post("/api/{user_id}/chat")
async def chat(user_id: str, request: ChatRequest):
    # Backend doesn't care about language
    message = request.message  # Could be English, Urdu, or mixed

    # AI agent processes naturally
    result = await Runner().run(
        starting_agent=agent,
        input=message,  # Language-agnostic
        context=RunnerContext()
    )

    return {"response": result.final_output}
```

**Language Detection** (Client-Side Only):
- Frontend detects language from transcript
- Frontend switches UI language if needed
- Backend processes message regardless of language
- AI agent responds in appropriate language automatically

---

## Data Storage Contract

### Voice Transcriptions as Regular Messages

Voice transcriptions stored in **existing** messages table:

```sql
-- Existing messages table (NO CHANGES)
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id),
  user_id VARCHAR REFERENCES users(id),
  role VARCHAR,      -- 'user' or 'assistant'
  content TEXT,      -- ← Voice transcription stored here
  created_at TIMESTAMP
);
```

**Example Storage**:

**Voice Message**:
```sql
INSERT INTO messages (conversation_id, user_id, role, content, created_at)
VALUES (123, 'user456', 'user', 'show my tasks', '2026-01-14 10:30:00');
```

**Text Message**:
```sql
INSERT INTO messages (conversation_id, user_id, role, content, created_at)
VALUES (123, 'user456', 'user', 'show my tasks', '2026-01-14 10:31:00');
```

**Indistinguishable in Database**: Both stored identically.

---

## Performance Contract

### Voice Performance Requirements

Voice must not degrade chat endpoint performance:

**Baseline Performance** (Existing):
- P50 response time: <1 second
- P95 response time: <2 seconds
- P99 response time: <3 seconds

**Voice Impact**:
- ✅ No additional backend latency (voice processing is client-side)
- ✅ No increased database load (messages stored identically)
- ✅ No increased AI API load (messages processed identically)
- ✅ Same performance characteristics as text input

**Client-Side Voice Overhead**:
- Voice activation: ~200-300ms
- Speech transcription: ~500-1500ms (depends on speech length)
- Preview delay: 300ms
- **Total voice overhead**: ~1-2 seconds before message sent

**End-to-End Timing**:
```
User speaks (3 seconds)
  → Transcription (500ms)
  → Preview (300ms)
  → Send to endpoint (0ms - same as text)
  → Backend processing (1-2s - existing)
  → Response displayed
Total: ~5-6 seconds from speech start to response
```

---

## Backward Compatibility Contract

### Existing Features Unaffected

Voice is a **pure enhancement** - all existing functionality preserved:

**Text Input** (Unchanged):
- ✅ Textarea works exactly as before
- ✅ Send button works exactly as before
- ✅ Enter key works exactly as before
- ✅ Shift+Enter for new line works

**Message Display** (Unchanged):
- ✅ Message history displays same way
- ✅ Scrolling behavior unchanged
- ✅ Timestamps work same way
- ✅ Loading indicators unchanged

**Language Toggle** (Unchanged):
- ✅ Manual language toggle still works
- ✅ Urdu font and RTL still work
- ✅ Voice may auto-switch language, but manual toggle overrides

**Authentication** (Unchanged):
- ✅ Login flow unchanged
- ✅ Token management unchanged
- ✅ Session handling unchanged

---

## Testing Contract

### Integration Testing Requirements

Voice-to-chat integration must be tested:

**Test Cases**:

1. **Voice Message Sends Successfully**:
   - Speak command
   - Verify transcript sent to endpoint
   - Verify response displayed

2. **Voice and Text Interleaved**:
   - Send text message
   - Send voice message
   - Send text message
   - Verify all messages in correct order

3. **Voice Message Triggers MCP Tools**:
   - Speak: "add a task to buy milk"
   - Verify add_task MCP tool called
   - Verify task created in database

4. **Voice Error Doesn't Break Chat**:
   - Trigger voice error (deny microphone)
   - Verify error shown
   - Type text message
   - Verify text message sends normally

5. **Rate Limiting Applies to Voice**:
   - Send 100 messages (mix of voice and text)
   - Attempt 101st message (voice or text)
   - Verify 429 status returned

6. **Bilingual Voice Commands**:
   - Speak English command
   - Verify English response
   - Speak Urdu command
   - Verify Urdu response

---

## Migration and Rollback Contract

### Zero-Risk Deployment

Voice feature can be deployed and rolled back with zero risk:

**Deployment**:
- ✅ Frontend changes only
- ✅ No backend changes
- ✅ No database migrations
- ✅ No API version changes
- ✅ Can use feature flag for gradual rollout

**Rollback**:
- ✅ Remove voice button from UI
- ✅ Or: Deploy previous frontend version
- ✅ No backend rollback needed
- ✅ No database cleanup needed
- ✅ Existing messages remain intact

**Feature Flag Example**:
```typescript
const VOICE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_VOICE === 'true';

{VOICE_ENABLED && isVoiceSupported && (
  <VoiceButton ... />
)}
```

Toggle environment variable to enable/disable voice feature instantly.

---

## Summary

### Integration Contract: SEAMLESS ✅

- **API Changes**: None (uses existing endpoint)
- **Authentication**: Existing (no changes)
- **Rate Limiting**: Existing (voice messages count toward limit)
- **Error Handling**: Existing (voice uses same error flow)
- **Data Storage**: Existing (messages table)
- **Performance**: No degradation (client-side processing)
- **Backward Compatibility**: Complete (all existing features work)
- **Deployment Risk**: Zero (frontend only, feature flag ready)

### Voice Message Flow

```
Voice Transcription
  ↓
setInputMessage() ← EXISTING STATE
  ↓
sendMessage() ← EXISTING FUNCTION
  ↓
POST /api/{user_id}/chat ← EXISTING ENDPOINT
  ↓
AI Agent Processing ← EXISTING LOGIC
  ↓
MCP Tools ← EXISTING TOOLS
  ↓
Database Storage ← EXISTING TABLES
  ↓
Response Display ← EXISTING UI
```

Every step after voice transcription uses **existing, unchanged infrastructure**.

---

## Appendix: Example Integration Code

### Voice Hook Integration

```typescript
// In chat/page.tsx
const {
  isRecording,
  transcript,
  isSupported,
  startRecording,
  stopRecording,
  resetTranscript
} = useVoiceRecognition({
  language: language,
  onTranscriptReady: (text, lang) => {
    // 1. Update language if different
    if (lang && lang !== language) {
      setLanguage(lang);
    }

    // 2. Set input message (EXISTING STATE)
    setInputMessage(text);

    // 3. Auto-send after preview delay
    setTimeout(() => {
      sendMessage();  // ← EXISTING FUNCTION
      resetTranscript();
    }, 300);
  },
  autoDetect: true
});
```

### Complete Flow

```typescript
// User speaks
startRecording();

// Web Speech API transcribes
// → onTranscriptReady fires
// → → setInputMessage(transcript)
// → → → setTimeout(300ms)
// → → → → sendMessage() ← Uses existing chat endpoint
// → → → → → POST /api/{user_id}/chat
// → → → → → → Backend processes (existing)
// → → → → → → → AI responds (existing)
// → → → → → → → → UI updates (existing)
```

**Key Point**: After `sendMessage()` is called, everything is **exactly the same** as text input.
