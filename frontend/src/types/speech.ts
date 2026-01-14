/**
 * TypeScript interfaces for Web Speech API and voice recognition hook
 */

// Extend the global Window interface to include SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
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

export {};