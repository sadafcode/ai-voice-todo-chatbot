# Implementation Tasks: Voice Commands for AI Chatbot

## Feature: Voice Input Capability
Enable users to manage tasks through spoken commands in English and Urdu with automatic language detection.

---

## Task Organization

Tasks are organized by implementation phase, following the dependency order defined in the implementation plan. Each phase builds upon the previous phase's deliverables.

---

## Phase 1: Setup and Type Definitions

**Goal**: Establish TypeScript interfaces and type definitions for voice recognition feature.

**Independent Test Criteria**:
- TypeScript compilation succeeds with no errors
- All interfaces properly exported and importable
- Window interface extensions recognized by IDE

### Tasks

- [ ] T001 [P] Create TypeScript interfaces file at frontend/src/types/speech.ts with Window interface extensions for Web Speech API (SpeechRecognition, webkitSpeechRecognition)
- [ ] T002 [P] Define VoiceRecognitionConfig interface in frontend/src/types/speech.ts with language, onTranscriptReady callback, and autoDetect properties
- [ ] T003 [P] Define UseVoiceRecognitionReturn interface in frontend/src/types/speech.ts with state properties (isRecording, isTranscribing, transcript, error, isSupported, detectedLanguage) and action methods (startRecording, stopRecording, resetTranscript)
- [ ] T004 [P] Define SpeechRecognitionErrorCode type in frontend/src/types/speech.ts with error codes: not-allowed, no-speech, audio-capture, network, aborted, not-supported
- [ ] T005 [P] Add JSDoc comments to all interfaces in frontend/src/types/speech.ts documenting parameters, return types, and usage examples

**Phase Completion Criteria**:
- All TypeScript types compile without errors
- Types are properly documented with JSDoc
- IDE provides autocomplete for all interfaces

---

## Phase 2: Language Detection Utilities

**Goal**: Implement language detection and localization utilities for voice feature.

**Independent Test Criteria**:
- containsUrdu() correctly identifies Urdu characters using Unicode regex
- detectLanguage() accurately determines English vs Urdu
- getLanguageCode() returns correct speech API codes (en-US, ur-PK)
- getVoiceErrorMessage() returns properly localized error messages

### Tasks

- [ ] T006 Create language detection utilities file at frontend/src/utils/languageDetection.ts
- [ ] T007 Implement containsUrdu() function in frontend/src/utils/languageDetection.ts to check for Urdu characters using Unicode range U+0600-U+06FF
- [ ] T008 Implement detectLanguage() function in frontend/src/utils/languageDetection.ts to return 'en' or 'ur' based on character analysis
- [ ] T009 Implement getLanguageCode() function in frontend/src/utils/languageDetection.ts to map 'en' to 'en-US' and 'ur' to 'ur-PK'
- [ ] T010 Implement getVoiceErrorMessage() function in frontend/src/utils/languageDetection.ts with localized error messages for all error codes in both English and Urdu
- [ ] T011 Add TypeScript types and JSDoc comments to all language utility functions in frontend/src/utils/languageDetection.ts

**Phase Completion Criteria**:
- All utility functions have unit tests (if testing requested)
- Functions handle edge cases (empty strings, mixed language, special characters)
- Error messages properly localized in English and Urdu

---

## Phase 3: Core Voice Recognition Hook

**Goal**: Implement custom React hook that encapsulates Web Speech API integration.

**Independent Test Criteria**:
- Hook properly initializes SpeechRecognition API
- Browser compatibility detection works (Chrome/Edge/Opera supported, Firefox unsupported)
- Recording state management is accurate (isRecording, isTranscribing)
- Event handlers properly respond to speech events (onstart, onresult, onerror, onend)
- Language detection triggers on final transcript
- Cleanup properly disposes resources on unmount

### Tasks

