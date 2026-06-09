import { UserPwaApp } from "@/components/user-pwa-app"
import { requireSessionUser } from "@/lib/auth"

export default async function UserPage() {
  const user = await requireSessionUser()

  return <UserPwaApp user={user} />
}
