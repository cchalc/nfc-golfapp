import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook to require authentication for a route.
 * Redirects to /login if not authenticated.
 *
 * @param redirectTo - The path to redirect to (default: /login)
 * @returns The auth context values
 */
export function useRequireAuth(redirectTo = '/login') {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Include current path as redirect param
      const currentPath = window.location.pathname + window.location.search
      const loginUrl =
        currentPath && currentPath !== '/'
          ? `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
          : redirectTo

      navigate({ to: loginUrl })
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate, redirectTo])

  return auth
}