- [ ] T012 [US1] Create custom voice hook file at frontend/src/hooks/useVoiceRecognition.ts
- [ ] T013 [US1] Implement browser compatibility detection in frontend/src/hooks/useVoiceRecognition.ts checking for SpeechRecognition or webkitSpeechRecognition in window
- [ ] T014 [US1] Initialize state variables (isRecording, isTranscribing, transcript, error, detectedLanguage) using useState in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T015 [US1] Create recognitionRef using useRef to store SpeechRecognition instance in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T016 [US1] Implement useEffect hook to initialize SpeechRecognition with configuration (continuous: false, interimResults: true, maxAlternatives: 1) in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T017 [US1] Implement onstart event handler to set isRecording=true in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T018 [US1] Implement onresult event handler to update transcript with interim and final results in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T019 [US1] Implement language detection logic in onresult handler using detectLanguage() when final result received in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T020 [US1] Implement onTranscriptReady callback invocation with transcript and detected language in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T021 [US1] Implement onerror event handler with error code mapping using getVoiceErrorMessage() in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T022 [US1] Implement onend event handler to reset recording state in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T023 [US1] Implement startRecording() function to initialize and start SpeechRecognition with correct language code in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T024 [US1] Implement stopRecording() function to stop and clean up SpeechRecognition in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T025 [US1] Implement resetTranscript() function to clear transcript state in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T026 [US1] Implement cleanup function in useEffect return to abort recognition and remove event listeners in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T027 [US1] Add TypeScript return type annotation UseVoiceRecognitionReturn to hook in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T028 [US1] Add JSDoc comments documenting hook parameters, return values, and usage examples in frontend/src/hooks/useVoiceRecognition.ts

**Phase Completion Criteria**:
- Hook properly manages SpeechRecognition lifecycle
- All event handlers correctly update state
- Cleanup prevents memory leaks
- Hook works in supported browsers, gracefully fails in unsupported

---

## Phase 4: User Story 1 - Basic Voice Input Button (FR-1)

**User Story**: As a user, I want to see a microphone button so I can initiate voice input.

**Priority**: P1

**Independent Test Criteria**:
- Microphone button visible in supported browsers (Chrome, Edge, Opera)
- Button hidden in unsupported browsers (Firefox)
- Button properly styled with microphone icon
- Button has ARIA labels for accessibility
- Button disabled during message sending
- Button click triggers voice recording

### Tasks

- [ ] T029 [US1] Import useVoiceRecognition hook in frontend/src/app/chat/page.tsx
- [ ] T030 [US1] Import language detection utilities in frontend/src/app/chat/page.tsx
- [ ] T031 [US1] Initialize useVoiceRecognition hook with language preference and onTranscriptReady callback in frontend/src/app/chat/page.tsx (after existing state declarations around line 31)
- [ ] T032 [US1] Add voiceError state variable using useState in frontend/src/app/chat/page.tsx
- [ ] T033 [US1] Implement handleVoiceTranscript callback function that calls setInputMessage() and schedules auto-send with 300ms delay in frontend/src/app/chat/page.tsx
- [ ] T034 [US1] Add microphone button JSX in input area before Send button in frontend/src/app/chat/page.tsx (around line 280-290)
- [ ] T035 [US1] Add conditional rendering to show microphone button only when isSupported=true in frontend/src/app/chat/page.tsx
- [ ] T036 [US1] Add SVG microphone icon to button in frontend/src/app/chat/page.tsx
- [ ] T037 [US1] Add click handler to microphone button to toggle recording (startRecording/stopRecording) in frontend/src/app/chat/page.tsx
- [ ] T038 [US1] Add ARIA labels to microphone button (aria-label="Record voice message" in English, "آواز ریکارڈ کریں" in Urdu) in frontend/src/app/chat/page.tsx
- [ ] T039 [US1] Add disabled state to microphone button when isLoading=true in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Button visible in Chrome/Edge/Opera
- ✅ Button hidden in Firefox
- ✅ Button has clear microphone icon
- ✅ Button accessible via keyboard (tab navigation)
- ✅ Button disabled during message sending
- ✅ ARIA labels present for screen readers

