'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch, handleResponse } from '@/lib/api'
import TaskForm from '@/app/components/TaskForm'
import TaskItem from '@/app/components/TaskItem'
import { useAuth } from '@/context/AuthContext' // IMPORT AUTH CONTEXT

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}

const TaskListPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true) // Renamed to avoid conflict with auth loading
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all') // 'all', 'pending', 'completed'
  const [sortOrder, setSortOrder] = useState<string>('created_at') // 'created_at', 'title', 'updated_at'
  const [sortDirection, setSortDirection] = useState<string>('asc') // 'asc', 'desc'

  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth() // USE AUTH HOOK

  // Redirect if not authenticated after authLoading is complete
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const fetchTasks = useCallback(async () => {
    if (!user?.id) return // Don't fetch if user ID is not available yet

    setLoadingTasks(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      if (filterStatus !== 'all') {
        queryParams.append('status', filterStatus)
      }
      if (sortOrder) {
        queryParams.append('sort', sortOrder)
        queryParams.append('order', sortDirection)
      }

      const queryString = queryParams.toString()
      const endpoint = `/api/${user.id}/tasks${queryString ? `?${queryString}` : ''}` // USE user.id

      const response = await authFetch(endpoint)
      const data = await handleResponse<Task[]>(response)
      setTasks(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks')
      // AuthContext handles logout/redirect on 401 now, so no explicit redirect here
    } finally {
      setLoadingTasks(false)
    }
  }, [filterStatus, sortOrder, sortDirection, user?.id]) // Add user.id to dependencies

  useEffect(() => {
    // Only fetch tasks if authenticated and user object is available
    if (isAuthenticated && user?.id) {
      fetchTasks()
    }
  }, [isAuthenticated, user?.id, fetchTasks])

  const handleAddTask = async (taskData: { title: string; description?: string }) => {
    if (!user?.id) return // Ensure user ID is available
    setLoadingTasks(true)
    setError(null)
    try {
      const response = await authFetch(`/api/${user.id}/tasks`, { // USE user.id
        method: 'POST',
        body: JSON.stringify(taskData),
      })
      await handleResponse(response)
      setShowForm(false)
      fetchTasks()
    } catch (err: any) {
      setError(err.message || 'Failed to add task')
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleUpdateTask = async (taskData: { title: string; description?: string }) => {
    if (!editingTask || !user?.id) return // Ensure user ID is available

    setLoadingTasks(true)
    setError(null)
    try {
      const response = await authFetch(`/api/${user.id}/tasks/${editingTask.id}`, { // USE user.id
        method: 'PUT',
        body: JSON.stringify(taskData),
      })
      await handleResponse(response)
      setEditingTask(null)
      setShowForm(false)
      fetchTasks()
    } catch (err: any) {
      setError(err.message || 'Failed to update task')
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!user?.id) return // Ensure user ID is available
    setLoadingTasks(true)
    setError(null)
    try {
      const response = await authFetch(`/api/${user.id}/tasks/${taskId}`, { // USE user.id
        method: 'DELETE',
      })
      if (response.status === 204) {
        fetchTasks()
      } else {
        await handleResponse(response)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete task')
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    if (!user?.id) return // Ensure user ID is available
    setLoadingTasks(true)
    setError(null)
    try {
      const response = await authFetch(`/api/${user.id}/tasks/${taskId}/complete`, { // USE user.id
        method: 'PATCH',
      })
      await handleResponse(response)
      fetchTasks()
    } catch (err: any) {
      setError(err.message || 'Failed to toggle task completion')
    } finally {
      setLoadingTasks(false)
    }
  }

  // Show a global loading state while AuthContext is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Loading authentication...</p>
        </div>
      </div>
    )
  }

  // If not authenticated (and authLoading is false), the useEffect above will redirect.
  // This render path should ideally not be reached if redirect works as expected.
  // If for some reason it is, show a message.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p className="text-red-400 text-xl">Not authenticated. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient glow-text">
            My Tasks {user?.name ? `for ${user.name}` : ''}
          </h1>

          {/* AI Chat Button */}
          <button
            onClick={() => router.push('/chat')}
            className="btn-primary flex items-center gap-2 px-5 py-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>AI Chat</span>
          </button>
        </div>

        {error && (
          <div className="status-error px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingTask(null)
            }}
            className="btn-primary px-6 py-2.5"
          >
            {showForm ? 'Cancel Add' : 'Add New Task'}
          </button>

          <div className="flex flex-wrap gap-3">
            {/* Filter by Status */}
            <div>
              <label htmlFor="filterStatus" className="sr-only">Filter by Status</label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-dark px-3 py-2 text-sm min-w-[140px]"
                disabled={loadingTasks}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="sortOrder" className="sr-only">Sort by</label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="input-dark px-3 py-2 text-sm min-w-[140px]"
                disabled={loadingTasks}
              >
                <option value="created_at">Created Date</option>
                <option value="title">Title</option>
                <option value="updated_at">Updated Date</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div>
              <label htmlFor="sortDirection" className="sr-only">Sort Direction</label>
              <select
                id="sortDirection"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                className="input-dark px-3 py-2 text-sm min-w-[130px]"
                disabled={loadingTasks}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="card-dark p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <TaskForm
              initialTask={editingTask || undefined}
              onSubmit={editingTask ? handleUpdateTask : handleAddTask}
              onCancel={() => {
                setShowForm(false)
                setEditingTask(null)
              }}
              loading={loadingTasks} // Pass loading to TaskForm
              error={error}
            />
          </div>
        )}

        {loadingTasks && !tasks.length && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading tasks...</p>
          </div>
        )}

        {!loadingTasks && tasks.length === 0 && !error && (
          <div className="card-dark p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>No tasks found. Add one above!</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Or use the AI Chat to manage tasks with natural language</p>
          </div>
        )}

        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={(taskToEdit) => {
                setEditingTask(taskToEdit)
                setShowForm(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onDelete={handleDeleteTask}
              loading={loadingTasks} // Pass loading to disable buttons during API calls
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.push('/chat')}
            className="btn-icon px-6 py-2.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span style={{ color: 'var(--text-primary)' }}>Open AI Chat</span>
          </button>

          <button
            onClick={logout}
            className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskListPage
