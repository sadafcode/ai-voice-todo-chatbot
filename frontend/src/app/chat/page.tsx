'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authFetch, handleResponse } from '@/lib/api';

// Import the chatbot component from the skills directory
import { TodoChatBot } from '../../../.claude/skills/ai-chatbot-frontend';

// Import voice recognition hook and utilities
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { detectLanguage, getTextDirection } from '../../utils/languageDetection';

const ChatPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // State for chat functionality
  const [messages, setMessages] = useState([]);
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
        sender: 'user',
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

      // Add bot response to UI
      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your request.',
        sender: 'bot',
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
  const handleKeyPress = (e) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-xl">Loading chat...</p>
      </div>
    );
  }

  // If not authenticated, show a message (should redirect automatically)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 text-xl">Not authenticated. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold text-gray-800 ${language === 'ur' ? 'font-urdu' : ''}`}>
            {language === 'en' ? 'AI Task Assistant' : 'اے آئی ٹاسک اسسٹنٹ'}
          </h1>

          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="font-semibold">
              {language === 'en' ? 'اردو' : 'English'}
            </span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className={`mb-4 ${language === 'ur' ? 'text-right font-urdu' : ''}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {language === 'en'
                ? 'Chat with your AI Task Assistant'
                : 'اپنے اے آئی ٹاسک اسسٹنٹ سے بات کریں'}
            </h2>
            <p className="text-gray-600">
              {language === 'en'
                ? 'Manage your tasks using natural language. Try commands like:'
                : 'قدرتی زبان استعمال کرتے ہوئے اپنے کاموں کو منظم کریں۔ ان کمانڈز کو آزمائیں:'}
            </p>
            <ul className="text-sm text-gray-500 mt-1 space-y-1">
              {language === 'en' ? (
                <>
                  <li>• "Add a task to buy groceries"</li>
                  <li>• "Show me my tasks"</li>
                  <li>• "Update dentist task to tomorrow urgent"</li>
                  <li>• "Complete task 1"</li>
                  <li>• "Delete the meeting task"</li>
                </>
              ) : (
                <>
                  <li>• "گروسری خریدنے کا کام شامل کریں"</li>
                  <li>• "میرے کام دکھائیں"</li>
                  <li>• "ڈینٹسٹ کا کام کل کے لیے فوری بنائیں"</li>
                  <li>• "کام نمبر 1 مکمل کریں"</li>
                  <li>• "میٹنگ کا کام حذف کریں"</li>
                </>
              )}
            </ul>
          </div>

          {/* Chat Interface */}
          <div className="border rounded-lg p-4 mb-4 bg-gray-50 h-96 overflow-y-auto relative">
            {messages.length === 0 ? (
              <div className={`h-full flex items-center justify-center text-gray-500 ${language === 'ur' ? 'font-urdu' : ''}`}>
                <p>{language === 'en' ? 'Start chatting with your AI Task Assistant...' : 'اپنے اے آئی ٹاسک اسسٹنٹ کے ساتھ بات شروع کریں...'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const msgDirection = getTextDirection(msg.text);
                  const isUrdu = msgDirection === 'rtl';

                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg max-w-3/4 ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-gray-200 text-gray-800'
                      } ${isUrdu ? 'font-urdu' : ''}`}
                      dir={msgDirection}
                    >
                      <div className="flex justify-between items-start">
                        <span className="whitespace-pre-wrap text-base leading-relaxed">{msg.text}</span>
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                        dir="ltr"
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className={`p-3 rounded-lg bg-gray-200 text-gray-800 ${language === 'ur' ? 'font-urdu' : ''}`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
                    <div className="flex items-center">
                      <span>{language === 'en' ? 'AI is thinking...' : 'اے آئی سوچ رہا ہے...'}</span>
                      <div className={`${language === 'ur' ? 'mr-2' : 'ml-2'} flex space-x-1`}>
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-150"></div>
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
            <div className={`mb-2 p-3 bg-red-100 border border-red-300 rounded-lg flex justify-between items-start ${
              language === 'ur' ? 'font-urdu' : ''
            }`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
              <span className="text-red-700">{voiceError}</span>
              <button
                onClick={() => setVoiceError(null)}
                className="ml-2 text-red-700 hover:text-red-900"
                aria-label={language === 'en' ? 'Dismiss error' : 'غلطی کو ختم کریں'}
              >
                ×
              </button>
            </div>
          )}

          {/* Recording Indicator */}
          {voiceRecognition.isRecording && (
            <div className={`mb-2 p-2 bg-red-500 text-white rounded-lg flex items-center ${
              language === 'ur' ? 'font-urdu text-right' : ''
            } animate-pulse`} dir={language === 'ur' ? 'rtl' : 'ltr'}>
              <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
              <span>{language === 'en' ? 'Listening...' : 'سن رہا ہے...'}</span>
            </div>
          )}

          {/* Transcription Preview */}
          {voiceRecognition.transcript && (
            <div className={`mb-2 p-3 bg-blue-100 border border-blue-300 rounded-lg ${
              language === 'ur' ? 'font-urdu text-right' : ''
            }`} dir={getTextDirection(voiceRecognition.transcript)}>
              <span className="text-blue-800">{voiceRecognition.transcript}</span>
            </div>
          )}

          {/* Message Input */}
          <div className={`flex ${language === 'ur' ? 'flex-row-reverse' : ''} gap-2`}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'en' ? 'Type your message here...' : 'یہاں اپنا پیغام لکھیں...'}
              className={`flex-1 border border-gray-600 rounded-lg p-3 resize-none h-16 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                className={`w-12 h-12 flex items-center justify-center rounded-lg transition duration-150 ${
                  voiceRecognition.isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : voiceRecognition.isTranscribing
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                } ${(isLoading || !voiceRecognition.isSupported) ? 'opacity-50 cursor-not-allowed' : ''} ${
                  language === 'ur' ? 'font-urdu' : ''
                }`}
                aria-label={
                  voiceRecognition.isRecording
                    ? (language === 'en' ? 'Stop recording' : 'ریکارڈنگ بند کریں')
                    : (language === 'en' ? 'Record voice message' : 'آواز ریکارڈ کریں')
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 ${voiceRecognition.isRecording ? 'text-white' : 'text-gray-700'}`}
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
              className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                language === 'ur' ? 'font-urdu' : ''
              }`}
            >
              {language === 'en' ? 'Send' : 'بھیجیں'}
            </button>
          </div>
        </div>

        {/* Alternative ChatBot Component (if we wanted to use the skill component) */}
        {/*
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Alternative Chat Interface</h2>
          <TodoChatBot config={{
            apiEndpoint: `/api/${user?.id}/chat`,
            domainKey: 'todo-app',
            theme: 'light',
            className: 'w-full max-w-2xl'
          }} />
        </div>
        */}
      </div>
    </div>
  );
};

export default ChatPage;