/**
 * TypeScript interfaces for Web Speech API and voice recognition hook
 */

// Constructor type for SpeechRecognition
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Extend the global Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

/**
 * Configuration options for voice recognition
 */
export interface VoiceRecognitionConfig {
  /**
   * Current language preference ('en' for English, 'ur' for Urdu)
   */
  language: 'en' | 'ur';

  /**
   * Callback function triggered when final transcript is ready
   * @param text - The transcribed text
   * @param detectedLanguage - The detected language from the transcript ('en' | 'ur' | null)
   */
  onTranscriptReady: (text: string, detectedLanguage: 'en' | 'ur' | null) => void;

  /**
   * Whether to automatically detect language from the transcript
   * @default true
   */
  autoDetect?: boolean;
}

/**
 * Return type for the useVoiceRecognition hook
 */
export interface UseVoiceRecognitionReturn {
  // State properties
  /**
   * Whether the system is currently recording audio
   */
  isRecording: boolean;

  /**
   * Whether the system is currently processing/transcribing audio
   */
  isTranscribing: boolean;

  /**
   * Current transcript (interim or final)
   */
  transcript: string;

  /**
   * Error message if any error occurred, null otherwise
   */
  error: string | null;

  /**
   * Whether the current browser supports Web Speech API
   */
  isSupported: boolean;

  /**
   * The detected language from the last transcript ('en' | 'ur' | null)
   */
  detectedLanguage: 'en' | 'ur' | null;

  // Action methods
  /**
   * Start the voice recording process
   */
  startRecording: () => void;

  /**
   * Stop the voice recording process
   */
  stopRecording: () => void;

  /**
   * Reset the transcript state to empty
   */
  resetTranscript: () => void;
}

/**
 * Type definition for SpeechRecognition error codes
 */
export type SpeechRecognitionErrorCode =
  | 'not-allowed'        // Microphone permission denied
  | 'no-speech'          // No speech detected
  | 'audio-capture'      // Microphone not found
  | 'network'            // Network error
  | 'aborted'            // User aborted
  | 'not-supported';     // Browser doesn't support feature

// Define types for Web Speech API
export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onnomatch: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onspeechstart: (event: Event) => void;
  onspeechend: (event: Event) => void;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

export {};