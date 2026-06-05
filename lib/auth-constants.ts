export const SESSION_COOKIE = "monitoring_listrik_session"

export type SessionUser = {
  id: string
  username: string
  email: string
  role: "admin" | "user"
}
