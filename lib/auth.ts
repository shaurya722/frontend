import * as api from "./api"

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  name: string
  role: string
  email: string
}

// Demo users for fallback authentication (when backend is not available)
const demoUsers = {
  admin: {
    id: "1",
    password: "admin123",
    name: "John Cardella",
    role: "Administrator",
    email: "admin@arcgis-compliance.com",
  },
  analyst: {
    id: "2",
    password: "analyst123",
    name: "Sarah Wilson",
    role: "Compliance Analyst",
    email: "analyst@arcgis-compliance.com",
  },
  viewer: {
    id: "3",
    password: "viewer123",
    name: "Mike Johnson",
    role: "Viewer",
    email: "viewer@arcgis-compliance.com",
  },
}

/**
 * Login with username and password
 * Uses Django backend API, falls back to demo users if API fails
 * 
 * Backend API: POST /api/v1/auth/login/
 * Postman: Authentication > Login
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser | null> {
  try {
    console.log("[auth] Attempting backend API login...")
    const response = await api.login(credentials)
    
    if (response.data) {
      const { user } = response.data
      api.storeUser(user)
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      }
    }
    
    if (response.error) {
      console.log("[auth] Backend login failed:", response.error)
    }

    // Fallback: Check demo users (for development/demo purposes)
    const demoUser = demoUsers[credentials.username as keyof typeof demoUsers]
    if (demoUser && demoUser.password === credentials.password) {
      console.log("[auth] Using demo user fallback")
      return {
        id: demoUser.id,
        username: credentials.username,
        name: demoUser.name,
        role: demoUser.role,
        email: demoUser.email,
      }
    }

    // Check if it's a dynamically created user (stored locally)
    if (typeof window !== "undefined") {
      const storedUsers = localStorage.getItem("system_users")
      if (storedUsers) {
        const users = JSON.parse(storedUsers)
        const user = users.find((u: any) => u.username === credentials.username && u.status === "Active")

        if (user) {
          return {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            email: user.email,
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error("[auth] Login error:", error)
    return null
  }
}

/**
 * Logout user
 * Clears tokens and user data
 * 
 * Backend API: Clears JWT tokens
 */
export function logout(): void {
  api.logout()
}

/**
 * Update user profile
 * 
 * Backend API: PUT /api/v1/auth/users/update_profile/
 * Postman: Users > Update Profile
 */
export async function updateUserProfile(userId: string, updates: Partial<AuthUser>) {
  try {
    const response = await api.updateProfile(updates as any)
    if (response.data) {
      api.storeUser(response.data)
      return response.data
    }
    if (response.error) {
      throw new Error(response.error)
    }
    
    // Mock update for demo
    console.log("[auth] Mock profile update:", updates)
    return updates
  } catch (error) {
    console.error("[auth] Update profile error:", error)
    throw error
  }
}

/**
 * Change user password
 * 
 * Backend API: POST /api/v1/auth/users/change_password/
 * Postman: Users > Change Password
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    const response = await api.changePassword(currentPassword, newPassword)
    if (response.error) {
      throw new Error(response.error)
    }
    return true
  } catch (error) {
    console.error("[auth] Change password error:", error)
    throw error
  }
}

/**
 * Invite a new user
 * 
 * Backend API: POST /api/v1/auth/users/
 * Postman: Users > Create User
 */
export async function inviteUser(userData: {
  name: string
  email: string
  username: string
  role: string
  invitedBy: string
}) {
  try {
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()

    const response = await api.createUser({
      name: userData.name,
      email: userData.email,
      username: userData.username,
      role: userData.role as any,
      password: tempPassword,
    })
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    return {
      success: true,
      tempPassword,
      inviteLink: `${typeof window !== "undefined" ? window.location.origin : ""}/login?invite=${userData.username}&token=${tempPassword}`,
    }
  } catch (error) {
    console.error("[auth] Invite user error:", error)
    throw error
  }
}

/**
 * Get current authenticated user
 * 
 * Backend API: GET /api/v1/auth/users/me/
 * Postman: Users > Get Current User (Me)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    if (api.isAuthenticated()) {
      const response = await api.getCurrentUser()
      if (response.data) {
        return {
          id: response.data.id,
          username: response.data.username,
          name: response.data.name,
          role: response.data.role,
          email: response.data.email,
        }
      }
    }
    
    // Fallback to stored user
    const storedUser = api.getStoredUser()
    if (storedUser) {
      return {
        id: storedUser.id,
        username: storedUser.username,
        name: storedUser.name,
        role: storedUser.role,
        email: storedUser.email,
      }
    }
    
    return null
  } catch (error) {
    console.error("[auth] Get current user error:", error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return api.isAuthenticated()
}
