import { NextRequest, NextResponse } from "next/server"

import { SESSION_COOKIE, type SessionUser } from "@/lib/auth-constants"

const publicRoutes = ["/login", "/signup", "/forgot-password"]
const adminOnlyRoutes = ["/dashboard", "/manajemen", "/monitoring", "/analisis", "/settings"]
const userOnlyRoutes = ["/user"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const rawSession = request.cookies.get(SESSION_COOKIE)?.value

  let user: SessionUser | null = null
  if (rawSession) {
    try {
      user = JSON.parse(Buffer.from(rawSession, "base64url").toString("utf8")) as SessionUser
    } catch {
      // invalid session cookie
    }
  }

  const isAuthenticated = Boolean(user)

  // Redirect to login if accessing protected routes without auth
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to respective dashboard if already authenticated and accessing public routes
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL(user?.role === "admin" ? "/dashboard" : "/user", request.url))
  }

  // Role Based Access Control (RBAC)
  if (isAuthenticated && user) {
    const isAdminRoute = adminOnlyRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))
    const isUserRoute = userOnlyRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))

    if (isAdminRoute && user.role !== "admin") {
      // User trying to access Admin route
      return NextResponse.redirect(new URL("/user", request.url))
    }

    if (isUserRoute && user.role !== "user") {
      // Admin trying to access User route
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
