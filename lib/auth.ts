// Auth utilities - API integration

import axiosInstance from './axios-instance'

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
  try {
    const response = await axiosInstance.post<LoginResponse>('/accounts/login/', {
      email: credentials.email,
      password: credentials.password,
    })

    const { access, refresh, user } = response.data

    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
    }

    return user
  } catch (error: any) {
    console.error('Login error:', error)
    throw new Error(error.message || 'Login failed')
  }
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
