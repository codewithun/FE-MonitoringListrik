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
                <img src="/logo.png" alt="WattWise Logo" className="h-24 w-24 object-contain" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Selamat Datang</h1>
            </div>

            {state.message ? (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 mb-2">
                {state.message}
              </p>
            ) : null}

            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Masukkan Email..."
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-6 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <PasswordInput
                  id="password"
                  name="password"
                  placeholder="Masukkan Password..."
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-6 px-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500 [&_button]:text-slate-500 hover:[&_button]:text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none text-slate-600"
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
              <p className="text-sm text-slate-500 font-medium">
                Belum punya akun? <Link href="/signup" className="text-blue-500 hover:text-blue-600 hover:underline ml-1">Daftar</Link>
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
              <h1 className="text-xl font-bold text-slate-900">Masuk ke <span className="text-blue-600">Watt</span><span className="text-yellow-500">Wise</span></h1>
            </div>
            {state.message ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.message}
              </p>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email" className="text-slate-700">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Masukkan email"
                autoComplete="email"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password" className="text-slate-700">Password</FieldLabel>
              </div>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Masukkan password"
                autoComplete="current-password"
                required
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 [&_button]:text-slate-500 hover:[&_button]:text-slate-900"
              />
            </Field>
            <Field>
              <Button 
                type="submit" 
                disabled={pending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                {pending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {pending ? "Masuk..." : "Masuk"}
              </Button>
            </Field>
          </FieldGroup>
        )}
      </form>
      {role === 'admin' && (
        <FieldDescription className="px-6 text-center text-slate-500 mt-4">
          Silakan masuk menggunakan akun Anda untuk melanjutkan.
        </FieldDescription>
      )}
    </div>
  )
}
