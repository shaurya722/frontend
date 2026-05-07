// Auth utilities - Frontend-only authentication

export interface LoginCredentials {
  email?: string
  username?: string
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
  const { login: apiLogin, getProfile } = await import('./axios-instance')
  const username = credentials.username ?? credentials.email ?? ''
  if (!username || !credentials.password) {
    throw new Error('Invalid username or password')
  }
  await apiLogin(username, credentials.password)
  const profile = await getProfile()
  const user: User = {
    id: Number(profile?.id ?? 0),
    email: String(profile?.email ?? username),
    first_name: String(profile?.first_name ?? ''),
    last_name: String(profile?.last_name ?? ''),
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user))
  }
  return user
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
