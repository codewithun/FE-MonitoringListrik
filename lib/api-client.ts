export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.zxnco.my.id"

type ApiOptions = RequestInit & {
  method?: "GET" | "POST"
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  })

  const text = await response.text()
  const data = text ? parseJson(text) : null

  if (!response.ok) {
    const message =
      getString(data, ["message", "error"]) ||
      `Request ${path} gagal (${response.status})`

    throw new Error(message)
  }

  return data as T
}

export function extractArray<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]

  if (isRecord(payload)) {
    for (const key of ["data", "items", "rows", "result", "results"]) {
      const value = payload[key]

      if (Array.isArray(value)) return value as T[]
    }
  }

  return []
}

export function getString(
  value: unknown,
  keys: string[],
  fallback = ""
) {
  const found = getValue(value, keys)

  if (found === null || found === undefined) return fallback

  return String(found)
}

export function getNumber(
  value: unknown,
  keys: string[],
  fallback = 0
) {
  const found = getValue(value, keys)
  const parsed = Number(found)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function getBoolean(value: unknown, keys: string[], fallback = false) {
  const found = getValue(value, keys)

  if (typeof found === "boolean") return found
  if (typeof found === "number") return found === 1
  if (typeof found === "string") {
    return ["1", "true", "on", "nyala"].includes(found.toLowerCase())
  }

  return fallback
}

export function getValue(value: unknown, keys: string[]) {
  if (!isRecord(value)) return undefined

  for (const key of keys) {
    if (key in value) return value[key]
  }

  return undefined
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}