---

## Phase 5: User Story 2 - Recording State Indicator (FR-2)

**User Story**: As a user, I want to see clear visual feedback when the system is listening to my voice.

**Priority**: P1

**Independent Test Criteria**:
- Recording indicator appears when isRecording=true
- Indicator displays "Listening..." in English or "سن رہا ہے..." in Urdu
- Indicator uses pulsing animation
- Microphone button changes color to red during recording
- Recording stops when button clicked again
- Recording automatically stops when speech ends

### Tasks

- [ ] T040 [US2] Add @keyframes pulse animation definition in frontend/src/app/globals.css for pulsing effect (scale 1.0 to 1.1)
- [ ] T041 [US2] Add recording indicator JSX before textarea in frontend/src/app/chat/page.tsx (around line 240)
- [ ] T042 [US2] Add conditional rendering to show recording indicator only when isRecording=true in frontend/src/app/chat/page.tsx
- [ ] T043 [US2] Add bilingual text for recording indicator: "Listening..." (English) or "سن رہا ہے..." (Urdu) based on current language in frontend/src/app/chat/page.tsx
- [ ] T044 [US2] Add animate-pulse CSS class to recording indicator in frontend/src/app/chat/page.tsx
- [ ] T045 [US2] Add conditional styling to microphone button to turn red (bg-red-500) when isRecording=true in frontend/src/app/chat/page.tsx
- [ ] T046 [US2] Add conditional styling to microphone button to show blue (bg-blue-500) when isTranscribing=true in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Indicator appears when recording starts
- ✅ Indicator shows "Listening..." in correct language
- ✅ Pulsing animation is smooth and noticeable
- ✅ Button color changes to red during recording
- ✅ Clicking button again stops recording
- ✅ Recording automatically stops when user finishes speaking

---

## Phase 6: User Story 3 - Live Transcription Preview (FR-3)

**User Story**: As a user, I want to see the transcribed text in real-time so I know what will be sent.

**Priority**: P1

**Independent Test Criteria**:
- Transcription preview appears below instructions area
- Preview updates in real-time as speech recognized
- Preview displays exact text that will be sent
- Urdu text uses Noto Nastaliq Urdu font
- Preview applies correct text direction (LTR for English, RTL for Urdu)
- Preview visible for at least 300ms before auto-send

### Tasks

- [ ] T047 [US3] Add transcription preview JSX below recording indicator in frontend/src/app/chat/page.tsx (around line 260)
- [ ] T048 [US3] Add conditional rendering to show preview only when transcript.length > 0 in frontend/src/app/chat/page.tsx
- [ ] T049 [US3] Display transcript text in preview with proper styling (blue background, rounded corners, padding) in frontend/src/app/chat/page.tsx
- [ ] T050 [US3] Add conditional font-urdu class when detectedLanguage='ur' in frontend/src/app/chat/page.tsx
- [ ] T051 [US3] Add conditional dir="rtl" attribute when detectedLanguage='ur' in frontend/src/app/chat/page.tsx
- [ ] T052 [US3] Add conditional dir="ltr" attribute when detectedLanguage='en' in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Preview appears below instructions
- ✅ Preview updates in real-time during speech
- ✅ Preview shows exact text that will be sent
- ✅ Urdu text renders with correct font
- ✅ Text direction correct (RTL for Urdu, LTR for English)
- ✅ Preview visible for 300ms before auto-send

---

## Phase 7: User Story 4 - Auto-Send Behavior (FR-4)

**User Story**: As a user, I want my voice message to be automatically sent after I stop speaking, so I don't need to tap the send button.

**Priority**: P1

**Independent Test Criteria**:
- Message automatically sent 300ms after transcription completes
- User sees transcribed text briefly before sending
- Auto-send uses same flow as manual Send button
- Loading indicator appears during AI processing
- User message appears in chat history immediately
- AI response appears when processing completes

### Tasks

- [ ] T053 [US4] Implement 300ms setTimeout delay in handleVoiceTranscript callback before calling sendMessage() in frontend/src/app/chat/page.tsx
- [ ] T054 [US4] Store timeout ID in useRef to allow cancellation if user types before auto-send in frontend/src/app/chat/page.tsx
- [ ] T055 [US4] Clear timeout on component unmount to prevent memory leaks in frontend/src/app/chat/page.tsx
- [ ] T056 [US4] Ensure handleVoiceTranscript calls existing sendMessage() function (no duplication) in frontend/src/app/chat/page.tsx
- [ ] T057 [US4] Reset transcript state after auto-send completes in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Transcription sent automatically after 300ms delay
- ✅ User sees transcription briefly before sending
- ✅ Same message flow as manual Send button
- ✅ Loading indicator shows during AI processing
- ✅ User message appears in history immediately
- ✅ AI response appears when ready

---

## Phase 8: User Story 5 - Language Auto-Detection (FR-5)

**User Story**: As a user, I want the interface to automatically detect and switch to my spoken language, so I don't need to manually change settings.

**Priority**: P2

**Independent Test Criteria**:
- System detects Urdu characters using Unicode range U+0600-U+06FF
- UI automatically switches language if detected differs from current
- Language switch includes font, text direction (RTL/LTR), and UI elements
- Detection works regardless of starting language
- Language setting persists for subsequent messages
- Manual language toggle remains functional

### Tasks

- [ ] T058 [US5] Add logic in handleVoiceTranscript to compare detectedLanguage with current UI language in frontend/src/app/chat/page.tsx
- [ ] T059 [US5] Implement automatic language switch by calling setLanguage() when detectedLanguage differs from current language in frontend/src/app/chat/page.tsx
- [ ] T060 [US5] Ensure language switch triggers font change (font-urdu class applied) in frontend/src/app/chat/page.tsx
- [ ] T061 [US5] Ensure language switch triggers text direction change (dir="rtl" applied) in frontend/src/app/chat/page.tsx
- [ ] T062 [US5] Ensure language switch triggers UI element text change (buttons, labels) in frontend/src/app/chat/page.tsx
- [ ] T063 [US5] Verify manual language toggle button continues to work alongside auto-detection in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Urdu characters detected using correct Unicode range
- ✅ UI switches automatically when Urdu detected
- ✅ Font, direction, and UI elements all switch together
- ✅ Detection works from English→Urdu and Urdu→English
- ✅ Language persists for rest of conversation
- ✅ Manual toggle still works

---

## Phase 9: User Story 6 - Bilingual Voice Recognition (FR-6)

**User Story**: As a user, I want to speak in either English or Urdu and have the system understand me correctly.

**Priority**: P2

**Independent Test Criteria**:
- System recognizes spoken English with standard accuracy
- System recognizes spoken Urdu with standard accuracy
- Initial recognition language matches current UI setting
- System switches recognition language if auto-detection identifies different language
- Mixed-language commands handled gracefully
- Voice quality requirements match phone call clarity

### Tasks

- [ ] T064 [US6] Verify useVoiceRecognition hook initializes with language code matching current UI language (en-US or ur-PK) in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T065 [US6] Implement logic to update recognition language when UI language changes in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T066 [US6] Test English voice recognition with various commands ("show my tasks", "add task", "delete task") in supported browsers
- [ ] T067 [US6] Test Urdu voice recognition with various commands ("میرے کام دکھائیں", "کام شامل کریں", "کام حذف کریں") in supported browsers
- [ ] T068 [US6] Document recommended voice quality and environment conditions (quiet space, clear speech) in CLAUDE.md

