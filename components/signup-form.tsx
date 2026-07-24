"use client"

import { useActionState } from "react"
import Link from "next/link"
import { GalleryVerticalEnd, Loader2 } from "lucide-react"

import { signupAction } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, pending] = useActionState(signupAction, {})

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={action} className="w-full">
        <div className="flex flex-col gap-6 px-6 py-8 h-full w-full max-w-md mx-auto">
          {/* Custom PWA Header */}
          <div className="flex flex-col items-center gap-4 text-center mt-2 mb-4">
            <div className="flex items-center justify-center">
              <img src="/logo.png" alt="WattWise Logo" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">Daftar Akun</h1>
          </div>

          {state.message ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 mb-2">
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-white/90">Username</label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="namauser"
                autoComplete="username"
                required
                className="w-full rounded-2xl border-white/10 bg-white/5 py-6 px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/90">Email address</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="user@monitoring-listrik.local"
                autoComplete="email"
                required
                className="w-full rounded-2xl border-white/10 bg-white/5 py-6 px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/90">Password</label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                required
                className="w-full rounded-2xl border-white/10 bg-white/5 py-6 px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500 [&_button]:text-white/50 hover:[&_button]:text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-white/90">Konfirmasi Password</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Ulangi password"
                autoComplete="new-password"
                required
                className="w-full rounded-2xl border-white/10 bg-white/5 py-6 px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500 [&_button]:text-white/50 hover:[&_button]:text-white"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={pending}
            className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-7 text-lg font-semibold mt-4 transition-colors"
          >
            {pending ? <Loader2 className="animate-spin mr-2" /> : null}
            {pending ? "Mendaftarkan..." : "Daftar Akun"}
          </Button>

          <div className="text-center mt-6">
            <p className="text-sm text-white/50 font-medium">
              Sudah punya akun? <Link href="/user/login" className="text-blue-500 hover:text-blue-400 hover:underline ml-1">Masuk</Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
