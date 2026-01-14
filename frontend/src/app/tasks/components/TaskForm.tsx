'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext' // Assuming an AuthContext for user_id and token

interface TaskFormProps {
  onTaskCreated?: () => void; // Optional callback for when a task is successfully created
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [recurrencePattern, setRecurrencePattern] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, token } = useAuth() // Get user info and token from AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!user || !token) {
      setError('User not authenticated. Please log in.')
      setLoading(false)
      router.push('/login')
      return
    }

    try {
      // Prepare the payload - only include optional fields if they have values
      const payload: any = { title, description }
      if (priority && priority !== 'medium') {
        payload.priority = priority
      }
      if (recurrencePattern) {
        payload.recurrence_pattern = recurrencePattern
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.')
          router.push('/login')
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }

      // Task created successfully
      setTitle('')
      setDescription('')
      setPriority('medium') // Reset to default
      setRecurrencePattern('') // Reset to empty
      if (onTaskCreated) {
        onTaskCreated();
      }
      // Optionally, refresh the page or a part of it if needed
      // router.refresh(); // For Next.js 13+ app directory client components
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Task</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority (Optional)
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700">
            Recurrence Pattern (Optional)
          </label>
          <select
            id="recurrencePattern"
            value={recurrencePattern}
            onChange={(e) => setRecurrencePattern(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={loading}
          >
            <option value="">No Recurrence</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Creating Task...' : 'Add Task'}
        </button>
      </form>
    </div>
  )
}
