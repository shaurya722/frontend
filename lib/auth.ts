// Auth utilities - Frontend-only authentication

export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
}

export interface LoginResponse {
  refresh: string
  access: string
  user: User
}

export async function login(credentials: LoginCredentials): Promise<User> {
  // Frontend-only authentication with dummy credentials
  if (credentials.email === 'admin' && credentials.password === 'admin123') {
    const mockUser: User = {
      id: 1,
      email: 'admin',
      first_name: 'Admin',
      last_name: 'User',
    }

    // Store mock tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', 'mock_access_token')
      localStorage.setItem('refresh_token', 'mock_refresh_token')
      localStorage.setItem('user', JSON.stringify(mockUser))
    }

    return mockUser
  }

  throw new Error('Invalid username or password')
}

export async function logout(): Promise<void> {
  // Clear local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  
  const userData = localStorage.getItem('user')
  return userData ? JSON.parse(userData) : null
}
