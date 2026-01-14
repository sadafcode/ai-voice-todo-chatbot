/**
 * Voice Recognition Hook Contract
 *
 * This file defines the TypeScript interface contract for the useVoiceRecognition
 * custom React hook. This contract specifies the inputs, outputs, and behavior
 * guarantees of the voice recognition functionality.
 *
 * Location: frontend/src/hooks/useVoiceRecognition.ts (to be implemented)
 */

// ============================================================================
// Browser API Extensions
// ============================================================================

/**
 * Extend Window interface to include Web Speech API
 * These are browser-provided APIs, not our code.
 */
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// ============================================================================
// Hook Configuration
// ============================================================================

/**
 * Configuration object passed to useVoiceRecognition hook
 */
export interface VoiceRecognitionConfig {
  /**
   * Initial language preference for speech recognition
   * - 'en': English (United States) - language code 'en-US'
   * - 'ur': Urdu (Pakistan) - language code 'ur-PK'
   *
   * @default 'en'
   */
  language: 'en' | 'ur';

  /**
   * Callback function invoked when final transcription is ready
   *
   * @param text - The transcribed text from speech
   * @param detectedLanguage - Auto-detected language from transcript
   *                          (null if detection failed or disabled)
   *
   * @remarks
   * - Called after final transcription is complete (not interim results)
   * - detectedLanguage may differ from config.language if auto-detection enabled
   * - Implementer should use this callback to set input message and trigger send
   */
  onTranscriptReady: (
    text: string,
    detectedLanguage: 'en' | 'ur' | null
  ) => void;

  /**
   * Enable automatic language detection from transcript
   * If true, detects language from transcribed text and updates UI language
   * If false, always uses config.language
   *
   * @default true
   */
  autoDetect?: boolean;
}

// ============================================================================
// Hook Return Type
// ============================================================================

/**
 * Return value from useVoiceRecognition hook
 * Provides state and actions for voice recognition functionality
 */
export interface UseVoiceRecognitionReturn {
  // --------------------------------------------------------------------------
  // State Properties (Read-Only)
  // --------------------------------------------------------------------------

  /**
   * Whether voice recording is currently active
   * - true: Microphone is listening, user should speak
   * - false: Not recording
   *
   * @remarks
   * Used to show recording indicator and change button appearance
   */
  isRecording: boolean;

  /**
   * Whether transcription is being processed
   * - true: Speech detected, converting to text
   * - false: Not transcribing
   *
   * @remarks
   * Used to show loading state between recording end and transcript ready
   */
  isTranscribing: boolean;

  /**
   * Current transcribed text
   * - Contains interim results during recording
   * - Contains final result after recording completes
   * - Empty string when not recording
   *
   * @remarks
   * Used to show live transcription preview to user
   */
  transcript: string;

  /**
   * Current error message (localized to current language)
   * - null: No error
   * - string: Localized error message to display to user
   *
   * @remarks
   * - Automatically localized based on config.language
   * - User should be able to dismiss error
   * - Error does not prevent text input from functioning
   */
  error: string | null;

  /**
   * Whether browser supports Web Speech API
   * - true: Feature can be used
   * - false: Feature should be hidden
   *
   * @remarks
   * - Computed once on hook initialization
   * - Based on presence of SpeechRecognition or webkitSpeechRecognition
   * - UI should hide voice button when false
   */
  isSupported: boolean;

  /**
   * Language detected from most recent transcript
   * - 'en': English detected (no Urdu characters found)
   * - 'ur': Urdu detected (Urdu Unicode characters found)
   * - null: No detection performed yet or detection disabled
   *
   * @remarks
   * - Only populated if config.autoDetect is true
   * - Used to automatically switch UI language
   * - Detection based on Unicode character analysis (U+0600-U+06FF)
   */
  detectedLanguage: 'en' | 'ur' | null;

  // --------------------------------------------------------------------------
  // Action Functions
  // --------------------------------------------------------------------------

  /**
   * Start voice recording
   *
   * @throws Error if browser doesn't support Web Speech API
   * @throws Error if microphone permission denied
   *
   * @remarks
   * - Requests microphone permission if not already granted
   * - Starts Web Speech API SpeechRecognition
   * - Sets isRecording to true
   * - Clears any previous errors
   * - Clears previous transcript
   * - Error handling: Sets error state instead of throwing
   */
  startRecording: () => void;

  /**
   * Stop voice recording
   *
   * @remarks
   * - Stops Web Speech API SpeechRecognition
   * - Sets isRecording to false
   * - Triggers final transcription if speech was detected
   * - Safe to call even if not currently recording
   */
  stopRecording: () => void;

  /**
   * Reset transcript to empty string
   *
   * @remarks
   * - Clears transcript state
   * - Does not affect recording state
   * - Used after message is sent to prepare for next recording
   */
  resetTranscript: () => void;
}

// ============================================================================
// Hook Signature
// ============================================================================

/**
 * Custom React hook for voice recognition functionality
 *
 * @param config - Configuration object
 * @returns Hook return object with state and actions
 *
 * @example
 * ```typescript
 * const {
 *   isRecording,
 *   transcript,
 *   startRecording,
 *   stopRecording,
 *   isSupported
 * } = useVoiceRecognition({
 *   language: 'en',
 *   onTranscriptReady: (text, lang) => {
 *     setInputMessage(text);
 *     sendMessage();
 *   },
 *   autoDetect: true
 * });
 * ```
 *
 * @remarks
 * Implementation must:
 * - Initialize SpeechRecognition on first call to startRecording (lazy init)
 * - Clean up SpeechRecognition on component unmount
 * - Handle all Web Speech API error types gracefully
 * - Update state synchronously where possible for responsive UI
 * - Not block the UI thread during recording or processing
 */
