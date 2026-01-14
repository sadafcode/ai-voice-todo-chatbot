# Implementation Plan: Voice Commands for AI Chatbot

## Overview
This plan outlines the implementation approach for adding voice input capability to the AI-powered todo chatbot, enabling users to speak their commands in English or Urdu with automatic transcription and language detection.

## Technical Context

### Current System State
- **Frontend**: Next.js 16+ with App Router, React 19, TypeScript, Tailwind CSS
- **Chat Interface**: src/app/chat/page.tsx (client component with bilingual support)
- **Bilingual Support**: Language toggle (English ↔ Urdu), RTL layout, Noto Nastaliq Urdu font
- **Message Flow**: User input → POST /api/{user_id}/chat → AI agent → Response display
- **Authentication**: Better Auth with useAuth() hook
- **State Management**: React useState/useEffect hooks
- **Styling**: Tailwind CSS v4 with custom font variables

### Technology Decisions

#### Web Speech API (Browser-Native)
**Decision**: Use Web Speech API for speech-to-text processing

**Rationale**:
- User requirement specified Web Speech API
- Zero backend changes required
- No additional API costs
- Built into modern browsers (Chrome, Edge, Opera)
- Supports both English and Urdu recognition
- Real-time transcription with interim results
- No audio data leaves the browser (privacy)

**Alternatives Considered**:
- OpenAI Whisper API: Higher cost, requires backend changes, excellent accuracy
- Google Cloud Speech-to-Text: Requires GCP setup, additional infrastructure
- Browser Web Speech API: ✅ Selected - meets requirements, no cost, no backend changes

**Trade-offs**:
- Limited browser support (Chrome/Edge/Opera only, not Firefox)
- Requires internet connection
- Accuracy depends on browser's language models
- No control over speech recognition quality

#### Custom React Hook Pattern
**Decision**: Encapsulate all voice logic in a custom `useVoiceRecognition` hook

**Rationale**:
- Separation of concerns (voice logic isolated from UI)
- Reusability across components if needed
- Easier testing and maintenance
- Follows React best practices
- Zero impact on existing chat component logic

**Alternatives Considered**:
- Inline implementation in chat page: Clutters component, harder to test
- Separate context provider: Over-engineering for single-page feature
- Custom hook: ✅ Selected - clean, testable, reusable

**Trade-offs**:
- Slightly more file structure complexity
- Requires understanding of React hooks patterns
- Benefits outweigh minimal added complexity

#### Auto-Send UX Pattern
**Decision**: Automatically send transcribed message after 300ms preview delay

**Rationale**:
- User requirement specified auto-send
- Fastest hands-free operation
- 300ms gives user brief visual confirmation
- Matches voice assistant UX patterns (Siri, Google Assistant)
- Reduces interaction steps (no manual send needed)

**Alternatives Considered**:
- Manual review before send: Slower, requires additional tap
- Instant send (0ms delay): Too fast, no user feedback
- 300ms auto-send: ✅ Selected - balanced between speed and confirmation

**Trade-offs**:
- User cannot edit transcription before sending
- Mistakes require follow-up correction message
- Benefits: Much faster interaction for hands-free use cases

#### Language Auto-Detection
**Decision**: Detect language from transcript using Unicode character analysis

**Rationale**:
- User requirement specified auto-detection
- Simple Unicode range check (U+0600-U+06FF for Urdu)
- Leverages existing `containsUrdu()` pattern in codebase
- Seamless language switching without user action
- Matches natural conversation patterns

**Alternatives Considered**:
- Manual language selection before recording: More steps, slower
- Browser language detection: Less accurate, inconsistent
- Unicode character analysis: ✅ Selected - reliable, simple, fast

**Trade-offs**:
- Cannot detect language from audio itself (only from text)
- Mixed-language text defaults to detected script
- Simple and effective for English/Urdu binary choice

## Constitution Alignment Check

### Core Architecture Principles

#### ✅ Evolutionary Design
- **Alignment**: FULL
- **Evidence**: Voice commands are purely additive to Phase III chatbot
- **Verification**: All existing functionality preserved (FR-9 in spec)
- **Impact**: Zero breaking changes, backward compatible

#### ✅ MCP-First Design (Phase III)
- **Alignment**: FULL
- **Evidence**: Voice transcriptions use existing chat endpoint and MCP tools
- **Verification**: Voice messages processed identically to typed messages
- **Impact**: No changes to MCP server or tools

