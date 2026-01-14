import { useState, useEffect, useRef, useCallback } from 'react';
import {
  containsUrdu,
  detectLanguage,
  getLanguageCode,
  getVoiceErrorMessage
} from '../utils/languageDetection';
import {
  VoiceRecognitionConfig,
  UseVoiceRecognitionReturn,
  SpeechRecognitionErrorCode
} from '../types/speech';

/**
 * Custom React hook for voice recognition functionality
 * Encapsulates Web Speech API logic with language detection and error handling
 *
 * @param config - Configuration options for voice recognition
 * @returns Object containing state and actions for voice recognition
 */
export function useVoiceRecognition(config: VoiceRecognitionConfig): UseVoiceRecognitionReturn {
  // Check if the current browser supports Web Speech API
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // State variables
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<'en' | 'ur' | null>(null);

  // Reference to store the SpeechRecognition instance
  const recognitionRef = useRef<any>(null);
  // Reference to store the timeout ID for auto-send
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Initialize SpeechRecognition when component mounts
  useEffect(() => {
    if (isSupported) {
      // Get the appropriate constructor (webkit prefix for older browsers)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Configure the recognition
      recognitionRef.current.continuous = false;        // Stop after user finishes speaking
      recognitionRef.current.interimResults = true;     // Show partial results
      recognitionRef.current.maxAlternatives = 1;       // Single best result
      recognitionRef.current.lang = getLanguageCode(config.language); // Set initial language

      // Set up event handlers
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setIsTranscribing(true);
        setError(null);
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Update transcript - show final if available, otherwise interim
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        // If we have final results, process them
        if (finalTranscript) {
          setIsTranscribing(false);

          // Detect language from the final transcript
          const detectedLang = config.autoDetect !== false ? detectLanguage(finalTranscript) : null;
          setDetectedLanguage(detectedLang);

          // Call the callback with the final transcript and detected language
          config.onTranscriptReady(finalTranscript, detectedLang);
        } else {
          // Still transcribing, update the interim result
          setIsTranscribing(true);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsRecording(false);
        setIsTranscribing(false);

        // Map the error to our defined error codes and get localized message
        const errorCode = event.error as SpeechRecognitionErrorCode;
        const errorMessage = getVoiceErrorMessage(errorCode, config.language);
        setError(errorMessage);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsTranscribing(false);
      };

      // Clean up function
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      };
    }
  }, []); // Only run once on mount

  // Update language when config.language changes
  useEffect(() => {
    if (recognitionRef.current && isSupported) {
      recognitionRef.current.lang = getLanguageCode(config.language);
    }
  }, [config.language]);

  // Function to start recording
  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError(getVoiceErrorMessage('not-supported', config.language));
      return;
    }

    if (recognitionRef.current) {
      try {
        // Set the language based on current config
        recognitionRef.current.lang = getLanguageCode(config.language);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting voice recognition:', err);
        setError(getVoiceErrorMessage('not-allowed', config.language));
      }
    }
  }, [isSupported, config.language]);

  // Function to stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Function to reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
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