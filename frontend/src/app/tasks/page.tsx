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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-xl">Loading authentication...</p>
      </div>
    )
  }

  // If not authenticated (and authLoading is false), the useEffect above will redirect.
  // This render path should ideally not be reached if redirect works as expected.
  // If for some reason it is, show a message.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 text-xl">Not authenticated. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">My Tasks {user?.name ? `for ${user.name}` : ''}</h1> {/* Display user name */}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingTask(null)
            }}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-150"
          >
            {showForm ? 'Cancel Add' : 'Add New Task'}
          </button>

          <div className="flex space-x-4">
            {/* Filter by Status */}
            <div>
              <label htmlFor="filterStatus" className="sr-only">Filter by Status</label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                disabled={loadingTasks}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
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
          <p className="text-center text-gray-600 text-lg">Loading tasks...</p>
        )}

        {!loadingTasks && tasks.length === 0 && !error && (
          <p className="text-center text-gray-600 text-lg">No tasks found. Add one above!</p>
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

        {/* Logout button */}
        <div className="mt-8 text-center">
            <button
                onClick={logout}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition duration-150"
            >
                Logout
            </button>
        </div>
      </div>
    </div>
  )
}

export default TaskListPage