**Acceptance Criteria**:
- ✅ English recognition works with standard Web Speech API accuracy
- ✅ Urdu recognition works with standard Web Speech API accuracy
- ✅ Initial language matches UI setting
- ✅ Recognition language switches with UI language
- ✅ Mixed-language transcriptions handled gracefully
- ✅ Voice quality requirements documented

---

## Phase 10: User Story 7 - Error Handling (FR-7)

**User Story**: As a user, I want clear error messages when voice recognition fails, and I want text input to always work as a fallback.

**Priority**: P1

**Independent Test Criteria**:
- Permission denied error shows: "Microphone access denied. Please allow microphone permissions." (localized)
- No speech error shows: "No speech detected. Please try again." (localized)
- Microphone not found error shows: "Microphone not found. Please check your device." (localized)
- Network error shows: "Network error. Please check your connection." (localized)
- All error messages are dismissible with X button
- Errors don't affect text input functionality
- User can retry voice input after dismissing error

### Tasks

- [ ] T069 [US7] Add error display JSX above textarea in frontend/src/app/chat/page.tsx (around line 270)
- [ ] T070 [US7] Add conditional rendering to show error only when error state is not null in frontend/src/app/chat/page.tsx
- [ ] T071 [US7] Display error message in red box with rounded corners and padding in frontend/src/app/chat/page.tsx
- [ ] T072 [US7] Add dismiss button (X icon) to error display in frontend/src/app/chat/page.tsx
- [ ] T073 [US7] Implement dismiss handler to clear error state when X clicked in frontend/src/app/chat/page.tsx
- [ ] T074 [US7] Verify all error codes have localized messages in both English and Urdu in frontend/src/utils/languageDetection.ts
- [ ] T075 [US7] Test that text input remains functional when voice errors occur in frontend/src/app/chat/page.tsx
- [ ] T076 [US7] Test that user can retry voice recording after dismissing error in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Permission denied error displays correct message in current language
- ✅ No speech error displays correct message in current language
- ✅ Microphone not found error displays correct message in current language
- ✅ Network error displays correct message in current language
- ✅ All errors have dismiss button (X icon)
- ✅ Errors don't prevent text input from working
- ✅ User can retry after error dismissed

---

## Phase 11: User Story 8 - Browser Compatibility (FR-8)

**User Story**: As a user in an unsupported browser, I want the app to work normally without broken features.

**Priority**: P1

**Independent Test Criteria**:
- Web Speech API availability detected correctly in all browsers
- Microphone button appears only in Chrome, Edge, Opera
- Microphone button hidden completely in Firefox
- No console errors in any browser
- No broken UI elements in any browser
- Text input works perfectly in all browsers

### Tasks

- [ ] T077 [US8] Verify browser compatibility detection in useVoiceRecognition hook checks for both SpeechRecognition and webkitSpeechRecognition in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T078 [US8] Test that isSupported returns true in Chrome 25+ in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T079 [US8] Test that isSupported returns true in Edge 79+ in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T080 [US8] Test that isSupported returns true in Opera 27+ in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T081 [US8] Test that isSupported returns false in Firefox in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T082 [US8] Verify microphone button is hidden when isSupported=false in frontend/src/app/chat/page.tsx
- [ ] T083 [US8] Test that no console errors occur in Firefox when voice feature disabled in frontend/src/app/chat/page.tsx
- [ ] T084 [US8] Verify text input works identically in all browsers regardless of voice support in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Browser support detected correctly
- ✅ Button visible only in Chrome, Edge, Opera
- ✅ Button completely hidden in Firefox
- ✅ Zero console errors in any browser
- ✅ No broken UI in any browser
- ✅ Text input works perfectly everywhere

---

## Phase 12: User Story 9 - Existing Functionality Preservation (FR-9)

**User Story**: As an existing user, I want all my current features to work exactly as before, with voice as an optional addition.

**Priority**: P1 (Critical)