#### ✅ Natural Language Interface (Phase III)
- **Alignment**: ENHANCED
- **Evidence**: Voice input provides alternative natural language input method
- **Verification**: AI agent processes voice transcriptions same as typed text
- **Impact**: Enhances natural language interaction with voice modality

#### ✅ State Management
- **Alignment**: FULL
- **Evidence**: Voice uses existing stateless chat endpoint
- **Verification**: No voice-specific state stored on server
- **Impact**: Maintains stateless architecture, voice state is client-side only

#### ✅ Security & Data Isolation
- **Alignment**: ENHANCED
- **Evidence**: Voice processing happens in browser, no audio sent to server
- **Verification**: Only text transcription sent via existing authenticated endpoint
- **Impact**: Better privacy than typed input (no audio stored anywhere)

#### ✅ Scalability & Performance
- **Alignment**: FULL
- **Evidence**: Voice processing is client-side, zero server impact
- **Verification**: No additional backend load from voice feature
- **Impact**: Improves scalability (computation moved to client)

#### ✅ Agentic Development
- **Alignment**: FULL
- **Evidence**: Following spec → plan → tasks → implement workflow
- **Verification**: This plan generated from spec, tasks will follow
- **Impact**: Consistent development methodology

### Features Matrix Impact

#### Core Task Operations (All Phases)
- **Impact**: NONE - All operations work via voice commands
- **Voice Benefit**: Users can add/list/update/delete/complete tasks by speaking

#### Phase II Additions
- **Impact**: NONE - Auth, database, API unchanged
- **Voice Benefit**: Voice commands respect user authentication and data isolation

#### Phase III Additions
- **Impact**: ENHANCED - Voice adds new input modality for natural language
- **Voice Benefit**: More natural conversational interface with voice option

### Integration Requirements

#### Phase II → Phase III Transition (Existing)
- **Impact**: NONE - Voice uses existing infrastructure
- **Verification**: Backend, database, auth unchanged

#### Voice Commands Integration (New)
- **Requirements**:
  - Frontend: Add voice UI components to existing chat page
  - No backend changes required
  - Use existing authentication
  - Use existing bilingual support infrastructure
  - Maintain existing chat message flow

### Constitution Compliance Score: ✅ 100%

**Summary**: Voice commands feature is perfectly aligned with constitution principles. It enhances the natural language interface without modifying core architecture, maintains all existing principles, and adds value through improved accessibility and user experience.

## Architecture Components

### 1. Voice Recognition Hook (useVoiceRecognition)
- **Objective**: Encapsulate Web Speech API logic in reusable React hook
- **Scope**:
  - Browser compatibility detection
  - Speech recognition initialization and lifecycle management
  - Language detection and auto-switching
  - Error handling for all voice scenarios
  - State management (recording, transcribing, errors)
- **Out of Scope**:
  - UI components (handled separately)
  - Message sending logic (uses existing)
  - Backend integration (no changes needed)

### 2. Voice UI Components
- **Objective**: Add voice input interface to existing chat page
- **Scope**:
  - Microphone button next to Send button
  - Recording indicator with animation
  - Live transcription preview
  - Error message display
  - Visual state feedback (colors, icons, text)
- **Out of Scope**:
  - Modifying existing chat UI components
  - Changing existing message display
  - Altering existing input controls

### 3. Language Detection Utilities
- **Objective**: Detect language from transcribed text
- **Scope**:
  - Unicode character analysis for Urdu detection
  - Language code mapping (en-US, ur-PK)
  - Localized error messages
  - Text direction detection (LTR/RTL)
- **Out of Scope**:
  - Modifying existing language toggle
  - Changing existing font loading
  - Altering existing RTL support

### 4. Browser Compatibility Layer
- **Objective**: Detect and adapt to browser support
- **Scope**:
  - Web Speech API availability detection
  - Graceful feature hiding in unsupported browsers
  - Fallback to text input
  - Clear messaging about browser requirements
- **Out of Scope**:
  - Polyfills for unsupported browsers
  - Custom speech recognition implementation
  - Backend fallback services

## Key Decisions and Rationale

### 1. Frontend-Only Implementation
- **Options Considered**:
  - Backend speech processing (Whisper API): Higher cost, more accurate
  - Hybrid (browser + backend fallback): Complex, expensive
  - Browser-only (Web Speech API): ✅ Selected
