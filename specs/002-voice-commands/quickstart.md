# Voice Commands: Implementation Quickstart Guide

## Quick Reference

**Branch**: `002-voice-commands`
**Status**: Ready for implementation
**Estimated Time**: 8-12 hours
**Backend Changes**: None
**Database Changes**: None

---

## Prerequisites Checklist

- [ ] Read the full specification: `specs/002-voice-commands/spec.md`
- [ ] Review the implementation plan: `specs/002-voice-commands/plan.md`
- [ ] Understand existing chat interface: `frontend/src/app/chat/page.tsx`
- [ ] Node.js 18+ installed
- [ ] Frontend dev server running (`npm run dev` in frontend/)
- [ ] Chrome or Edge browser for testing (Web Speech API support)

---

## Implementation Order

### Phase 1: Create Type Definitions (~30 mins)

1. **Create `frontend/src/types/speech.ts`**
   - Window interface extensions
   - VoiceRecognitionConfig interface
   - UseVoiceRecognitionReturn interface
   - SpeechRecognitionErrorCode type
   - See contract: `specs/002-voice-commands/contracts/voice-hook-contract.ts`

   **Quick Start**:
   ```typescript
   // Extend Window interface
   declare global {
     interface Window {
       SpeechRecognition: typeof SpeechRecognition;
       webkitSpeechRecognition: typeof SpeechRecognition;
     }
   }

   // Define interfaces (copy from contract file)
   export interface VoiceRecognitionConfig { ... }
   export interface UseVoiceRecognitionReturn { ... }
   ```

### Phase 2: Create Language Utilities (~1 hour)

2. **Create `frontend/src/utils/languageDetection.ts`**
   - `containsUrdu(text: string): boolean`
   - `detectLanguage(text: string): 'en' | 'ur'`
   - `getLanguageCode(lang: 'en' | 'ur'): string`
   - `getVoiceErrorMessage(code: string, lang: 'en' | 'ur'): string`

   **Quick Start**:
   ```typescript
   // Urdu detection using Unicode range
   export const containsUrdu = (text: string): boolean => {
     return /[\u0600-\u06FF]/.test(text);
   };

   export const detectLanguage = (text: string): 'en' | 'ur' => {
     return containsUrdu(text) ? 'ur' : 'en';
   };

   export const getLanguageCode = (lang: 'en' | 'ur'): string => {
     return lang === 'en' ? 'en-US' : 'ur-PK';
   };

   // Error messages object (see plan.md for complete list)
   export const getVoiceErrorMessage = (code: string, lang: 'en' | 'ur'): string => {
     const messages = { /* ... error messages ... */ };
     return messages[code]?.[lang] || messages['network'][lang];
   };
   ```

### Phase 3: Create Voice Recognition Hook (~3-4 hours)

