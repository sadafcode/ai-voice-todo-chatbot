# Voice Commands Feature: Data Model

## Overview
The voice commands feature is a **frontend-only enhancement** that does not introduce any new data models or database schema changes. All voice transcriptions are converted to text and processed through the existing chat message infrastructure.

## Data Model Status: ✅ NO NEW MODELS REQUIRED

This feature operates entirely in the browser using client-side state management. Voice input is simply an alternative input method that produces the same data structures as text input.

---

## Existing Data Models (Unchanged)

### 1. Message Model (Existing - From Phase III)

Voice transcriptions are stored as regular messages in the existing messages table.

```python
# backend/models.py (NO CHANGES)
class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: int = Field(primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id")
    user_id: str = Field(foreign_key="users.id")
    role: str  # "user" or "assistant"
    content: str  # ← Voice transcriptions stored here as text
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Voice Integration**:
- Voice transcriptions stored in `content` field as plain text
- No special flag to indicate message originated from voice
- `role` is always "user" for voice input (same as typed input)
- Processing is identical to typed messages

### 2. Conversation Model (Existing - From Phase III)

```python
# backend/models.py (NO CHANGES)
class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Voice Integration**:
- Voice messages use existing conversation tracking
- No changes to conversation model
- Conversation updates normally when voice message sent

### 3. Task Model (Existing - From Phase II)

```python
# backend/models.py (NO CHANGES)
class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="users.id")
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: Optional[str] = None
    recurrence_pattern: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Voice Integration**:
- Tasks created via voice commands use existing task model
- AI agent extracts task details from voice transcription (same as text)
- No schema changes needed

---

## Client-Side State Models (New - Transient Only)

The voice feature introduces new **client-side TypeScript interfaces** for managing voice recognition state. These are NOT persisted to any database.

### 1. VoiceRecognition State

Managed entirely in React component state via custom hook.

```typescript
// frontend/src/types/speech.ts
interface VoiceRecognitionState {
  // Recording state
  isRecording: boolean;           // Currently listening to microphone
  isTranscribing: boolean;        // Processing speech to text

  // Results
  transcript: string;             // Current transcribed text
  detectedLanguage: 'en' | 'ur' | null;  // Auto-detected language

  // Error state
  error: string | null;           // Current error message (localized)

  // System state
  isSupported: boolean;           // Browser supports Web Speech API
}
```

**Lifecycle**:
- Created: When user clicks microphone button
- Updated: During recording and transcription
- Destroyed: After message is sent or error occurs
- Storage: React component state (RAM only)
- Persistence: None (ephemeral)

**State Transitions**:
```
idle → isRecording=true (user clicks mic)
  → isTranscribing=true (speech detected)
  → transcript populated (text available)
  → detectedLanguage set (language identified)
  → message sent via existing endpoint
  → reset to idle
```

### 2. VoiceRecognition Configuration

Configuration passed to the voice hook (not stored anywhere).

```typescript
// frontend/src/types/speech.ts
interface VoiceRecognitionConfig {
  language: 'en' | 'ur';          // Initial language preference
  autoDetect: boolean;             // Enable automatic language switching
  onTranscriptReady: (            // Callback when transcription complete
    text: string,
    detectedLanguage: 'en' | 'ur' | null
  ) => void;
}
```

**Lifecycle**:
- Created: When voice hook is initialized
- Used: Throughout recording session
- Destroyed: When component unmounts
- Storage: Function closure (RAM only)
- Persistence: None

---

## Data Flow

### Voice Input to Message Flow

```
1. User speaks
   ↓
2. Browser Web Speech API captures audio
   ↓
3. Browser sends audio to Google's servers (not ours)
   ↓
4. Google returns text transcription
   ↓
5. useVoiceRecognition hook receives transcription
   ↓
6. detectLanguage() analyzes text
   ↓
7. onTranscriptReady() callback fires
   ↓
8. setInputMessage(transcription) updates component state
   ↓
9. setTimeout(300ms) for preview
   ↓
10. sendMessage() called (EXISTING FUNCTION)
    ↓
11. POST /api/{user_id}/chat (EXISTING ENDPOINT)
    ↓
12. Message stored in database as regular message
    ↓
13. AI processes message with MCP tools (EXISTING LOGIC)
    ↓
14. Response stored in database
    ↓