- **Trade-offs**:
  - Browser-only: Free, fast, privacy-friendly, but limited browser support
  - Backend: Better accuracy, all browsers, but costs money and adds latency
- **Rationale**: User specified Web Speech API, no backend changes allowed, zero cost requirement

### 2. Custom Hook Architecture
- **Options Considered**:
  - Inline code in chat component: Simple but messy
  - Context provider: Over-engineered for single page
  - Custom hook: ✅ Selected
- **Trade-offs**:
  - Custom hook: Clean separation, testable, but requires hook knowledge
  - Inline: Simple but clutters component and hard to test
- **Rationale**: Follows React best practices, maintains clean component structure, easier testing

### 3. Auto-Send with Preview
- **Options Considered**:
  - Instant send (0ms): Too fast, no feedback
  - Manual review: Requires extra tap, defeats hands-free purpose
  - Auto-send with 300ms preview: ✅ Selected
- **Trade-offs**:
  - Auto-send: Fast hands-free operation, but user can't edit before sending
  - Manual: More control, but slower and requires hands
- **Rationale**: User specified auto-send, 300ms provides visual confirmation without significant delay

### 4. Language Auto-Detection
- **Options Considered**:
  - Manual language selection: More control, slower
  - Browser detection: Inconsistent across browsers
  - Unicode character detection: ✅ Selected
- **Trade-offs**:
  - Unicode detection: Simple and reliable for Urdu, but only detects from text not audio
  - Manual selection: User control, but extra steps
- **Rationale**: User specified auto-detection, Unicode analysis is simple and effective for English/Urdu

## Interfaces and Contracts

### 1. Voice Recognition Hook Interface

```typescript
interface VoiceRecognitionConfig {
  language: 'en' | 'ur';
  onTranscriptReady: (text: string, detectedLanguage: 'en' | 'ur' | null) => void;
  autoDetect?: boolean;
}

interface UseVoiceRecognitionReturn {
  // State
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  detectedLanguage: 'en' | 'ur' | null;

  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
}

function useVoiceRecognition(config: VoiceRecognitionConfig): UseVoiceRecognitionReturn
```

**Contract Details**:
- Hook is called with language preference and callback
- Returns state values and action functions
- onTranscriptReady called when final transcription available
- State updates trigger React re-renders
- Hook handles all Web Speech API lifecycle

### 2. Web Speech API Integration

```typescript
// Browser API (not our code, but what we integrate with)
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;

  start(): void;
  stop(): void;
  abort(): void;

  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
}
```

**Configuration**:
- `continuous: false` - Stop after user finishes speaking
- `interimResults: true` - Show live transcription
- `lang: 'en-US' | 'ur-PK'` - Recognition language
- `maxAlternatives: 1` - Single best result

### 3. Language Detection Functions

```typescript
// Detect Urdu characters in text
function containsUrdu(text: string): boolean

// Detect predominant language
function detectLanguage(text: string): 'en' | 'ur'

// Get speech recognition language code
function getLanguageCode(lang: 'en' | 'ur'): string

// Get localized error message
function getVoiceErrorMessage(errorCode: string, language: 'en' | 'ur'): string
```

### 4. Voice Commands Integration Flow

```
User taps microphone button
    ↓
useVoiceRecognition.startRecording()
    ↓
Web Speech API starts listening
    ↓
User speaks: "show my tasks"
    ↓
Interim results: "show" → "show my" → "show my tasks"
    ↓
Final result: "show my tasks"
    ↓
detectLanguage("show my tasks") → 'en'
    ↓
onTranscriptReady("show my tasks", 'en')
    ↓
setInputMessage("show my tasks")
    ↓
setTimeout(300ms)
    ↓
sendMessage() ← EXISTING FUNCTION
    ↓
POST /api/{user_id}/chat ← EXISTING ENDPOINT
    ↓
AI processes with MCP tools ← EXISTING LOGIC
    ↓
Response displayed ← EXISTING UI
```

**Key Integration Points**:
- Voice hook calls existing `setInputMessage()` state setter
- Voice triggers existing `sendMessage()` function
- Voice uses existing message sending flow (POST to chat endpoint)
- Voice messages processed identically to typed messages by AI

### 5. Error Handling Contract

