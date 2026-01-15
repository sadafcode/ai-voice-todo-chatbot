'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/tasks')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4" style={{ color: '#9CA3AF' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12" style={{ background: '#0F172A' }}>
      <main className="w-full max-w-4xl text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl" style={{ color: '#E5E7EB' }}>
            Welcome to{' '}
            <span className="text-gradient glow-text">
              TaskMaster
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl sm:text-2xl" style={{ color: '#9CA3AF' }}>
            Your AI-powered task management solution.
            Stay organized with natural language commands.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <div
            className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 border"
            style={{
              background: '#111827',
              borderColor: '#1E293B',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#38BDF8';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
            }}
          >
            <div className="mb-3 text-4xl">
              <svg className="w-10 h-10 mx-auto" style={{ color: '#38BDF8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold" style={{ color: '#E5E7EB' }}>Easy Task Creation</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Create and organize tasks in seconds</p>
          </div>

          <div
            className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 border"
            style={{
              background: '#111827',
              borderColor: '#1E293B',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#38BDF8';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
            }}
          >
            <div className="mb-3 text-4xl">
              <svg className="w-10 h-10 mx-auto" style={{ color: '#38BDF8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold" style={{ color: '#E5E7EB' }}>AI Chat Assistant</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Manage tasks with natural language</p>
          </div>

          <div
            className="rounded-2xl p-6 transition-all duration-300 hover:scale-105 border"
            style={{
              background: '#111827',
              borderColor: '#1E293B',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#38BDF8';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1E293B';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)';
            }}
          >
            <div className="mb-3 text-4xl">
              <svg className="w-10 h-10 mx-auto" style={{ color: '#38BDF8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold" style={{ color: '#E5E7EB' }}>Voice Commands</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Hands-free task management</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="btn-primary flex h-14 w-full items-center justify-center px-8 text-lg font-semibold sm:w-auto"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="btn-icon flex h-14 w-full items-center justify-center px-8 text-lg font-semibold sm:w-auto"
            style={{ color: '#E5E7EB' }}
          >
            Sign In
          </Link>
        </div>

        {/* Footer Note */}
        <p className="mt-12 text-sm" style={{ color: '#9CA3AF' }}>
          New to TaskMaster?{' '}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: '#38BDF8' }}>
            Create a free account
          </Link>{' '}
          to get started!
        </p>
      </main>
    </div>
  )
}
