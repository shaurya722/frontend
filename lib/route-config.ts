// Route configuration for protected and public routes

export const publicRoutes = [
  '/login',
  '/dashboard',
  '/dashboard/communities',
  '/dashboard/rules',
]

export const protectedRoutes = [
  // '/dashboard',
  '/auth',
  // '/dashboard/communities',
  // '/dashboard/rules',
]

export const defaultProtectedRoute = '/auth'
export const defaultPublicRoute = '/login'

export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route))
}

export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}