```typescript
type SpeechRecognitionErrorCode =
  | 'not-allowed'    // Microphone permission denied
  | 'no-speech'      // No speech detected
  | 'audio-capture'  // Microphone not found
  | 'network'        // Network error
  | 'aborted'        // User aborted
  | 'not-supported'  // Browser doesn't support feature

// Error message format
interface VoiceError {
  code: SpeechRecognitionErrorCode;
  message: string;  // Localized to current UI language
  dismissible: boolean;  // User can dismiss error
}
```

### 6. Browser Compatibility Contract

```typescript
interface BrowserSupport {
  isSupported: boolean;        // Web Speech API available
  browserName: string;         // "Chrome" | "Edge" | "Firefox" | etc.
  recommendation: string | null;  // "Please use Chrome or Edge" if unsupported
}

// Support matrix
const BROWSER_SUPPORT = {
  chrome: { english: true, urdu: true, quality: 'excellent' },
  edge: { english: true, urdu: true, quality: 'excellent' },
  opera: { english: true, urdu: true, quality: 'good' },
  safari: { english: true, urdu: false, quality: 'fair' },
  firefox: { english: false, urdu: false, quality: 'none' }
};
```

## Data Management

### No Server-Side Data Changes

**Voice Feature Data Flow**:
- ✅ Voice audio: Processed in browser, NEVER sent to server
- ✅ Transcribed text: Sent to existing chat endpoint as message
- ✅ Language preference: Stored in component state (existing)
- ✅ Error states: Client-side only (not persisted)

**Existing Data Flow Unchanged**:
- ✅ Chat messages: Stored in database via existing endpoint
- ✅ Conversations: Managed by existing stateless backend
- ✅ User authentication: Handled by existing Better Auth
- ✅ Task operations: Processed by existing MCP tools

### Source of Truth

**Voice Feature State** (Client-Side Only):
- Recording state: React component state
- Transcription: SpeechRecognition API results
- Errors: Component state
- Browser support: Computed from window.SpeechRecognition

**Existing Data** (Server-Side, Unchanged):
- User data: PostgreSQL database
- Tasks: Existing tasks table
- Conversations: Existing conversations table
- Messages: Existing messages table (voice transcripts stored as regular messages)

## Non-Functional Requirements and Budgets

### Performance

**Voice Feature Specific**:
- Voice activation latency: <500ms from button tap to listening
- Transcription preview: Real-time (<100ms updates during speech)
- Auto-send delay: Exactly 300ms after transcription complete
- Page load impact: <100ms increase (lazy loading of speech API)
- Memory overhead: <5MB during active recording

**Existing System Unchanged**:
- Chat endpoint response: <2s (existing requirement)
- Message display: Instant (existing behavior)
- Authentication: <100ms (existing requirement)

### Reliability

**Voice Feature**:
- Graceful degradation: 100% (feature hidden if unsupported)
- Fallback success: 100% (text input always available)
- Error recovery: All errors dismissible, text input unaffected
- Browser compatibility: Chrome/Edge/Opera full support

**Existing System**:
- Chat functionality: Unchanged (99.9% uptime maintained)
- Authentication: Unchanged
- MCP tools: Unchanged

### Security

**Voice Feature**:
- Audio privacy: 100% (audio never leaves browser)
- Transcript privacy: Same as typed messages (sent via authenticated endpoint)
- Permission handling: Browser-managed microphone permission
- No new attack vectors: Voice transcriptions treated as regular user input

**Existing Security Maintained**:
- Authentication: Unchanged (Better Auth)
- Authorization: Unchanged (user data isolation)
- Input sanitization: Unchanged (AI agent handles)

### Accessibility

**Voice Feature Enhancements**:
- ARIA labels: All voice buttons and states
- Keyboard shortcuts: Ctrl/Cmd + M to toggle recording
- Screen reader: Recording states announced
- Focus management: Proper tab order maintained
- Visual indicators: Don't rely on color alone

**Existing Accessibility Maintained**:
- Text input: Primary input method preserved
- Keyboard navigation: Unchanged
- Screen reader: Existing functionality preserved

### Cost

**Voice Feature**:
- Development cost: ~8-12 hours implementation
- Infrastructure cost: $0/month (browser API, no backend)
- API costs: $0 (no external services)
- Maintenance cost: Minimal (no backend to maintain)

**Existing Costs Unchanged**:
- OpenAI API: Same (voice uses existing chat endpoint)
- Database: Same (messages stored identically)
- Hosting: Same (no backend changes)

## Operational Readiness

### Observability

