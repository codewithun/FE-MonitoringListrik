import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-white text-slate-900">
      <div className="w-full flex-1 flex flex-col justify-center">
        <LoginForm role="user" />
      </div>
    </div>
  )
}