**Independent Test Criteria**:
- Text input via textarea works identically to before
- Send button works identically to before
- Language toggle button works identically to before
- Enter key to send (Shift+Enter for new line) works as before
- All 5 MCP tools work via voice commands
- All 5 MCP tools work via text commands as before
- Message history unchanged
- Authentication unchanged
- Urdu font rendering unchanged

### Tasks

- [ ] T085 [US9] Verify textarea input functionality unchanged by testing text message sending in frontend/src/app/chat/page.tsx
- [ ] T086 [US9] Verify Send button functionality unchanged by testing manual send in frontend/src/app/chat/page.tsx
- [ ] T087 [US9] Verify language toggle button functionality unchanged by testing manual language switch in frontend/src/app/chat/page.tsx
- [ ] T088 [US9] Verify Enter key to send and Shift+Enter for new line work as before in frontend/src/app/chat/page.tsx
- [ ] T089 [US9] Test all 5 MCP tools (add_task, list_tasks, complete_task, delete_task, update_task) work via voice commands
- [ ] T090 [US9] Test all 5 MCP tools work via text commands exactly as before
- [ ] T091 [US9] Verify message history display unchanged by checking chat history rendering in frontend/src/app/chat/page.tsx
- [ ] T092 [US9] Verify loading states and error handling unchanged in frontend/src/app/chat/page.tsx
- [ ] T093 [US9] Verify authentication flow unchanged by testing login/logout in frontend
- [ ] T094 [US9] Verify Urdu font (Noto Nastaliq Urdu) rendering unchanged in frontend/src/app/layout.tsx
- [ ] T095 [US9] Verify RTL layout support unchanged for Urdu text in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Text input works identically to before
- ✅ Send button works identically to before
- ✅ Language toggle works identically to before
- ✅ Keyboard shortcuts work as before
- ✅ All MCP tools work via voice
- ✅ All MCP tools work via text as before
- ✅ Message display unchanged
- ✅ Authentication unchanged
- ✅ Urdu rendering unchanged

---

## Phase 13: User Story 10 - Mobile Responsiveness (FR-10)

**User Story**: As a mobile user, I want to use voice input on my phone with a touch-friendly interface.

**Priority**: P2

**Independent Test Criteria**:
- Microphone button large enough for touch (minimum 48x48px)
- Button works with touch interactions (tap to start/stop)
- Recording indicator visible on mobile screens
- Transcription preview readable on mobile
- Voice input works on Chrome mobile (Android)
- Voice input works on Safari mobile (iOS) with English only
- Layout adapts appropriately for small screens

### Tasks

- [ ] T096 [US10] Set microphone button minimum size to 48x48px using Tailwind classes (w-12 h-12) in frontend/src/app/chat/page.tsx
- [ ] T097 [US10] Add touch-friendly padding and margin to microphone button in frontend/src/app/chat/page.tsx
- [ ] T098 [US10] Test microphone button tap interaction on Android Chrome browser
- [ ] T099 [US10] Test microphone button tap interaction on iOS Safari browser
- [ ] T100 [US10] Verify recording indicator visible and readable on mobile screen sizes in frontend/src/app/chat/page.tsx
- [ ] T101 [US10] Verify transcription preview text size readable on mobile (min 14px font) in frontend/src/app/chat/page.tsx
- [ ] T102 [US10] Test complete voice command flow on Android Chrome
- [ ] T103 [US10] Test complete voice command flow on iOS Safari (English only)
- [ ] T104 [US10] Verify layout adapts correctly on screen sizes from 320px to 768px in frontend/src/app/chat/page.tsx

**Acceptance Criteria**:
- ✅ Button at least 48x48px (touch-friendly)
- ✅ Button responds to tap events
- ✅ Recording indicator visible on mobile
- ✅ Transcription readable on small screens
- ✅ Works on Android Chrome
- ✅ Works on iOS Safari (English only)
- ✅ Layout adapts to mobile screens

---

## Phase 14: Polish and Cross-Cutting Concerns

