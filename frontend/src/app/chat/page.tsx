'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authFetch, handleResponse } from '@/lib/api';

// Import voice recognition hook and utilities
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { detectLanguage, getTextDirection } from '../../utils/languageDetection';

const ChatPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // State for chat functionality
  const [messages, setMessages] = useState<Array<{id: number; text: string; sender: 'user' | 'bot'; timestamp: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ur'>('en'); // Language selector state

  // Add voice recognition state
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Add ref and auto-scroll functionality
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize voice recognition hook
  const voiceRecognition = useVoiceRecognition({
    language,
    onTranscriptReady: (text, detectedLanguage) => {
      // Set the transcribed text as the input message
      setInputMessage(text);

      // If the detected language is different from current UI language, switch the language
      if (detectedLanguage && detectedLanguage !== language) {
        setLanguage(detectedLanguage);
      }

      // Handle the voice transcript with auto-send
      handleVoiceTranscript(text);
    },
    autoDetect: true
  });

  // Handle voice recognition errors
  useEffect(() => {
    if (voiceRecognition.error) {
      setVoiceError(voiceRecognition.error);
    }
  }, [voiceRecognition.error]);

  // Redirect if not authenticated after authLoading is complete
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Function to send message to the backend chat API
  const sendMessage = async () => {
    if (!inputMessage.trim() || !user?.id) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add user message to UI immediately
      const userMessage = {
        id: Date.now(),
        text: messageToSend,
        sender: 'user' as const,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to backend API
      const response = await authFetch(`/api/${user.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: messageToSend
        }),
      });

      const data = await handleResponse(response);
      const responseData = data as {response: string};

      // Add bot response to UI
      const botMessage = {
        id: Date.now() + 1,
        text: responseData.response,
        sender: 'bot' as const,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your request.',
        sender: 'bot' as const,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice transcript and auto-send after 300ms
  const handleVoiceTranscript = (transcript: string) => {
    // Set the transcribed text as input
    setInputMessage(transcript);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to send the message after 300ms
    timeoutRef.current = setTimeout(() => {
      if (transcript.trim()) {
        sendMessage();
      }
    }, 300);
  };

  // Handle pressing Enter to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper function to detect if text contains Urdu/Arabic characters
  const containsUrdu = (text: string) => {
    const urduRegex = /[\u0600-\u06FF]/;
    return urduRegex.test(text);
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ur' : 'en');
  };

  // Get text direction based on message content
  const getTextDirection = (text: string) => {
    return containsUrdu(text) ? 'rtl' : 'ltr';
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show a message (should redirect automatically)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p className="text-red-400 text-xl">Not authenticated. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl md:text-4xl font-bold text-gradient glow-text ${language === 'ur' ? 'font-urdu' : ''}`}>
            {language === 'en' ? 'AI Task Assistant' : 'اے آئی ٹاسک اسسٹنٹ'}
          </h1>

          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="btn-language"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="font-semibold">
              {language === 'en' ? 'اردو' : 'English'}
            </span>
          </button>
        </div>

        {/* Main Card */}
        <div className="card-dark-elevated p-6">
          {/* Instructions */}
          <div className={`mb-6 ${language === 'ur' ? 'text-right font-urdu' : ''}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              {language === 'en'
                ? 'Chat with your AI Task Assistant'
                : 'اپنے اے آئی ٹاسک اسسٹنٹ سے بات کریں'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {language === 'en'
                ? 'Manage your tasks using natural language. Try commands like:'
                : 'قدرتی زبان استعمال کرتے ہوئے اپنے کاموں کو منظم کریں۔ ان کمانڈز کو آزمائیں:'}
            </p>
            <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--text-muted)' }}>
              {language === 'en' ? (
                <>
                  <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Add a task to buy groceries"</li>
                  <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Show me my tasks"</li>
                  <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Update dentist task to tomorrow urgent"</li>
                  <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Complete task 1"</li>
                  <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Delete the meeting task"</li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2 justify-end"><span>"گروسری خریدنے کا کام شامل کریں"</span><span className="text-blue-400">•</span></li>
                  <li className="flex items-center gap-2 justify-end"><span>"میرے کام دکھائیں"</span><span className="text-blue-400">•</span></li>
                  <li className="flex items-center gap-2 justify-end"><span>"ڈینٹسٹ کا کام کل کے لیے فوری بنائیں"</span><span className="text-blue-400">•</span></li>
                  <li className="flex items-center gap-2 justify-end"><span>"کام نمبر 1 مکمل کریں"</span><span className="text-blue-400">•</span></li>
                  <li className="flex items-center gap-2 justify-end"><span>"میٹنگ کا کام حذف کریں"</span><span className="text-blue-400">•</span></li>
                </>
              )}
            </ul>
          </div>

          {/* Chat Interface */}
          <div className="chat-container p-4 mb-4 h-96 overflow-y-auto scrollbar-dark relative">
            {messages.length === 0 ? (
              <div className={`h-full flex items-center justify-center ${language === 'ur' ? 'font-urdu' : ''}`} style={{ color: 'var(--text-muted)' }}>
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>{language === 'en' ? 'Start chatting with your AI Task Assistant...' : 'اپنے اے آئی ٹاسک اسسٹنٹ کے ساتھ بات شروع کریں...'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const msgDirection = getTextDirection(msg.text);
                  const isUrdu = msgDirection === 'rtl';

                  return (
                    <div
                      key={msg.id}
                      className={`p-4 max-w-[80%] animate-message-in ${
                        msg.sender === 'user'
                          ? 'message-user ml-auto'
                          : 'message-bot'
                      } ${isUrdu ? 'font-urdu' : ''}`}
                      dir={msgDirection}
                    >
                      <div className="flex justify-between items-start">
                        <span className="whitespace-pre-wrap text-base leading-relaxed">{msg.text}</span>
                      </div>
                      <div
                        className={`text-xs mt-2 ${
                          msg.sender === 'user' ? 'text-blue-200/70' : ''
                        }`}
                        style={{ color: msg.sender === 'bot' ? 'var(--text-muted)' : undefined }}
                        dir="ltr"
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className={`message-bot p-4 inline-block ${language === 'ur' ? 'font-urdu' : ''}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--text-secondary)' }}>{language === 'en' ? 'AI is thinking' : 'اے آئی سوچ رہا ہے'}</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full animate-thinking-dot" style={{ background: 'var(--accent-primary)' }}></div>
                        <div className="w-2 h-2 rounded-full animate-thinking-dot-delay-1" style={{ background: 'var(--accent-primary)' }}></div>
                        <div className="w-2 h-2 rounded-full animate-thinking-dot-delay-2" style={{ background: 'var(--accent-primary)' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Voice Error Display */}
          {voiceError && (
            <div className={`status-error mb-3 p-3 flex justify-between items-start ${
              language === 'ur' ? 'font-urdu' : ''
            }`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
              <span>{voiceError}</span>
              <button
                onClick={() => setVoiceError(null)}
                className="ml-2 hover:text-red-300 transition-colors"
                aria-label={language === 'en' ? 'Dismiss error' : 'غلطی کو ختم کریں'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Recording Indicator */}
          {voiceRecognition.isRecording && (
            <div className={`mb-3 p-3 rounded-xl flex items-center gap-3 animate-recording ${
              language === 'ur' ? 'font-urdu' : ''
            }`} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)' }} dir={language === 'ur' ? 'rtl' : 'ltr'}>
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400">{language === 'en' ? 'Listening...' : 'سن رہا ہے...'}</span>
            </div>
          )}

          {/* Transcription Preview */}
          {voiceRecognition.transcript && (
            <div className={`status-info mb-3 p-3 ${
              language === 'ur' ? 'font-urdu' : ''
            }`} dir={getTextDirection(voiceRecognition.transcript)}>
              <span>{voiceRecognition.transcript}</span>
            </div>
          )}

          {/* Message Input */}
          <div className={`flex ${language === 'ur' ? 'flex-row-reverse' : ''} gap-3`}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'en' ? 'Type your message here...' : 'یہاں اپنا پیغام لکھیں...'}
              className={`input-dark flex-1 p-4 resize-none h-14 ${
                language === 'ur' ? 'font-urdu text-right' : ''
              }`}
              dir={language === 'ur' ? 'rtl' : 'ltr'}
              disabled={isLoading}
            />

            {/* Microphone Button - Only show if voice recognition is supported */}
            {voiceRecognition.isSupported && (
              <button
                onClick={() => {
                  if (voiceRecognition.isRecording) {
                    voiceRecognition.stopRecording();
                  } else {
                    voiceRecognition.startRecording();
                  }
                }}
                disabled={isLoading}
                className={`btn-icon w-14 h-14 ${
                  voiceRecognition.isRecording ? 'btn-recording' : ''
                } ${voiceRecognition.isTranscribing ? 'animate-glow-pulse' : ''}`}
                aria-label={
                  voiceRecognition.isRecording
                    ? (language === 'en' ? 'Stop recording' : 'ریکارڈنگ بند کریں')
                    : (language === 'en' ? 'Record voice message' : 'آواز ریکارڈ کریں')
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 transition-colors ${voiceRecognition.isRecording ? 'text-white' : ''}`}
                  style={{ color: voiceRecognition.isRecording ? 'white' : 'var(--text-secondary)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className={`btn-primary px-6 h-14 flex items-center gap-2 ${
                language === 'ur' ? 'font-urdu' : ''
              }`}
            >
              <span>{language === 'en' ? 'Send' : 'بھیجیں'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