3. **Create `frontend/src/hooks/useVoiceRecognition.ts`**
   - Browser compatibility detection
   - Speech recognition initialization
   - Event handlers (onstart, onresult, onerror, onend)
   - State management
   - Cleanup on unmount

   **Quick Start**:
   ```typescript
   import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
   import { detectLanguage, getLanguageCode, getVoiceErrorMessage } from '@/utils/languageDetection';
   import type { VoiceRecognitionConfig, UseVoiceRecognitionReturn } from '@/types/speech';

   export function useVoiceRecognition(config: VoiceRecognitionConfig): UseVoiceRecognitionReturn {
     // State
     const [isRecording, setIsRecording] = useState(false);
     const [isTranscribing, setIsTranscribing] = useState(false);
     const [transcript, setTranscript] = useState('');
     const [error, setError] = useState<string | null>(null);
     const [detectedLanguage, setDetectedLanguage] = useState<'en' | 'ur' | null>(null);

     // Browser support check
     const isSupported = useMemo(() => {
       return typeof window !== 'undefined' &&
              ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
     }, []);

     // Recognition instance
     const recognitionRef = useRef<SpeechRecognition | null>(null);

     // Initialize recognition
     useEffect(() => {
       if (!isSupported) return;

       const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
       recognitionRef.current = new SpeechRecognitionAPI();

       const recognition = recognitionRef.current;
       recognition.continuous = false;
       recognition.interimResults = true;
       recognition.maxAlternatives = 1;
       recognition.lang = getLanguageCode(config.language);

       // Event handlers
       recognition.onstart = () => {
         setIsRecording(true);
         setError(null);
       };

       recognition.onresult = (event) => {
         const result = event.results[event.results.length - 1];
         const transcriptText = result[0].transcript;

         if (result.isFinal) {
           setTranscript(transcriptText);
           setIsRecording(false);
           setIsTranscribing(true);

           // Detect language
           const lang = config.autoDetect ? detectLanguage(transcriptText) : null;
           setDetectedLanguage(lang);

           // Callback
           config.onTranscriptReady(transcriptText, lang);
         } else {
           // Interim results
           setTranscript(transcriptText);
         }
       };

       recognition.onerror = (event) => {
         const message = getVoiceErrorMessage(event.error, config.language);
         setError(message);
         setIsRecording(false);
         setIsTranscribing(false);
       };

       recognition.onend = () => {
         setIsRecording(false);
       };

       // Cleanup
       return () => {
         recognition.abort();
       };
     }, [isSupported, config]);

     // Actions
     const startRecording = useCallback(() => {
       if (!recognitionRef.current) return;
       setTranscript('');
       setError(null);
       recognitionRef.current.start();
     }, []);

     const stopRecording = useCallback(() => {
       if (!recognitionRef.current) return;
       recognitionRef.current.stop();
     }, []);

     const resetTranscript = useCallback(() => {
       setTranscript('');
       setIsTranscribing(false);
     }, []);

     return {
       isRecording,
       isTranscribing,
       transcript,
       error,
       isSupported,
       detectedLanguage,
       startRecording,
       stopRecording,
       resetTranscript
     };
   }
   ```

### Phase 4: Integrate with Chat UI (~2-3 hours)

4. **Modify `frontend/src/app/chat/page.tsx`**

   **Step 4.1: Add imports** (after line 9):
   ```typescript
   import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
   ```

   **Step 4.2: Add voice state** (after line 30):
   ```typescript
   const [voiceError, setVoiceError] = useState<string | null>(null);

   // Voice recognition hook
   const {
     isRecording,
     isTranscribing,
     transcript,
     error: voiceRecError,
     isSupported: isVoiceSupported,
     startRecording,
     stopRecording,
     resetTranscript,
     detectedLanguage
   } = useVoiceRecognition({
     language: language,
     onTranscriptReady: handleVoiceTranscript,
     autoDetect: true
   });

   // Handle voice transcript
   const handleVoiceTranscript = useCallback((text: string, lang: 'en' | 'ur' | null) => {
     if (text.trim()) {
       // Update language if auto-detected differently
       if (lang && lang !== language) {
         setLanguage(lang);
       }

       // Set transcript to input field
       setInputMessage(text);

       // Auto-send after brief preview (300ms for user feedback)
       setTimeout(() => {
         sendMessage();
         resetTranscript();
       }, 300);
     }
   }, [language, sendMessage, resetTranscript]);

   // Sync voice errors to state
   useEffect(() => {
     if (voiceRecError) {
       setVoiceError(voiceRecError);
     }
   }, [voiceRecError]);
   ```

   **Step 4.3: Add voice indicators** (before textarea, around line 240):
   ```typescript
   {/* Voice Recording Indicator */}
   {isRecording && (
     <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse">
       <div className="w-3 h-3 bg-red-500 rounded-full" />
       <span className="text-red-700 font-medium">
         {language === 'en' ? 'Listening...' : 'سن رہا ہے...'}
       </span>
     </div>
   )}

   {/* Transcription Preview */}
   {isTranscribing && transcript && (
     <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
       <p className={`text-blue-700 text-sm ${containsUrdu(transcript) ? 'font-urdu' : ''}`}>
         {transcript}
       </p>
     </div>
   )}

   {/* Voice Error Display */}
   {voiceError && (
     <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
       <span className="text-red-700 text-sm">{voiceError}</span>
       <button
         onClick={() => setVoiceError(null)}
         className="text-red-500 hover:text-red-700"
       >
         ✕
       </button>
     </div>
   )}
   ```

   **Step 4.4: Add microphone button** (in input area, before Send button):
   ```typescript
   {/* Voice Input Button - ONLY if supported */}
   {isVoiceSupported && (
     <button
       type="button"
       onClick={isRecording ? stopRecording : startRecording}
       disabled={isLoading || isTranscribing}
       className={`p-3 rounded-lg transition-all duration-200 ${
         isRecording
           ? 'bg-red-500 text-white animate-pulse'
           : isTranscribing
           ? 'bg-blue-500 text-white'
           : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
       } disabled:opacity-50 disabled:cursor-not-allowed`}
       aria-label={
         isRecording
           ? (language === 'en' ? 'Stop recording' : 'ریکارڈنگ بند کریں')
           : (language === 'en' ? 'Start voice input' : 'آواز سے ان پٹ شروع کریں')
       }
       aria-pressed={isRecording}
     >
       {/* Microphone SVG Icon */}
       <svg
         className="w-6 h-6"
         fill="none"
         stroke="currentColor"
         viewBox="0 0 24 24"
         xmlns="http://www.w3.org/2000/svg"
       >
         <path
           strokeLinecap="round"
           strokeLinejoin="round"
           strokeWidth={2}
           d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
         />
       </svg>
     </button>
   )}
   ```

