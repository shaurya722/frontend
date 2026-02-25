'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isProtectedRoute, isPublicRoute, defaultPublicRoute, defaultProtectedRoute } from '@/lib/route-config'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user')
      const isAuthenticated = !!userData

      // If user is authenticated and on a public route, redirect to protected route
      if (isAuthenticated && isPublicRoute(pathname)) {
        window.location.href = defaultProtectedRoute
        return
      }

      // If user is not authenticated and on a protected route, redirect to login
      if (!isAuthenticated && isProtectedRoute(pathname)) {
        window.location.href = defaultPublicRoute
        return
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [pathname, router])

  // Show loading state while checking authentication
  if (isChecking && (isProtectedRoute(pathname) || isPublicRoute(pathname))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
