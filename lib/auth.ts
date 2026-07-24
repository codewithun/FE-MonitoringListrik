import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, type SessionUser } from "@/lib/auth-constants"

export async function getSessionUser() {
  const cookieStore = await cookies()
  const rawSession = cookieStore.get(SESSION_COOKIE)?.value

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(rawSession, "base64url").toString("utf8")) as SessionUser
  } catch {
    return null
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/user/login")
  }

  return user
}

export function encodeSessionUser(user: SessionUser) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url")
}

export function getBackendUrl() {
  return process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
}
