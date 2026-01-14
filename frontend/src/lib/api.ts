// frontend/temp_next_app/src/lib/api.ts
import { getAuthToken, removeAuthToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface RequestOptions extends RequestInit {
  authToken?: string | null
}

export const authFetch = async (
  endpoint: string,
  options: RequestOptions = {}
) => {
  const token = options.authToken === undefined ? getAuthToken() : options.authToken
  const headers: HeadersInit = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // If 401 Unauthorized, remove token and potentially redirect to login
    removeAuthToken()
    // Optionally: redirect to login page
    // window.location.href = '/login'
  }

  return response
}

// Helper to handle JSON responses
export const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData: any = {}
    try {
      errorData = await response.json()
    } catch (e) {
      errorData = { detail: response.statusText }
    }

    // Handle different error formats
    let errorMessage = 'Something went wrong'

    if (typeof errorData.detail === 'string') {
      // Simple error message (e.g., "Email already exists")
      errorMessage = errorData.detail
    } else if (Array.isArray(errorData.detail)) {
      // Pydantic validation errors (array of error objects)
      errorMessage = errorData.detail
        .map((err: any) => err.msg || err.message || 'Validation error')
        .join(', ')
    }

    throw new Error(errorMessage)
  }
  return response.json()
}