**Goal**: Finalize documentation, accessibility, and deployment preparation.

**Independent Test Criteria**:
- CLAUDE.md updated with voice feature documentation
- Browser compatibility documented
- Troubleshooting guide complete
- Accessibility features verified (ARIA labels, keyboard shortcuts, screen reader)
- All code has proper comments
- No console warnings or errors
- Performance metrics within budget

### Tasks

- [ ] T105 [P] Update CLAUDE.md with voice commands feature section including feature overview, browser requirements, and usage examples
- [ ] T106 [P] Add troubleshooting section to CLAUDE.md for common voice issues (permission denied, no speech, browser not supported)
- [ ] T107 [P] Document example voice commands in CLAUDE.md for both English and Urdu
- [ ] T108 [P] Verify all ARIA labels present on microphone button and recording indicator in frontend/src/app/chat/page.tsx
- [ ] T109 [P] Implement keyboard shortcut (Ctrl/Cmd + M) to toggle voice recording in frontend/src/app/chat/page.tsx
- [ ] T110 [P] Test screen reader announces recording state changes in frontend/src/app/chat/page.tsx
- [ ] T111 [P] Add inline code comments for complex logic in frontend/src/hooks/useVoiceRecognition.ts
- [ ] T112 [P] Add inline code comments for voice integration in frontend/src/app/chat/page.tsx
- [ ] T113 [P] Run browser console check to ensure zero warnings or errors in all supported browsers
- [ ] T114 [P] Verify page load time increase is less than 100ms using Chrome DevTools Performance
- [ ] T115 [P] Verify memory usage during recording is less than 5MB using Chrome DevTools Memory
- [ ] T116 [P] Test focus management maintains proper tab order with voice button in frontend/src/app/chat/page.tsx

**Phase Completion Criteria**:
- Documentation complete and accurate
- Accessibility fully implemented and tested
- Performance within specified budgets
- Code properly commented
- Zero console errors or warnings

---

## Dependencies

### Phase Dependencies (Sequential Order)

```
Phase 1 (Setup) → Phase 2 (Language Utils) → Phase 3 (Voice Hook) → All User Stories
                                                                         ↓
                                                            Phase 14 (Polish)
```

**Critical Path**:
1. Phase 1 (Setup) must complete before Phase 2
2. Phase 2 (Language Utils) must complete before Phase 3
3. Phase 3 (Voice Hook) must complete before any User Story phase
4. User Story phases (4-13) can be implemented in parallel after Phase 3
5. Phase 14 (Polish) requires all User Story phases complete

### User Story Independence

Most user stories are independent and can be implemented in parallel once Phase 3 completes:

- **Independent**: US1, US2, US3, US4, US6, US7, US8, US10 (can be done in parallel)
- **Depends on US1-4**: US5 (auto-detection requires basic voice working)
- **Verification Only**: US9 (tests existing functionality, no implementation)

---

## Parallel Execution Opportunities

### Recommended Parallel Groups

**Group A** (After Phase 3 completes):
- T029-T039 (US1: Voice Button)
- T040-T046 (US2: Recording Indicator)
- T047-T052 (US3: Transcription Preview)

**Group B** (After Group A completes):
- T053-T057 (US4: Auto-Send)
- T064-T068 (US6: Bilingual Recognition)
- T069-T076 (US7: Error Handling)

**Group C** (Anytime after Phase 3):
- T077-T084 (US8: Browser Compatibility)
- T096-T104 (US10: Mobile Responsiveness)
- T105-T116 (Phase 14: Polish)

**Verification Group** (After all implementation):
- T085-T095 (US9: Regression Testing)

---

## Implementation Strategy

### MVP Scope (Minimum Viable Product)

**First Iteration** - Basic voice input working:
- Phase 1: Type Definitions (T001-T005)
- Phase 2: Language Utilities (T006-T011)
- Phase 3: Voice Hook (T012-T028)
- US1: Voice Button (T029-T039)
- US2: Recording Indicator (T040-T046)
- US7: Error Handling (T069-T076)

