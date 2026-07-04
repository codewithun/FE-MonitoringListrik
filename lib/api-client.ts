export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.zxnco.my.id"

type ApiOptions = RequestInit & {
  method?: "GET" | "POST" | "PUT" | "DELETE"
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const method = options.method ?? "GET"
  const requestUrl = `${API_BASE_URL}${path}`
  let response: Response

  try {
    response = await fetchWithRetry(requestUrl, {
      ...options,
      method,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    throw new Error(getNetworkErrorMessage(path, error))
  }

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

async function fetchWithRetry(url: string, options: ApiOptions) {
  const retryCount = options.method === "GET" ? 1 : 0
  let lastError: unknown

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await fetch(url, options)
    } catch (error) {
      lastError = error

      if (attempt < retryCount) {
        await wait(400)
      }
    }
  }

  throw lastError
}

function wait(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

function getNetworkErrorMessage(path: string, error: unknown) {
  const rawMessage = error instanceof Error ? error.message : ""
  const isGenericFetchError =
    !rawMessage ||
    rawMessage === "Load failed" ||
    rawMessage === "Failed to fetch" ||
    rawMessage === "NetworkError when attempting to fetch resource."

  if (!isGenericFetchError) {
    return rawMessage
  }

  return `Tidak bisa menghubungi backend untuk ${path}. Cek koneksi, CORS/SSL, atau pastikan ${API_BASE_URL} bisa diakses dari browser.`
}

export async function rawApiRequest(path: string, options: ApiOptions = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  })
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
    const lower = found.toLowerCase().trim()
    return ["1", "true", "on", "nyala", "yes", "yes"].includes(lower)
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
