"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  username: string
  name: string
  role: string
  loginTime: string
}

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log("[v0] AuthGuard checking authentication for:", pathname)
        const userData = localStorage.getItem("user")

        if (userData) {
          const parsedUser = JSON.parse(userData)
          console.log("[v0] User found:", parsedUser.username, "Role:", parsedUser.role)
          setUser(parsedUser)
        } else {
          console.log("[v0] No user session found")
          if (pathname !== "/login" && pathname !== "/") {
            console.log("[v0] Redirecting to login")
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        if (pathname !== "/login" && pathname !== "/") {
          router.push("/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user && pathname !== "/login" && pathname !== "/") {
    return null
  }

  return <>{children}</>
}
