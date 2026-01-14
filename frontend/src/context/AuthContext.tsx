'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { setAuthToken, getAuthToken, removeAuthToken } from '@/lib/auth'
import { handleResponse, authFetch } from '@/lib/api'

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: { id: string; email: string; name: string } | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUserFromToken = useCallback(async (authToken: string) => {
    try {
      // In a real app, you might have an /auth/me endpoint to fetch user details
      // using the token. For now, we'll decode the token to get the user ID
      // and potentially fetch from /users/{id} if more data is needed.
      // For this example, we'll assume the token can provide basic user info.
      // This is a simplified approach, a real backend would typically send user info with login.

      // For now, let's just assume if there's a token, the user is 'valid' for demonstration.
      // We need a way to get user details for the `user` state.
      // If the backend login/signup returns user data, we can store it.
      // Since it's not explicitly defined how backend returns full user info on token check,
      // let's assume we can derive user ID from token (e.g. JWT payload 'sub')
      // and for name/email, we might need a separate endpoint or they come with login.
      // For simplicity, let's keep user as null initially or fetch minimum info if possible.

      // Re-evaluating: the login/signup responses in the README examples
      // DO return user details along with the token.
      // So, the user object can be populated directly from login/signup.
      // For token persistence across sessions, we need to refresh or re-fetch user if token valid.

      // If a token exists and no user is set, try to get user info.
      // This part would ideally hit a /users/me endpoint.
      // For now, if we have a token, we assume basic auth.
      // The user object would ideally be fully hydrated here.
      // Let's defer full user object hydration until a proper /me endpoint is available
      // or rely solely on login/signup response to set the user.

      // Let's try to decode the token on the frontend to get the user ID
      // This is not secure for sensitive info, but okay for user ID to fetch public profile.
      // Not doing actual JWT decode here for security reasons on frontend,
      // just noting that a backend /me endpoint is ideal.

      setToken(authToken)
      // For now, let's keep user as null if we cannot hydrate it securely and completely from frontend.
      // Or set a placeholder user based on the presence of the token.
      // For demo, let's simulate a user object if token exists.
      // The actual `user` object should come from a successful login/signup or a `/me` endpoint.
      // The `TaskListPage` needs `user.id`.

      // Let's modify the login/signup function to set the user in state from response.
      // And if token is found on init, for now we can't fully hydrate user.
      // This implies we need to decide on a `/me` endpoint or how user data persists.

      // For now, if token is present, we consider them authenticated, but `user` object might be minimal.
      // The `TaskListPage` is only using `user.id` so let's provide a minimal user object based on token presence.
      // This is a compromise for demonstration without a /me endpoint.

      // For current TaskList, `user_id` is derived from token (sub claim) or provided by login.
      // If we need to hydrate `user` from a stored token, we need a backend endpoint.
      // For now, let's just verify token and if valid, set a placeholder user.id
      // This is not ideal, but allows progress.

      // The backend auth.py's `decode_token` extracts "sub". So let's imagine a "decode" call here too.
      // This is a simplification; in a real app, only backend should decode full token.
      // For frontend, usually just send token and if 200, user is valid.
      // For `user` object, the login/signup response is the source.

      // Let's adjust to simplify: if token is present in localStorage,
      // we'll assume the user is logged in. The `user` object will be set
      // only upon explicit login/signup call that provides full user data.
      // If a user refreshes the page and token is there, they are authenticated
      // but their full user object might not be immediately available until
      // a subsequent action that fetches user details or a `/me` endpoint.

      // Okay, new strategy based on provided info:
      // The backend `auth` module returns `token` and `user` object on login/signup.
      // So, if we log in/signup, we get the user.
      // If we find a token in local storage, how do we get the `user`?
      // The `AuthContextType` needs `user` to be consistent.
      // We *must* have a `/me` endpoint on the backend if we want `user` to be populated
      // when `token` is just retrieved from `localStorage` on app load.

      // Let's implement a dummy /me or assume user data from token if valid (for now)
      // OR, simply, upon finding a token, assume authenticated and require subsequent
      // calls to populate user data. TaskList only needs `user.id`.

      // **Revised Strategy for AuthContext:**
      // 1. On component mount: check localStorage for token.
      // 2. If token exists: set `token` state. Try to fetch user details with the token (e.g., call `/auth/me`).
      // 3. If `/auth/me` is successful: set `user` state.
      // 4. If no token or `/auth/me` fails: set `token` and `user` to `null`.
      // 5. Login/Signup functions will set both `token` and `user` from API response.

      // Let's add a dummy /auth/me call, assuming it exists on backend.
      // This endpoint needs to be implemented on the backend as well.
      // AuthUser interface is now defined at the top of the file.

      const response = await authFetch('/auth/me', { authToken }); // Assuming /auth/me exists
      if (response.ok) {
        const userData: AuthUser = await handleResponse(response);
        setUser(userData);
      } else {
        removeAuthToken();
        setToken(null);
        setUser(null);
      }

    } catch (err) {
      console.error('Failed to fetch user from token:', err);
      removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = getAuthToken();
    if (storedToken) {
      fetchUserFromToken(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUserFromToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const response = await authFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          authToken: null, // Don't send old token for login
        });
        const data = await handleResponse<{ token: string; user: AuthUser }>(response);
        setAuthToken(data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        router.push('/tasks'); // Redirect to tasks on successful login
        return { success: true };
      } catch (err) {
        console.error('Login failed:', err);
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
        return { success: false, error: errorMessage };
      }
    },
    [router]
  );

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      setLoading(true);
      try {
        const response = await authFetch('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
          authToken: null, // Don't send old token for signup
        });
        const data = await handleResponse<{ token: string; user: AuthUser }>(response);
        setAuthToken(data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        router.push('/tasks'); // Redirect to tasks on successful signup
        return { success: true };
      } catch (err) {
        console.error('Signup failed:', err);
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
        return { success: false, error: errorMessage };
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    removeAuthToken();
    setToken(null);
    setUser(null);
    router.push('/login'); // Redirect to login on logout
  }, [router]);

  const refreshUser = useCallback(async () => {
    const storedToken = getAuthToken();
    if (storedToken) {
      await fetchUserFromToken(storedToken);
    }
  }, [fetchUserFromToken]);

  const contextValue = React.useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