**Voice Feature Metrics** (Client-Side Only):
- Voice usage rate: Track in browser analytics
- Success rate: Track transcription completion
- Error rate: Track error types and frequency
- Browser distribution: Track which browsers users use

**No Server-Side Logging Required**:
- Voice events don't generate server logs
- Voice transcriptions logged as regular messages
- Existing observability unchanged

### Monitoring

**Client-Side Monitoring**:
- Track Web Speech API errors via error boundaries
- Monitor browser compatibility detection
- Track user adoption (% of users trying voice)

**Server-Side Unchanged**:
- Chat endpoint monitoring unchanged
- Database monitoring unchanged
- Authentication monitoring unchanged

### Deployment Strategy

**Phase 1: Feature Flag (Optional)**
- Deploy with feature flag disabled
- Enable for internal testing
- Gradual rollout to users

**Phase 2: Full Deployment**
- Deploy frontend changes only
- No backend deployment needed
- No database migrations needed
- Zero-downtime deployment (frontend only)

**Rollback Plan**:
- Remove voice button via feature flag
- Or: Deploy previous frontend version
- No backend rollback needed
- No data cleanup required

### Feature Flags

**Voice Feature Toggle**:
```typescript
const VOICE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_VOICE === 'true';

// In component
{VOICE_ENABLED && isVoiceSupported && (
  <VoiceButton ... />
)}
```

**Benefits**:
- Quick disable if issues found
- Gradual rollout capability
- A/B testing possible
- No code changes for enable/disable

## Risk Analysis and Mitigation

### 1. Poor Transcription Accuracy
- **Risk**: Users get frustrated by incorrect transcriptions
- **Likelihood**: Medium (depends on environment/accent)
- **Impact**: High (affects user experience)
- **Blast Radius**: Individual user experience only
- **Mitigation**:
  - 300ms preview window (users see transcription before send)
  - Text input always available as fallback
  - Clear error messages for recognition failures
- **Kill Switch**: Feature flag to disable voice entirely
- **Monitoring**: Track error rates and user feedback

