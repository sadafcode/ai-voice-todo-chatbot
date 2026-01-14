'use client'

import React from 'react'

interface Task {
  id: number
  title: string
  description?: string
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}

interface TaskItemProps {
  task: Task
  onToggleComplete: (taskId: number, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  loading?: boolean
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  loading,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white shadow rounded-lg mb-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task.id, !task.completed)}
          className="form-checkbox h-5 w-5 text-blue-600"
          disabled={loading}
        />
        <div className="ml-4">
          <h3
            className={`text-lg font-semibold ${
              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            Created: {new Date(task.created_at).toLocaleString()} | Updated:{' '}
            {new Date(task.updated_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(task)}
          className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="px-3 py-1 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default TaskItem
