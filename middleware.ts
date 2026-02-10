import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (pathname === "/login" || pathname === "/" || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  // For dashboard routes, let the client-side AuthGuard handle protection
  // This prevents the multiple Supabase client instances warning
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
