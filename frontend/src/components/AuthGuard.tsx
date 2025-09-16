import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, user, refreshToken } = useAuthStore()
  const location = useLocation()

  // TEMPORARY: Bypass authentication for demo purposes
  const BYPASS_AUTH = true

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshToken().catch(() => {
        // If refresh fails, user will be logged out automatically
      })
    }
  }, [isAuthenticated, user, refreshToken])

  // Allow bypass for demo
  if (BYPASS_AUTH) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}