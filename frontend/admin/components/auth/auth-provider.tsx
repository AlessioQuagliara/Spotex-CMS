/**
 * Auth Provider for Admin Dashboard
 * Manages authentication state and session persistence
 */
'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, getAccessToken, setAccessToken, setRefreshToken, type User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasRole: (roles: string | string[]) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Session timeout in milliseconds (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const router = useRouter()

  // Update last activity timestamp
  const updateActivity = () => {
    setLastActivity(Date.now())
  }

  // Check and refresh user session
  const refreshUser = async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const userData = await authApi.getMe()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      setAccessToken(null)
      setRefreshToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  // emailOrUsername: can be either email or username
  const login = async (emailOrUsername: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authApi.login({ username: emailOrUsername, password })
      setUser(response.user)
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true')
      } else {
        localStorage.removeItem('remember_me')
      }

      // Reset activity timer
      setLastActivity(Date.now())
      
      // Don't redirect here - let the calling component handle navigation
      // This allows for custom returnUrl handling
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('remember_me')
      router.push('/login')
    }
  }

  // Check if user has specific role(s)
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  // Check if user has specific permission
  // This is a simplified version - expand based on your permission system
  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    // Admin has all permissions
    if (user.role === 'admin') return true

    // Define permissions per role
    const rolePermissions: Record<string, string[]> = {
      editor: [
        'posts:read',
        'posts:create',
        'posts:update',
        'posts:delete',
        'pages:read',
        'pages:create',
        'pages:update',
        'media:read',
        'media:upload',
      ],
      author: [
        'posts:read',
        'posts:create',
        'posts:update',
        'media:read',
        'media:upload',
      ],
      subscriber: ['posts:read'],
    }

    return rolePermissions[user.role]?.includes(permission) || false
  }

  // Initialize auth state on mount
  useEffect(() => {
    refreshUser()
  }, [])

  // Track user activity for auto-logout
  useEffect(() => {
    if (!user) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    events.forEach((event) => {
      window.addEventListener(event, updateActivity)
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [user])

  // Check for session timeout
  useEffect(() => {
    if (!user) return

    const rememberMe = localStorage.getItem('remember_me') === 'true'
    
    // Skip auto-logout if remember me is enabled
    if (rememberMe) return

    const interval = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivity

      if (inactiveDuration > SESSION_TIMEOUT) {
        logout()
        alert('Your session has expired due to inactivity. Please login again.')
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user, lastActivity])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    hasRole,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