**Estimated Time**: 4-6 hours

### Second Iteration - Complete User Experience:
- US3: Transcription Preview (T047-T052)
- US4: Auto-Send (T053-T057)
- US5: Language Auto-Detection (T058-T063)
- US8: Browser Compatibility (T077-T084)

**Estimated Time**: 2-3 hours

### Third Iteration - Polish and Testing:
- US6: Bilingual Recognition Testing (T064-T068)
- US9: Regression Testing (T085-T095)
- US10: Mobile Responsiveness (T096-T104)
- Phase 14: Documentation and Polish (T105-T116)

**Estimated Time**: 2-3 hours

### Total Estimated Time: 8-12 hours

---

## Task Summary

### Total Tasks: 116

### Tasks by Phase:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Language Utils): 6 tasks
- Phase 3 (Voice Hook): 17 tasks
- US1 (Voice Button): 11 tasks
- US2 (Recording Indicator): 7 tasks
- US3 (Transcription Preview): 6 tasks
- US4 (Auto-Send): 5 tasks
- US5 (Language Auto-Detection): 6 tasks
- US6 (Bilingual Recognition): 5 tasks
- US7 (Error Handling): 8 tasks
- US8 (Browser Compatibility): 8 tasks
- US9 (Existing Functionality): 11 tasks
- US10 (Mobile Responsiveness): 9 tasks
- Phase 14 (Polish): 12 tasks

### Parallel Opportunities: ~60 tasks can be done in parallel (marked with [P])

### Files to Create: 3
- frontend/src/types/speech.ts
- frontend/src/utils/languageDetection.ts
- frontend/src/hooks/useVoiceRecognition.ts

### Files to Modify: 2
- frontend/src/app/chat/page.tsx
- frontend/src/app/globals.css

### Backend Changes: 0
### Database Changes: 0

---

## Success Criteria

### Feature Complete When:
- ✅ All 116 tasks completed
- ✅ Voice input works in supported browsers (Chrome, Edge, Opera)
- ✅ Voice input gracefully hidden in unsupported browsers (Firefox)
- ✅ Both English and Urdu voice recognition working
- ✅ Language auto-detection functioning correctly
- ✅ All error scenarios handled with clear messages
- ✅ Text input functionality completely preserved
- ✅ Mobile-responsive on Android and iOS
- ✅ Zero console errors in any browser
- ✅ Documentation complete in CLAUDE.md
- ✅ Performance within specified budgets

### Quality Gates:
- TypeScript compilation with zero errors
- Zero console warnings or errors in all browsers
- Page load increase <100ms
- Memory usage during recording <5MB
- All existing features work identically (regression pass)
- Voice commands successfully create/manage tasks

---

## Notes

### Critical Constraints:
- **Frontend-only feature**: No backend changes allowed
- **No database changes**: Voice transcriptions stored as regular messages
- **Backward compatible**: All existing features must work identically
- **Zero cost**: Uses free browser API (Web Speech API)
- **Graceful degradation**: Must work (without voice) in all browsers

### Testing Recommendations:
- Test in Chrome, Edge, Firefox, Safari (desktop)
- Test on Android Chrome, iOS Safari (mobile)
- Test with quiet and noisy environments
- Test English and Urdu voice commands
- Test all error scenarios (permission denied, no speech, etc.)
- Perform full regression test of existing features

### Performance Monitoring:
- Monitor page load time (should remain <100ms increase)
- Monitor memory usage during recording (should be <5MB)
- Monitor voice activation latency (should be <500ms)
- Monitor transcription update frequency (should be <100ms)

---

**Tasks Generated**: 2026-01-14
**Feature**: Voice Commands for AI Chatbot (002-voice-commands)
**Status**: Ready for Implementation
**Next Step**: Begin Phase 1 (Setup and Type Definitions)
