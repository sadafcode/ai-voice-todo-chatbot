---
name: "voice-commands-chatbot"
description: "Enable voice-based interaction for the AI chatbot. Use when the user wants to speak instead of typing, requests voice input, microphone support, speech recognition, Urdu or English voice commands, or hands-free task management."
version: "1.0.0"
---

# Voice Commands for AI Chatbot Skill

## When to Use
Activate this skill when:
- User asks to **use voice instead of typing**
- User mentions **microphone**, **speech**, or **voice commands**
- User wants to **speak in English or Urdu**
- User requests **hands-free task management**
- User experiences issues with **voice recognition or permissions**
- User asks about **browser support for voice input**

---

## Capabilities
- Voice input using **Web Speech API**
- Automatic **language detection (English / Urdu)**
- Real-time **live transcription preview**
- **Auto-send** message after speech ends
- **Bilingual UI feedback** (English & Urdu)
- Graceful fallback to text input in unsupported browsers
- No backend or database changes required

---

## Supported Languages
- **English** (`en-US`)
- **Urdu** (`ur-PK`)

Language is detected automatically using Unicode analysis
(U+0600–U+06FF for Urdu).

---

## Supported Browsers
✅ Chrome
✅ Edge
✅ Opera

❌ Firefox (voice hidden automatically)
⚠️ Safari (limited support, English only on mobile)

---

## Procedure (Internal Logic)

1. Detect browser support for `SpeechRecognition`
2. Initialize recognition with current UI language
3. Start recording when microphone button is pressed
4. Show visual **Listening indicator**
5. Display **live transcription** while user speaks
6. Detect language on final transcript
7. Auto-switch UI language if needed
8. Auto-send message after **300ms delay**
9. Handle and localize errors
10. Clean up recognition resources safely

---

## Error Handling Rules
Map speech errors to localized messages:

| Error Code        | English Message                                      | Urdu Message |
|------------------|------------------------------------------------------|-------------|
| not-allowed      | Microphone access denied                             | مائیکروفون کی اجازت نہیں ملی |
| no-speech        | No speech detected                                   | کوئی آواز نہیں ملی |
| audio-capture    | Microphone not found                                 | مائیکروفون دستیاب نہیں |
| network          | Network error                                        | نیٹ ورک کا مسئلہ |
| not-supported    | Voice not supported in this browser                  | یہ براؤزر آواز کو سپورٹ نہیں کرتا |

Errors must:
- Be dismissible
- Never block text input
- Allow retry after dismissal

---

## UI Behavior Rules
- Show microphone button **only if supported**
- Button turns **red** while recording
- Button turns **blue** while transcribing
- Show pulsing **Listening… / سن رہا ہے…**
- Apply **RTL + Noto Nastaliq Urdu** font for Urdu
- Maintain keyboard and screen-reader accessibility

---

## Output Format
Voice input must behave **exactly like text input**.

- Transcription becomes the message text
- Message goes through existing `sendMessage()` flow
- Appears instantly in chat history
- AI response generated normally
- MCP tools triggered identically (voice or text)

---

## Example Voice Commands

### English
- "Show my tasks"
- "Add a new task to buy groceries"
- "Delete task number three"
- "Mark the homework task as completed"

### Urdu
- "میرے کام دکھائیں"
- "نیا کام شامل کریں"
- "تیسرا کام حذف کریں"
- "یہ کام مکمل کر دیں"

---

## Constraints
- **Frontend-only**
- **Zero cost** (Web Speech API)
- **Backward compatible**
- **No backend changes**
- **No database changes**
- **Text input must always work**

---

## Do Not
- Do NOT break existing chat behavior
- Do NOT block text input due to voice errors
- Do NOT show microphone in unsupported browsers
- Do NOT store audio or voice data

---

## Success Criteria
- Voice works in supported browsers
- English & Urdu recognized correctly
- Auto-detection switches UI language
- Errors are clear and localized
- Existing features remain unchanged
- Mobile experience is touch-friendly
- Zero console errors

---

**Skill Type**: Frontend Interaction
**Activation Style**: Contextual (voice / speech / microphone intent)
**Maintenance**: Low
**Risk Level**: Low (graceful degradation)
