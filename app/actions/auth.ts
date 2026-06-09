"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE, type SessionUser } from "@/lib/auth-constants"
import { encodeSessionUser, getBackendUrl } from "@/lib/auth"

type AuthState = {
  message?: string
}

type AuthResponse = {
  success: boolean
  message?: string
  data?: {
    id: string
    username: string
    email: string
    role: "admin" | "user"
  }
}

async function submitAuth(path: "/api/auth/login" | "/api/auth/register", payload: Record<string, string>) {
  let response: Response

  try {
    response = await fetch(`${getBackendUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch {
    return {
      message: `Backend tidak bisa dihubungi di ${getBackendUrl()}. Pastikan server backend sudah jalan.`,
      user: null,
    }
  }

  const body = (await response.json().catch(() => null)) as AuthResponse | null

  if (!response.ok || !body?.success || !body.data) {
    return {
      message: body?.message || `Permintaan gagal diproses oleh backend (${response.status}).`,
      user: null,
    }
  }

  return {
    message: body.message,
    user: {
      id: body.data.id,
      username: body.data.username,
      email: body.data.email,
      role: body.data.role,
    } satisfies SessionUser,
  }
}

async function setSession(user: SessionUser) {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, encodeSessionUser(user), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
}

export async function loginAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return { message: "Email dan password wajib diisi." }
  }

  const result = await submitAuth("/api/auth/login", { email, password })

  if (!result.user) {
    return { message: result.message }
  }

  await setSession(result.user)
  redirect(result.user.role === "user" ? "/user" : "/dashboard")
}

export async function signupAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get("username") || "").trim()
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const confirmPassword = String(formData.get("confirmPassword") || "")

  if (!username || !email || !password) {
    return { message: "Username, email, dan password wajib diisi." }
  }

  if (password.length < 8) {
    return { message: "Password minimal 8 karakter." }
  }

  if (password !== confirmPassword) {
    return { message: "Konfirmasi password belum sama." }
  }

  const result = await submitAuth("/api/auth/register", { username, email, password })

  if (!result.user) {
    return { message: result.message }
  }

  await setSession(result.user)
  redirect("/user")
}

export async function logoutAction() {
  const cookieStore = await cookies()

  cookieStore.delete(SESSION_COOKIE)
  redirect("/login")
}
