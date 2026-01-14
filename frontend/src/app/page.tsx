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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <main className="w-full max-w-4xl text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TaskMaster
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 sm:text-2xl">
            Your simple, powerful task management solution.
            Stay organized, boost productivity, and never miss a deadline.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md transition-transform hover:scale-105">
            <div className="mb-3 text-4xl">✓</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Easy Task Creation</h3>
            <p className="text-sm text-gray-600">Create and organize tasks in seconds</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md transition-transform hover:scale-105">
            <div className="mb-3 text-4xl">🎯</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Stay Focused</h3>
            <p className="text-sm text-gray-600">Filter and sort to prioritize what matters</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md transition-transform hover:scale-105">
            <div className="mb-3 text-4xl">🔒</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Secure & Private</h3>
            <p className="text-sm text-gray-600">Your tasks are private and protected</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="flex h-14 w-full items-center justify-center rounded-lg bg-blue-600 px-8 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="flex h-14 w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-8 text-lg font-semibold text-gray-700 shadow-md transition-all hover:border-gray-400 hover:bg-gray-50 sm:w-auto"
          >
            Sign In
          </Link>
        </div>

        {/* Footer Note */}
        <p className="mt-12 text-sm text-gray-500">
          New to TaskMaster?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:underline">
            Create a free account
          </Link>{' '}
          to get started!
        </p>
      </main>
    </div>
  )
}
