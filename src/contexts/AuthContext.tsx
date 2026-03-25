import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { getSession, logout, type AuthSession } from '../server/auth'

interface AuthContextValue {
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  refresh: (force?: boolean) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)

  const refresh = useCallback(async (force = false) => {
    // Prevent multiple simultaneous checks on initial load
    // But allow forced refreshes (e.g., after login)
    if (!force && hasChecked && !isLoading) return

    try {
      setIsLoading(true)
      const result = await getSession()
      setSession(result)
    } catch (error) {
      console.error('[Auth] Failed to get session:', error)
      setSession(null)
    } finally {
      setIsLoading(false)
      setHasChecked(true)
    }
  }, [hasChecked, isLoading])

  const signOut = useCallback(async () => {
    try {
      await logout()
      // Cookie is cleared server-side via response header
      setSession(null)
    } catch (error) {
      console.error('[Auth] Failed to logout:', error)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: session !== null,
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
