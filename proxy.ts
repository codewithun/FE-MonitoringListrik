import { NextRequest, NextResponse } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth-constants"

const publicRoutes = ["/login", "/signup"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthenticated = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
