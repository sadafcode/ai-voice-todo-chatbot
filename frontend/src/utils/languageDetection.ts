/**
 * Language detection utilities for voice recognition feature
 * Contains functions to detect language from text and generate localized messages
 */

/**
 * Checks if the given text contains Urdu characters
 * Uses Unicode range U+0600-U+06FF which covers Arabic and Urdu script
 * @param text - The text to check for Urdu characters
 * @returns true if text contains Urdu characters, false otherwise
 */
export function containsUrdu(text: string): boolean {
  const urduRegex = /[\u0600-\u06FF]/;
  return urduRegex.test(text);
}

/**
 * Detects the predominant language in the given text
 * @param text - The text to analyze for language
 * @returns 'ur' if Urdu characters are detected, 'en' otherwise
 */
export function detectLanguage(text: string): 'en' | 'ur' {
  if (containsUrdu(text)) {
    return 'ur';
  }
  return 'en';
}

/**
 * Maps language codes to speech recognition language codes
 * @param lang - The language code ('en' or 'ur')
 * @returns The corresponding speech recognition language code
 */
export function getLanguageCode(lang: 'en' | 'ur'): string {
  switch (lang) {
    case 'en':
      return 'en-US';
    case 'ur':
      return 'ur-PK'; // Urdu Pakistan locale for better recognition
    default:
      return 'en-US';
  }
}

/**
 * Gets localized error message for the given error code and language
 * @param errorCode - The speech recognition error code
 * @param language - The current UI language ('en' or 'ur')
 * @returns The localized error message
 */
export function getVoiceErrorMessage(
  errorCode: string,
  language: 'en' | 'ur'
): string {
  const errorMessages: Record<string, Record<'en' | 'ur', string>> = {
    'not-allowed': {
      en: 'Microphone access denied. Please allow microphone permissions.',
      ur: 'مائیکروفون کی اجازت نہیں ملی۔ براہ کرم اجازت دیں۔'
    },
    'no-speech': {
      en: 'No speech detected. Please try again.',
      ur: 'کوئی آواز نہیں ملی۔ دوبارہ کوشش کریں۔'
    },
    'audio-capture': {
      en: 'Microphone not found. Please check your device.',
      ur: 'مائیکروفون دستیاب نہیں۔ اپنا آلہ چیک کریں۔'
    },
    'network': {
      en: 'Network error. Please check your connection.',
      ur: 'نیٹ ورک کا مسئلہ۔ اپنا کنکشن چیک کریں۔'
    },
    'aborted': {
      en: 'Speech recognition aborted. Please try again.',
      ur: 'آواز کی شناخت روک دی گئی۔ دوبارہ کوشش کریں۔'
    },
    'not-supported': {
      en: 'Voice recognition not supported in this browser.',
      ur: 'اس براؤزر میں آواز کی شناخت معاونت یافتہ نہیں ہے۔'
    }
  };

  // Return the appropriate message based on error code and language
  if (errorMessages[errorCode]) {
    return errorMessages[errorCode][language];
  }

  // Default fallback message
  return language === 'en'
    ? 'An error occurred with voice recognition.'
    : 'آواز کی شناخت میں ایک خرابی پیش آگئی۔';
}

/**
 * Gets the text direction (LTR or RTL) based on the detected language
 * @param text - The text to analyze for direction
 * @returns 'rtl' if Urdu is detected, 'ltr' otherwise
 */
export function getTextDirection(text: string): 'ltr' | 'rtl' {
  return containsUrdu(text) ? 'rtl' : 'ltr';
}

export {};