### Phase 5: Add CSS Animations (~15 mins)

5. **Modify `frontend/src/app/globals.css`** (after line 51):
   ```css
   /* Voice Recording Animations */
   @keyframes pulse {
     0%, 100% {
       opacity: 1;
     }
     50% {
       opacity: 0.7;
     }
   }

   .animate-pulse {
     animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
   }
   ```

### Phase 6: Testing (~2-3 hours)

6. **Test Voice Feature**

   **Manual Testing Checklist**:
   - [ ] Mic button appears in Chrome/Edge
   - [ ] Mic button hidden in Firefox
   - [ ] Click mic → recording indicator shows
   - [ ] Speak → live transcription preview appears
   - [ ] After speech ends → message auto-sends after 300ms
   - [ ] English command works
   - [ ] Urdu command works
   - [ ] Language auto-detection switches UI
   - [ ] Deny microphone permission → error shows, text input still works
   - [ ] Voice error → dismiss button works

   **Regression Testing**:
   - [ ] Text input still works normally
   - [ ] Send button still works
   - [ ] Language toggle still works
   - [ ] Enter key to send still works
   - [ ] Message history displays correctly
   - [ ] AI responses work correctly

   **Cross-Browser Testing**:
   - [ ] Chrome (desktop): Full functionality
   - [ ] Edge (desktop): Full functionality
   - [ ] Firefox (desktop): Button hidden, no errors
   - [ ] Chrome (Android): Works on mobile
   - [ ] Safari (iOS): Limited (English only)

---

## File Structure

After implementation, your file tree should look like this:

```
frontend/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx ← MODIFIED (4 additions)
│   │   └── globals.css ← MODIFIED (1 addition)
│   ├── hooks/
│   │   └── useVoiceRecognition.ts ← NEW
│   ├── types/
│   │   └── speech.ts ← NEW
│   └── utils/
│       └── languageDetection.ts ← NEW

specs/
└── 002-voice-commands/
    ├── spec.md ← Read first
    ├── plan.md ← Read second
    ├── research.md
    ├── data-model.md
    ├── quickstart.md ← You are here
    ├── contracts/
    │   ├── voice-hook-contract.ts
    │   └── chat-integration-contract.md
    └── checklists/
        └── requirements.md
```

---

## Common Issues and Solutions

### Issue 1: "SpeechRecognition is not defined"
**Cause**: Testing in Firefox or unsupported browser
**Solution**: Test in Chrome or Edge. Check `isSupported` flag.

### Issue 2: "Cannot read property 'start' of null"
**Cause**: Calling startRecording() before recognition initialized
**Solution**: Ensure useEffect has run. Check `recognitionRef.current` exists.

### Issue 3: Permission denied error on every click
**Cause**: User denied microphone permission
**Solution**: Instruct user to enable microphone in browser settings. Show clear error message.

### Issue 4: Transcript not auto-sending
**Cause**: sendMessage() function reference issue
**Solution**: Ensure sendMessage is in dependency array of useCallback for handleVoiceTranscript.

