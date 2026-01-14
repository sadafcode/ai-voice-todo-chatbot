/**
 * Reusable skill for implementing AI Chatbot frontend using OpenAI ChatKit
 *
 * This skill provides standardized components and patterns for building
 * the AI-powered todo chatbot frontend that allows users to manage
 * their tasks through natural language interactions.
 */

import { ChatKit, useChatKit } from '@openai/chatkit-react';

interface ChatBotFrontendConfig {
  apiEndpoint: string;
  domainKey: string;
  theme?: 'light' | 'dark';
  className?: string;
  userId?: string;
}

/**
 * React component for AI Todo Chatbot frontend
 * Uses OpenAI ChatKit to provide conversational interface
 */
export function TodoChatBot({ config }: { config: ChatBotFrontendConfig }) {
  const { control } = useChatKit({
    api: {
      url: config.apiEndpoint,
      domainKey: config.domainKey,
    },
  });

  return (
    <div className={`todo-chatbot-container ${config.className || ''}`}>
      <ChatKit
        control={control}
        className={`h-[600px] w-[360px] border rounded-lg ${config.theme === 'dark' ? 'dark' : ''}`}
      />
    </div>
  );
}

/**
 * Alternative vanilla JavaScript implementation
 * For use in non-React environments
 */
export function initVanillaChatBot(containerId: string, config: ChatBotFrontendConfig) {
  // Dynamically import the ChatKit library
  import('@openai/chatkit').then(() => {
    const chatkit = document.createElement('openai-chatkit');

    chatkit.setOptions({
      api: {
        url: config.apiEndpoint,
        domainKey: config.domainKey,
      },
    });

    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(chatkit);
    }
  });
}

/**
 * Standardized API configuration for the chatbot
 * Ensures consistency across different implementations
 */
export const chatBotApiConfig = {
  endpoints: {
    chat: '/api/chat',
    conversation: '/api/conversations',
    messages: '/api/messages'
  },
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}'
  }
};

/**
 * Default styling and theming for the chatbot component
 */
export const defaultChatBotStyles = `
  .todo-chatbot-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  openai-chatkit {
    height: 100%;
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .chat-input-area {
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .message-history {
    max-height: 400px;
    overflow-y: auto;
    padding: 1rem;
  }
`;

/**
 * Helper function to handle authentication for the chatbot
 */
export async function setupChatBotAuth(userId: string, token: string) {
  // Store authentication info for API calls
  const authInfo = {
    userId,
    token,
    timestamp: Date.now()
  };

  localStorage.setItem('todo-chatbot-auth', JSON.stringify(authInfo));

  return authInfo;
}

/**
 * Example usage:
 *
 * const chatConfig = {
 *   apiEndpoint: 'http://localhost:8000/api/chat',
 *   domainKey: 'local-dev',
 *   theme: 'light',
 *   className: 'my-chatbot'
 * };
 *
 * // In React component:
 * <TodoChatBot config={chatConfig} />
 *
 * // Or in vanilla JS:
 * initVanillaChatBot('chat-container', chatConfig);
 */