export type UseVoiceRecognition = (
  config: VoiceRecognitionConfig
) => UseVoiceRecognitionReturn;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Web Speech API error codes
 * Based on SpeechRecognitionErrorEvent.error property
 */
export type SpeechRecognitionErrorCode =
  | 'not-allowed'      // User denied microphone permission
  | 'no-speech'        // No speech detected within timeout
  | 'audio-capture'    // Microphone not found or failed
  | 'network'          // Network error during recognition
  | 'not-supported'    // Browser doesn't support feature
  | 'aborted'          // Recognition aborted by user
  | 'service-not-allowed' // Service not allowed for security reasons
  | 'bad-grammar'      // Grammar compilation failed (unlikely in our use)
  | 'language-not-supported'; // Language not supported by browser

// ============================================================================
// Behavior Contracts
// ============================================================================

/**
 * GUARANTEES:
 *
 * 1. Browser Compatibility:
 *    - isSupported accurately reflects Web Speech API availability
 *    - Hook works correctly even when isSupported is false
 *    - No console errors in unsupported browsers
 *
 * 2. State Management:
 *    - State updates are synchronous within React's batching rules
 *    - isRecording is true only while actively listening
 *    - isTranscribing is true only while processing final result
 *    - transcript updates in real-time during recording (interim results)
 *
 * 3. Error Handling:
 *    - All Web Speech API errors are caught and converted to error state
 *    - Errors do not crash the component
 *    - Error messages are localized to config.language
 *    - Errors clear when user starts new recording
 *
 * 4. Resource Management:
 *    - SpeechRecognition instance cleaned up on unmount
 *    - No memory leaks from event listeners
 *    - Recording stops automatically when component unmounts
 *
 * 5. Callback Behavior:
 *    - onTranscriptReady called exactly once per recording session
 *    - Called only when final transcription available (not interim results)
 *    - detectedLanguage is null if autoDetect is false
 *    - detectedLanguage matches actual detected language if autoDetect is true
 *
 * 6. Language Detection:
 *    - Language detection based on Unicode character analysis
 *    - Urdu detected if any characters in range U+0600-U+06FF
 *    - English assumed if no Urdu characters found
 *    - Detection happens synchronously after transcription
 *
 * 7. Performance:
 *    - Hook initialization: <10ms
 *    - startRecording() response: <500ms (includes permission request)
 *    - State updates: <100ms (React batching)
 *    - No blocking operations on main thread
 */

// ============================================================================
// Integration Requirements
// ============================================================================

/**
 * INTEGRATION REQUIREMENTS FOR CONSUMERS:
 *
 * 1. Component Setup:
 *    - Must be used within a React function component
 *    - Requires config.onTranscriptReady callback
 *    - Should check isSupported before showing UI
 *
 * 2. UI Requirements:
 *    - Show recording indicator when isRecording is true
 *    - Show transcription preview from transcript prop
 *    - Show error from error prop (dismissible by user)
 *    - Disable recording button when isLoading or isTranscribing
 *    - Hide voice button entirely when isSupported is false
 *
 * 3. Error Handling:
 *    - Display error messages to user
 *    - Provide way to dismiss errors
 *    - Provide way to retry after error
 *    - Maintain text input as fallback
 *
 * 4. Accessibility:
 *    - Add ARIA labels to voice button
 *    - Announce recording state to screen readers
 *    - Provide keyboard shortcut for voice input
 *    - Ensure focus management works correctly
 *
 * 5. Testing:
 *    - Mock Web Speech API for unit tests
 *    - Test all error scenarios
 *    - Test browser compatibility detection
 *    - Test cleanup on unmount
 */

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Language code mapping for Web Speech API
 */
export const LANGUAGE_CODES = {
  en: 'en-US',  // English (United States)
  ur: 'ur-PK',  // Urdu (Pakistan)
} as const;

/**
 * Web Speech API configuration constants
 */
export const SPEECH_CONFIG = {
  /**
   * Whether to continue listening after user stops speaking
   * false: Stop automatically after speech ends (our choice)
   * true: Continue listening until explicitly stopped
   */
  continuous: false,

  /**
   * Whether to return interim (partial) results during speech
   * true: Show live transcription as user speaks (our choice)
   * false: Only return final result
   */
  interimResults: true,

  /**
   * Maximum number of alternative transcriptions to return
   * 1: Only best result (our choice - simplifies logic)
   * >1: Multiple alternatives with confidence scores
   */
  maxAlternatives: 1,
} as const;

/**
 * Auto-send delay in milliseconds
 * Time to show transcript preview before auto-sending
 */
export const AUTO_SEND_DELAY_MS = 300;

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that this contract file matches the actual implementation
 *
 * @remarks
 * During implementation, ensure that:
 * - All interface properties are implemented
 * - All behavior guarantees are met
 * - All integration requirements are documented
 * - TypeScript types match exactly
 */
export type ValidateContract<T, U> = T extends U
  ? U extends T
    ? true
    : false
  : false;

// Type-level test (will cause compile error if contract doesn't match implementation)
// Uncomment after implementation:
// type ContractTest = ValidateContract<UseVoiceRecognitionReturn, typeof useVoiceRecognition extends (config: any) => infer R ? R : never>;