### Issue 5: Language doesn't auto-switch
**Cause**: containsUrdu() function not working
**Solution**: Verify Unicode regex /[\u0600-\u06FF]/ is correct. Test with actual Urdu text.

### Issue 6: Interim results not showing
**Cause**: interimResults set to false
**Solution**: Ensure `recognition.interimResults = true` in useEffect.

### Issue 7: Recording doesn't stop automatically
**Cause**: continuous set to true
**Solution**: Ensure `recognition.continuous = false` in useEffect.

### Issue 8: Memory leak warning on unmount
**Cause**: Not cleaning up event listeners
**Solution**: Ensure useEffect returns cleanup function that calls `recognition.abort()`.

---

## Testing Commands

### English Voice Commands to Test
- "show my tasks"
- "add a task to buy groceries"
- "mark task 1 as complete"
- "delete the meeting task"
- "show completed tasks"

### Urdu Voice Commands to Test
- "میرے کام دکھائیں" (show my tasks)
- "گروسری خریدنے کا کام شامل کریں" (add task to buy groceries)
- "کام نمبر 1 مکمل کریں" (mark task 1 as complete)
- "میٹنگ کا کام حذف کریں" (delete meeting task)
- "مکمل شدہ کام دکھائیں" (show completed tasks)

---

## Performance Checklist

After implementation, verify:
- [ ] Page loads in same time as before (<100ms difference)
- [ ] Voice button appears instantly when page loads
- [ ] Clicking mic button activates in <500ms
- [ ] Transcription updates appear smooth (no lag)
- [ ] Auto-send happens exactly 300ms after transcription
- [ ] No memory leaks (check Chrome DevTools Memory tab)
- [ ] CPU usage normal during recording (<25%)

---

## Deployment Checklist

Before deploying to production:
- [ ] All tests pass (manual and automated)
- [ ] No TypeScript errors
- [ ] No console errors in Chrome
- [ ] No console errors in Firefox (button should be hidden)
- [ ] CLAUDE.md updated with voice feature documentation
- [ ] Code reviewed by team
- [ ] Feature flag configured (optional, for gradual rollout)
- [ ] Monitoring set up (track voice usage rate)

---

## Quick Commands

```bash
# Install dependencies (if needed)
cd frontend
npm install

# Start dev server
npm run dev

# Run TypeScript check
npm run type-check

# Build for production
npm run build

# Run tests (if configured)
npm test
```

---

## Getting Help

If you encounter issues:

1. **Check the full plan**: `specs/002-voice-commands/plan.md`
2. **Review contracts**: `specs/002-voice-commands/contracts/`
3. **Read research**: `specs/002-voice-commands/research.md`
4. **Check MDN docs**: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
5. **Browser compatibility**: https://caniuse.com/speech-recognition

---

## Success Criteria

You'll know implementation is complete when:

✅ Microphone button appears in Chrome/Edge (but not Firefox)
✅ Clicking mic starts recording (indicator shows)
✅ Speaking produces live transcription preview
✅ Message auto-sends 300ms after speech ends
✅ English voice commands work
✅ Urdu voice commands work
✅ Language auto-detection switches UI correctly
✅ Errors are handled gracefully
✅ Text input still works perfectly (existing functionality preserved)
✅ All regression tests pass

---

## Estimated Time Breakdown

| Phase | Task | Time |
|-------|------|------|
| 1 | Type definitions | 30 mins |
| 2 | Language utilities | 1 hour |
| 3 | Voice hook | 3-4 hours |
| 4 | UI integration | 2-3 hours |
| 5 | CSS animations | 15 mins |
| 6 | Testing | 2-3 hours |
| **Total** | | **8-12 hours** |

**Tip**: Start with type definitions and utilities first. They're simple and give you confidence before tackling the hook.

---

## Next Steps After Implementation

1. Update CLAUDE.md with voice feature documentation
2. Create PR for code review
3. Deploy to staging for QA testing
4. Collect user feedback
5. Monitor voice usage metrics
6. Consider future enhancements (see spec.md "Future Enhancements" section)

---

**Good luck with the implementation! 🎤**