15. Response displayed in UI
```

**Key Point**: Steps 10-15 are completely unchanged from existing text input flow.

---

## No Database Schema Changes

### Migration Status: ✅ NOT REQUIRED

**Reason**: Voice feature is purely client-side enhancement.

**Verification**:
- No new tables needed
- No new columns needed
- No existing columns modified
- No indexes needed
- No constraints added

**Database Interaction**:
- Voice transcriptions stored via **existing** Message model
- Uses **existing** chat endpoint
- No new SQL queries
- No new database connections
- No schema version change

---

## Privacy and Data Handling

### Audio Data

**Storage**: NONE
- Audio NEVER sent to our backend
- Audio NEVER stored in database
- Audio NEVER logged
- Audio processed by browser (sent to Google via Web Speech API)
- Audio exists only in browser memory during recording

**Lifecycle**:
- Captured: By browser during recording
- Processed: By browser (calls Google's service)
- Transmitted: To Google's servers (not ours)
- Stored: Nowhere (ephemeral)
- Deleted: Immediately after transcription

### Transcription Data

**Storage**: YES (as regular message)
- Transcription text sent to backend (same as typed message)
- Stored in `messages.content` field
- Associated with user_id and conversation_id
- Retention: Same policy as typed messages
- Privacy: Same level as typed messages

**Processing**:
- Client-side: Language detection, preview, auto-send
- Server-side: AI agent processing (existing logic)
- No special handling for voice-originated messages

### Personal Data

**GDPR Compliance**:
- Audio: Not collected by us (processed by browser/Google)
- Transcriptions: Treated as user content (existing policy)
- User consent: Microphone permission requested by browser
- Data portability: Messages can be exported (existing feature)
- Right to deletion: Messages can be deleted (existing feature)

---

## State Management Architecture

### Frontend State Hierarchy

```
App State (React Context)
├── Auth State (useAuth hook) ← EXISTING
│   ├── user
│   ├── isAuthenticated
│   └── token
│
└── Chat Page State (useState) ← EXISTING
    ├── messages[] ← EXISTING
    ├── inputMessage ← EXISTING (voice sets this)
    ├── isLoading ← EXISTING
    ├── language ← EXISTING (voice may change this)
    │
    └── Voice State (useVoiceRecognition hook) ← NEW
        ├── isRecording ← NEW
        ├── isTranscribing ← NEW
        ├── transcript ← NEW
        ├── error ← NEW
        ├── detectedLanguage ← NEW
        └── isSupported ← NEW
```

**Integration Points**:
- Voice hook updates existing `inputMessage` state
- Voice hook may update existing `language` state
- Voice hook triggers existing `sendMessage()` function
- Voice state is independent (can be removed without affecting other state)

### State Isolation

**Voice state is completely isolated**:
- ✅ Can be removed without breaking chat
- ✅ Does not affect message history
- ✅ Does not affect authentication
- ✅ Does not affect existing input controls
- ✅ Errors don't propagate to parent state

---

## Validation Rules

### No New Validation Required

Voice transcriptions go through **existing** validation:

1. **Message Content Validation** (Existing):
   - Required: `content.trim().length > 0`
   - Max length: 1000 characters (existing limit)
   - Sanitization: Handled by AI agent (existing)

2. **User Authentication Validation** (Existing):
   - Required: Valid JWT token
   - User must be authenticated
   - User ID must match conversation owner

3. **Rate Limiting** (Existing):
   - 100 requests/hour per user (existing limit)
   - Applied to all messages (voice or text)

**Voice-Specific Validation** (Client-Side Only):
- Browser support check (hide feature if unsupported)
- Microphone permission check (show error if denied)
- Empty transcript check (don't send if no speech detected)

---

## Performance Considerations

### Memory Usage

**Client-Side**:
- Voice hook state: ~1KB (JavaScript object)
- SpeechRecognition object: ~500KB-1MB
- Audio buffers: ~2-4MB during recording
- Transcript text: <10KB typically
- **Total**: ~5MB maximum during active recording

**Server-Side**:
- No additional memory (voice uses existing message handling)

### Storage Impact

**Database**:
- No new tables: 0 bytes overhead
- Messages table: Same size increase as typed messages
- Average voice transcript: ~50-200 characters
- Storage: ~50-200 bytes per voice message (same as text)

**No Storage Explosion**: Voice doesn't store more data than text input.

---

## Summary

### Data Model Changes: NONE ✅

- **New Tables**: 0
- **New Columns**: 0
- **Modified Tables**: 0
- **Database Migrations**: 0
- **Schema Version**: Unchanged

### Client-Side State: NEW ✅

- **Transient State**: VoiceRecognition state (RAM only)
- **Persisted State**: None (voice transcriptions stored as regular messages)
- **State Isolation**: Complete (can be removed without impact)

### Integration: SEAMLESS ✅

- Voice transcriptions → existing Message model
- Voice state → existing chat component state
- Voice errors → independent error handling
- Voice feature → optional enhancement (not required)

### Privacy: ENHANCED ✅

- Audio never leaves browser to reach our servers
- Transcriptions treated as regular user messages
- No new privacy concerns introduced
- Better privacy than text (no keystroke logging)

---

## Appendix: TypeScript Type Definitions

For complete TypeScript interface definitions, see:
- `frontend/src/types/speech.ts` (to be created in implementation)
- `frontend/src/hooks/useVoiceRecognition.ts` (to be created in implementation)

These type definitions document the shape of client-side transient state only.
