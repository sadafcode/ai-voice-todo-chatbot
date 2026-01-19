'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ChatKit, useChatKit } from '@openai/chatkit-react';

const ChatPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // ChatKit configuration
  const domainKey = process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY || '';

  const { control } = useChatKit({
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || 'https://sadafawad-todoapp-backend.hf.space',
      // Domain key for OpenAI hosted ChatKit
      domainKey: domainKey,
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading state
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

  // If not authenticated
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
          <h1 className="text-3xl md:text-4xl font-bold text-gradient glow-text">
            AI Task Assistant
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Logged in as: {user?.email}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="card-dark-elevated p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Chat with your AI Task Assistant
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Manage your tasks using natural language. Try commands like:
          </p>
          <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--text-muted)' }}>
            <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Add a task to buy groceries"</li>
            <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Show me my tasks"</li>
            <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Complete task 1"</li>
            <li className="flex items-center gap-2"><span className="text-blue-400">•</span> "Delete the meeting task"</li>
          </ul>
        </div>

        {/* ChatKit Component */}
        <div className="card-dark-elevated overflow-hidden" style={{ height: '500px' }}>
          <ChatKit
            control={control}
            className="w-full h-full"
            style={{
              '--chatkit-background': 'var(--bg-secondary)',
              '--chatkit-text-color': 'var(--text-primary)',
              '--chatkit-input-background': 'var(--bg-tertiary)',
              '--chatkit-message-user-background': 'var(--accent-primary)',
              '--chatkit-message-assistant-background': 'var(--bg-tertiary)',
            } as React.CSSProperties}
          />
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Powered by OpenAI ChatKit + MCP Tools
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
