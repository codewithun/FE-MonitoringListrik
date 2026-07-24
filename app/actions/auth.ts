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
    avatar?: string
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
  redirect(result.user.role === "user" ? "/user" : "/admin/dashboard")
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
  redirect("/user/login")
}

export async function adminLogoutAction() {
  const cookieStore = await cookies()

  cookieStore.delete(SESSION_COOKIE)
  redirect("/admin/login")
}

export async function requestOtpAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase()

  if (!email) {
    return { message: "Email wajib diisi." }
  }

  let response: Response

  try {
    response = await fetch(`${getBackendUrl()}/api/auth/request-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
  } catch {
    return { message: `Backend tidak bisa dihubungi di ${getBackendUrl()}.` }
  }

  const body = (await response.json().catch(() => null)) as AuthResponse | null

  if (!response.ok || !body?.success) {
    return { message: body?.message || "Gagal mengirim OTP. Pastikan email terdaftar." }
  }

  return { message: "SUCCESS_OTP:" + email + ":" + Date.now() }
}

export async function verifyOtpAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const otp = String(formData.get("otp") || "").trim()

  if (!email || !otp) {
    return { message: "Email dan OTP wajib diisi." }
  }

  let response: Response

  try {
    response = await fetch(`${getBackendUrl()}/api/auth/verify-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })
  } catch {
    return { message: `Backend tidak bisa dihubungi di ${getBackendUrl()}.` }
  }

  const body = (await response.json().catch(() => null)) as AuthResponse | null

  if (!response.ok || !body?.success) {
    return { message: body?.message || "Gagal verifikasi OTP." }
  }

  return { message: "SUCCESS_VERIFY:" + email }
}

export async function resetPasswordWithOtpAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const otp = String(formData.get("otp") || "").trim()
  const newPassword = String(formData.get("newPassword") || "")
  const confirmPassword = String(formData.get("confirmPassword") || "")

  if (!email || !otp || !newPassword) {
    return { message: "Email, OTP, dan password baru wajib diisi." }
  }

  if (newPassword.length < 8) {
    return { message: "Password baru minimal 8 karakter." }
  }

  if (newPassword !== confirmPassword) {
    return { message: "Konfirmasi password belum sama." }
  }

  let response: Response

  try {
    response = await fetch(`${getBackendUrl()}/api/auth/reset-password-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    })
  } catch {
    return { message: `Backend tidak bisa dihubungi di ${getBackendUrl()}.` }
  }

  const body = (await response.json().catch(() => null)) as AuthResponse | null

  if (!response.ok || !body?.success) {
    return { message: body?.message || "Gagal mereset password. Pastikan kode OTP benar dan belum kedaluwarsa." }
  }

  return { message: "SUCCESS_RESET:" + (body.message || "Password berhasil diubah. Silakan masuk.") }
}
