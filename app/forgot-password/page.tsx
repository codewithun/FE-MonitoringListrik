import { ForgotPasswordForm } from "@/components/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col bg-[#05050f] text-white">
      <div className="w-full flex-1 flex flex-col justify-center">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
