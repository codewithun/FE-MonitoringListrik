import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col bg-white text-slate-900">
      <div className="w-full flex-1 flex flex-col justify-center">
        <SignupForm />
      </div>
    </div>
  )
}