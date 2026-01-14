// API response types matching backend models

export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Task {
  id: number
  title: string
  description: string | null
  completed: boolean
  created_at: string
  updated_at: string
  user_id: string
}

export interface ApiError {
  detail: string | Array<{
    loc: string[]
    msg: string
    type: string
  }>
}
