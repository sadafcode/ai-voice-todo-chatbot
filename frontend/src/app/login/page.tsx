'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext' // Import useAuth
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading: authLoading, isAuthenticated, loading } = useAuth() // Use login from useAuth, and authLoading
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/tasks')
    }
  }, [isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed. Please try again.')
    }
    // else, AuthContext handles redirection to /tasks
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0F172A' }}>
      <div
        className="max-w-md w-full space-y-8 p-8 rounded-2xl"
        style={{
          background: '#111827',
          border: '1px solid #1E293B',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient glow-text">Login</h1>
          <p className="mt-2 text-sm" style={{ color: '#9CA3AF' }}>
            Welcome back to TaskMaster
          </p>
        </div>

        {error && (
          <div className="status-error px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E5E7EB' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-dark w-full px-4 py-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E5E7EB' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-dark w-full px-4 py-3"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading} // Use authLoading
            className="btn-primary w-full py-3 text-base"
          >
            {authLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: '#9CA3AF' }}>
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: '#38BDF8' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
