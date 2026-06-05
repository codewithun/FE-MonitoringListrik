"use client"

import { useMemo, type ReactNode } from "react"

import { SectionShellClient } from "@/components/section-shell-client"
import { SESSION_COOKIE, type SessionUser } from "@/lib/auth-constants"

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")

  return window.atob(padded)
}

function getSessionFromCookie(): SessionUser {
  const fallbackUser: SessionUser = {
    id: "guest",
    username: "User",
    email: "Belum login",
    role: "user",
  }

  if (typeof document === "undefined") {
    return fallbackUser
  }

  const rawCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1]

  if (!rawCookie) {
    return fallbackUser
  }

  try {
    return JSON.parse(decodeBase64Url(decodeURIComponent(rawCookie))) as SessionUser
  } catch {
    return fallbackUser
  }
}

export function SectionShell({ children }: { children: ReactNode }) {
  const user = useMemo(() => getSessionFromCookie(), [])

  return <SectionShellClient user={user}>{children}</SectionShellClient>
}
