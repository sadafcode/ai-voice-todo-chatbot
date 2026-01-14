'use client'

import React, { useState, useEffect } from 'react'

interface TaskFormProps {
  initialTask?: {
    id?: number
    title: string
    description?: string
    completed?: boolean
  }
  onSubmit: (task: { title: string; description?: string }) => void
  onCancel?: () => void
  loading?: boolean
  error?: string | null
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialTask,
  onSubmit,
  onCancel,
  loading,
  error,
}) => {
  const [title, setTitle] = useState(initialTask?.title || '')
  const [description, setDescription] = useState(initialTask?.description || '')
  const [titleError, setTitleError] = useState<string | null>(null)

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title)
      setDescription(initialTask.description || '')
    }
  }, [initialTask])

  const validate = () => {
    let isValid = true
    if (!title.trim()) {
      setTitleError('Title is required')
      isValid = false
    } else if (title.trim().length > 200) {
      setTitleError('Title cannot exceed 200 characters')
      isValid = false
    } else {
      setTitleError(null)
    }
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({ title: title.trim(), description: description.trim() || undefined })
    }
  }

  return (
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
          onBlur={validate}
          className={`mt-1 block w-full px-3 py-2 border ${
            titleError ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          disabled={loading}
          maxLength={200}
          placeholder="Enter task title"
        />
        {titleError && <p className="mt-1 text-sm text-red-600">{titleError}</p>}
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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
          maxLength={1000}
          placeholder="Add a description (optional)"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={loading || !!titleError}
        >
          {initialTask?.id ? 'Update Task' : 'Add Task'}
        </button>
      </div>
    </form>
  )
}

export default TaskForm