### 2. Browser Incompatibility
- **Risk**: Feature doesn't work in some browsers
- **Likelihood**: High (Firefox doesn't support Web Speech API)
- **Impact**: Low (graceful degradation planned)
- **Blast Radius**: Users on unsupported browsers (no functionality loss, just no voice)
- **Mitigation**:
  - Browser detection before showing button
  - Feature hidden completely in unsupported browsers
  - No broken UI or console errors
  - Text input works perfectly in all browsers
- **Kill Switch**: Not needed (feature auto-disabled in unsupported browsers)
- **Monitoring**: Track browser distribution in analytics

### 3. Breaking Existing Chat Functionality
- **Risk**: Voice feature interferes with text input or message sending
- **Likelihood**: Low (isolated implementation)
- **Impact**: Critical (would affect all users)
- **Blast Radius**: All chat functionality
- **Mitigation**:
  - All voice logic in separate custom hook
  - Zero modifications to existing sendMessage() function
  - Comprehensive testing of existing features
  - Voice errors don't affect text input
- **Kill Switch**: Feature flag to disable voice
- **Monitoring**: Error rate monitoring, user feedback
- **Testing**: Full regression test of existing chat features

### 4. Microphone Permission Denial
- **Risk**: Users deny microphone permission
- **Likelihood**: Medium (common on first use)
- **Impact**: Low (voice just doesn't work, text works fine)
- **Blast Radius**: Individual user's voice feature only
- **Mitigation**:
  - Clear error message with instructions
  - Text input remains fully functional
  - Don't repeatedly prompt for permission
- **Kill Switch**: Not needed (per-user issue)
- **Monitoring**: Track permission denial rate

### 5. Privacy Concerns
- **Risk**: Users worry about voice data collection
- **Likelihood**: Low (privacy-conscious users)
- **Impact**: Medium (trust issues)
- **Blast Radius**: User adoption rate
- **Mitigation**:
  - Clear communication: "Processing happens in your browser"
  - No audio sent to servers (only text transcription)
  - Privacy notice near microphone button
  - Transcript treated same as typed message
- **Kill Switch**: Feature flag
- **Monitoring**: User feedback, adoption rate

### 6. Urdu Recognition Quality
- **Risk**: Urdu transcription less accurate than English
- **Likelihood**: Medium (browser models vary)
- **Impact**: Medium (Urdu-speaking users affected)
- **Blast Radius**: Urdu users only
- **Mitigation**:
  - Start with correct language code (ur-PK)
  - Allow language toggle before recording
  - Text input always available
  - Set expectations in UI
- **Kill Switch**: Could disable Urdu voice only via feature flag
- **Monitoring**: Track accuracy by language

## Evaluation and Validation

### Definition of Done

**Implementation Complete**:
- [ ] useVoiceRecognition custom hook implemented and tested
- [ ] Voice button integrated into chat UI
- [ ] Recording indicator with animation working
- [ ] Live transcription preview displaying
- [ ] Auto-send after 300ms functioning
- [ ] Language auto-detection working (English ↔ Urdu)
- [ ] Error handling for all scenarios
- [ ] Browser compatibility detection working
- [ ] Existing chat functionality fully preserved (regression tests pass)

**Quality Assurance**:
- [ ] Unit tests for voice hook (>80% coverage)
- [ ] Integration tests for UI components
- [ ] End-to-end tests for voice commands
- [ ] Cross-browser testing (Chrome, Edge, Firefox, Safari)
- [ ] Mobile testing (Android Chrome, iOS Safari)
- [ ] Accessibility testing (ARIA, keyboard, screen reader)
- [ ] Performance testing (page load, memory usage)

**Documentation Complete**:
- [ ] Code comments in voice hook
- [ ] CLAUDE.md updated with voice feature
- [ ] Browser compatibility documented
- [ ] Troubleshooting guide created

### Output Validation

**Functional Validation**:
- Voice transcription produces accurate text (>85% accuracy in quiet environment)
- Auto-send triggers after 300ms delay
- Language detection switches UI correctly
- Errors display appropriate messages
- Text input continues working perfectly

**Performance Validation**:
- Voice activation <500ms latency
- Transcription preview <100ms update rate
- Page load increase <100ms
- Memory overhead <5MB during recording
- No impact on existing chat endpoint response time

**User Experience Validation**:
- Users can complete voice command in <5 seconds
- Voice button is discoverable and intuitive
- Recording state is clearly visible
- Errors are helpful and dismissible
- Fallback to text input is seamless

**Accessibility Validation**:
- Voice button accessible via keyboard
- Screen reader announces recording states
- ARIA labels are descriptive
- Focus management works correctly
- Visual indicators don't rely on color alone

## Implementation Phases

### Phase 0: Research & Setup ✅ COMPLETE

Research completed during planning phase:

**Web Speech API Research**:
- Confirmed browser support matrix
- Verified language code formats (en-US, ur-PK)
- Tested interim results behavior
- Documented error types and handling

**React Patterns Research**:
- Custom hook patterns for Web Speech API
- Cleanup strategies for event listeners
- State management best practices
- TypeScript typing for browser APIs

**Bilingual Support Research**:
- Unicode range for Urdu detection confirmed
- Integration with existing language infrastructure
- RTL support patterns documented

**No Additional Research Required**: All technical unknowns resolved.

### Phase 1: Core Voice Hook Implementation

**Files to Create**:
1. `frontend/src/hooks/useVoiceRecognition.ts` - Core voice logic
2. `frontend/src/types/speech.ts` - TypeScript interfaces
3. `frontend/src/utils/languageDetection.ts` - Language utilities

**Implementation Steps**:

1. **Create TypeScript Interfaces** (`frontend/src/types/speech.ts`):
   - Window interface extension for Web Speech API
   - VoiceRecognitionConfig interface
   - UseVoiceRecognitionReturn interface
   - SpeechRecognitionErrorCode type
   - Document all interfaces with JSDoc comments

2. **Create Language Utilities** (`frontend/src/utils/languageDetection.ts`):
   - `containsUrdu(text: string): boolean` - Check for Urdu characters
   - `detectLanguage(text: string): 'en' | 'ur'` - Detect language from text
   - `getLanguageCode(lang: 'en' | 'ur'): string` - Map to speech API codes
   - `getVoiceErrorMessage(code, lang): string` - Localized error messages
   - Add unit tests for each utility function

3. **Implement Voice Hook** (`frontend/src/hooks/useVoiceRecognition.ts`):
   - Browser compatibility detection (`isSupported` check)
   - Speech recognition initialization (store in useRef)
   - State management (useState for all states)
   - Event handlers: onstart, onresult, onerror, onend
   - Language detection logic
   - Error handling for all error types
   - Cleanup on unmount (useEffect return)
   - Export typed hook interface

### Phase 2: UI Component Integration

**Files to Modify**:
1. `frontend/src/app/chat/page.tsx` - Integrate voice UI
2. `frontend/src/app/globals.css` - Add voice animations

**Implementation Steps**:

1. **Import Voice Hook** (chat/page.tsx):
   - Add import for useVoiceRecognition
   - Add import for language detection utilities

2. **Add Voice State** (chat/page.tsx after line 30):
   - Add voiceError state
   - Initialize voice hook with config
   - Implement handleVoiceTranscript callback
   - Add useEffect to sync voice errors

3. **Add Voice Indicators** (chat/page.tsx before textarea):
   - Recording indicator (red pulsing with "Listening...")
   - Transcription preview (blue box with transcript)
   - Error display (red box with dismiss button)
   - Conditional rendering based on voice states

4. **Add Microphone Button** (chat/page.tsx in input area):
   - Position before Send button
   - Conditional on isVoiceSupported
   - State-based styling (gray/red/blue)
   - ARIA labels for accessibility
   - Click handler to start/stop recording
   - SVG microphone icon

5. **Add Voice Animations** (globals.css):
   - @keyframes pulse animation definition
   - .animate-pulse class for recording indicator
   - Ensure compatibility with Tailwind CSS

### Phase 3: Testing & Validation

**Unit Tests**:
- Test voice hook initialization
- Test browser support detection
- Test language detection utilities
- Test error message generation
- Mock Web Speech API for testing

**Integration Tests**:
- Test voice button appearance/hiding
- Test recording indicator display
- Test transcription preview
- Test error message display
- Test integration with existing chat

**End-to-End Tests**:
- Test complete voice command flow (English)
- Test complete voice command flow (Urdu)
- Test language auto-detection and switching
- Test error scenarios (permission denied, no speech)
- Test browser compatibility (Chrome, Edge, Firefox, Safari)

**Regression Tests**:
- Verify all existing text input functionality works
- Verify send button works
- Verify language toggle works
- Verify message display works
- Verify AI responses work
- Verify authentication works

### Phase 4: Documentation & Deployment

**Documentation Updates**:
1. Update CLAUDE.md:
   - Add voice commands feature section
   - Document browser requirements
   - Add troubleshooting guide
   - Include example voice commands

2. Add code comments:
   - JSDoc comments for all functions
   - Inline comments for complex logic
   - TypeScript interface documentation

**Deployment Steps**:
1. Create pull request with all changes
2. Code review and testing
3. Deploy to staging environment
4. Test on staging (all browsers)
5. Deploy to production
6. Monitor error rates and user feedback

**Post-Deployment Monitoring**:
- Track voice usage rate
- Monitor error rates by type
- Track browser distribution
- Collect user feedback
- Monitor performance metrics

## Files to Create/Modify

### New Files (3 total)

1. **`frontend/src/hooks/useVoiceRecognition.ts`** (~200 lines)
   - Custom React hook for voice recognition
   - Browser compatibility detection
   - Speech API lifecycle management
   - Event handlers and state management
   - Error handling and cleanup

2. **`frontend/src/types/speech.ts`** (~50 lines)
   - TypeScript interfaces for Web Speech API
   - Configuration interfaces
   - Hook return type interfaces
   - Error type definitions

3. **`frontend/src/utils/languageDetection.ts`** (~80 lines)
   - Urdu character detection
   - Language identification
   - Language code mapping
   - Error message localization

### Modified Files (2 total)

1. **`frontend/src/app/chat/page.tsx`** (4 additions, ~50 new lines)
   - Import voice hook (line 9)
   - Add voice state initialization (line 31-60)
   - Add voice indicators (line 240-280)
   - Add microphone button (line 260-290)

2. **`frontend/src/app/globals.css`** (1 addition, ~15 new lines)
   - Add pulse animation keyframes (line 51-60)
   - Add animate-pulse class definition

### Total Impact

- **New Files**: 3 files, ~330 lines
- **Modified Files**: 2 files, ~65 new lines
- **Total New Code**: ~395 lines
- **Backend Changes**: 0 files
- **Database Changes**: 0 migrations
- **API Changes**: 0 endpoints

## Validation Criteria

### Functional Requirements Validation

| Requirement | Validation Method | Success Criteria |
|-------------|------------------|------------------|
| FR-1: Voice Button | Visual inspection | Button visible in Chrome/Edge, hidden in Firefox |
| FR-2: Recording State | Manual testing | Indicator shows during recording with animation |
| FR-3: Live Preview | Manual testing | Transcription updates in real-time |
| FR-4: Auto-Send | End-to-end test | Message sends 300ms after transcription |
| FR-5: Language Detection | Integration test | UI switches on Urdu detection |
| FR-6: Bilingual Recognition | Manual testing | Both English and Urdu recognized |
| FR-7: Error Handling | Unit tests | All error types handled gracefully |
| FR-8: Browser Compatibility | Cross-browser test | Works in Chrome/Edge, hidden in Firefox |
| FR-9: Existing Functionality | Regression tests | All existing features work unchanged |
| FR-10: Mobile Responsive | Device testing | Works on mobile Chrome and Safari |

### Non-Functional Requirements Validation

| Requirement | Validation Method | Success Criteria |
|-------------|------------------|------------------|
| Performance | Performance testing | <500ms activation, <100ms updates |
| Accessibility | Accessibility audit | ARIA labels, keyboard shortcuts work |
| Security | Security review | No audio leaves browser, text via auth endpoint |
| Reliability | Error injection testing | Graceful failure, text input always works |
| Browser Support | Compatibility matrix | Matches expected support levels |

### User Acceptance Criteria

| Scenario | Validation Method | Success Criteria |
|----------|------------------|------------------|
| English Voice Command | User testing | Task created via voice in <5 seconds |
| Urdu Voice Command | User testing | Urdu recognized and UI switches correctly |
| Auto Language Detection | User testing | UI adapts to spoken language |
| Error Recovery | User testing | Clear errors, text fallback works |
| Browser Incompatibility | User testing | No confusion, text input works |

## Appendix: Technical Specifications

### Web Speech API Configuration

```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// Configuration
recognition.continuous = false;        // Stop after speech ends
recognition.interimResults = true;     // Show partial results
recognition.maxAlternatives = 1;       // Single best result
recognition.lang = 'en-US';           // Start language

// Event handlers
recognition.onstart = () => setIsRecording(true);
recognition.onend = () => setIsRecording(false);
recognition.onresult = handleResult;
recognition.onerror = handleError;
```

### Language Code Mapping

```typescript
const LANGUAGE_CODES = {
  en: 'en-US',  // English (United States)
  ur: 'ur-PK'   // Urdu (Pakistan)
};

const LANGUAGE_NAMES = {
  en: { en: 'English', ur: 'انگریزی' },
  ur: { en: 'Urdu', ur: 'اردو' }
};
```

### Error Code Mapping

```typescript
const ERROR_MESSAGES = {
  'not-allowed': {
    en: 'Microphone access denied. Please allow microphone permissions.',
    ur: 'مائیکروفون کی اجازت نہیں ہے۔ براہ کرم اجازت دیں۔'
  },
  'no-speech': {
    en: 'No speech detected. Please try again.',
    ur: 'آواز نہیں سنی گئی۔ دوبارہ کوشش کریں۔'
  },
  'audio-capture': {
    en: 'Microphone not found. Please check your device.',
    ur: 'مائیکروفون نہیں ملا۔ اپنا آلہ چیک کریں۔'
  },
  'network': {
    en: 'Network error. Please check your connection.',
    ur: 'نیٹ ورک خرابی۔ اپنا کنکشن چیک کریں۔'
  }
};
```

### Browser Detection

```typescript
function detectBrowserSupport(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (/Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)) return 'Chrome';
  if (/Edg/.test(ua)) return 'Edge';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Firefox/.test(ua)) return 'Firefox';
  if (/OPR/.test(ua)) return 'Opera';
  return 'Unknown';
}
```

### Unicode Character Ranges

```typescript
// Urdu/Arabic script detection
const URDU_REGEX = /[\u0600-\u06FF]/;

// Additional Unicode ranges for comprehensive support
const ARABIC_SUPPLEMENT = /[\u0750-\u077F]/;
const ARABIC_EXTENDED_A = /[\u08A0-\u08FF]/;
const ARABIC_PRESENTATION_FORMS_A = /[\uFB50-\uFDFF]/;
const ARABIC_PRESENTATION_FORMS_B = /[\uFE70-\uFEFF]/;

function containsUrdu(text: string): boolean {
  return URDU_REGEX.test(text);
}
```
