"use client"

import { useActionState } from "react"
import Link from "next/link"
import { GalleryVerticalEnd, Loader2 } from "lucide-react"

import { loginAction } from "@/app/actions/auth"
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
import { Checkbox } from "@/components/ui/checkbox"

export function LoginForm({
  className,
  role = 'user',
  ...props
}: React.ComponentProps<"div"> & { role?: 'admin' | 'user' }) {
  const [state, action, pending] = useActionState(loginAction, {})

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={action}>
        {role === 'user' ? (
          <div className="flex flex-col gap-6 px-6 py-8 h-full w-full max-w-md mx-auto">
            {/* Custom PWA Header */}
            <div className="flex flex-col items-center gap-4 text-center mt-6 mb-4">
              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="WattWise Logo" className="h-14 w-14 object-contain" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-2">Selamat Datang</h1>
            </div>

            {/* Google Sign-in */}
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl border border-white/10 bg-transparent py-6 hover:bg-white/5 text-white flex items-center justify-center gap-3 transition-colors"
              onClick={() => {
                // Implement Google OAuth if needed
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.72 16.7 5.84 14.1H2.15V16.96C3.97 20.58 7.68 23 12 23Z" fill="#34A853" />
                <path d="M5.84 14.1C5.61 13.44 5.48 12.74 5.48 12C5.48 11.26 5.61 10.56 5.84 9.9V7.04H2.15C1.4 8.54 0.96 10.22 0.96 12C0.96 13.78 1.4 15.46 2.15 16.96L5.84 14.1Z" fill="#FBBC05" />
                <path d="M12 5.38C13.62 5.38 15.07 5.94 16.22 7.03L19.36 3.89C17.46 2.12 14.97 1 12 1C7.68 1 3.97 3.42 2.15 7.04L5.84 9.9C6.72 7.3 9.14 5.38 12 5.38Z" fill="#EA4335" />
              </svg>
              <span className="font-semibold">Sign up with Google</span>
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#05050f] px-4 text-white/50 font-medium">Or Sign In With</span>
              </div>
            </div>

            {state.message ? (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 mb-2">
                {state.message}
              </p>
            ) : null}

            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white/90">Email address</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tanya.hill@example.com"
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
                  placeholder="*******"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border-white/10 bg-white/5 py-6 px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500 [&_button]:text-white/50 hover:[&_button]:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none text-white/70"
                >
                  Tetap Masuk
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm font-medium text-blue-500 hover:text-blue-400 hover:underline">
                Lupa password?
              </Link>
            </div>

            <Button 
              type="submit" 
              disabled={pending}
              className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-7 text-lg font-semibold mt-4 transition-colors"
            >
              {pending ? <Loader2 className="animate-spin mr-2" /> : null}
              {pending ? "Memasuki..." : "Masuk"}
            </Button>

            <div className="text-center mt-6">
              <p className="text-sm text-white/50 font-medium">
                Belum punya akun? <Link href="/signup" className="text-blue-500 hover:text-blue-400 hover:underline ml-1">Daftar</Link>
              </p>
            </div>
          </div>
        ) : (
          <FieldGroup>
            {/* Admin layout */}
            <div className="flex flex-col items-center gap-2 text-center">
              <Link
                href="/admin/dashboard"
                className="flex flex-col items-center gap-2 font-medium"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-md overflow-hidden">
                  <img src="/logo.png" alt="WattWise Logo" className="h-full w-full object-contain" />
                </div>
                <span className="sr-only">WattWise</span>
              </Link>
              <h1 className="text-xl font-bold">Masuk ke <span className="text-blue-600">Watt</span><span className="text-yellow-500">Wise</span></h1>
            </div>
            {state.message ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.message}
              </p>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@monitoring-listrik.local"
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                {pending ? "Masuk..." : "Masuk"}
              </Button>
            </Field>
          </FieldGroup>
        )}
      </form>
      {role === 'admin' && (
        <FieldDescription className="px-6 text-center">
          Silakan masuk menggunakan akun Anda untuk melanjutkan.
        </FieldDescription>
      )}
    </div>
  )
}
