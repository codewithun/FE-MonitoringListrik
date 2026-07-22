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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, pending] = useActionState(loginAction, {})

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={action}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-md overflow-hidden">
                <img src="/logo.png" alt="WattWise Logo" className="h-full w-full object-contain" />
              </div>
              <span className="sr-only">WattWise</span>
            </Link>
            <h1 className="text-xl font-bold">Masuk ke WattWise</h1>
            <FieldDescription>
              Belum punya akun? <Link href="/signup">Daftar</Link>
            </FieldDescription>
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
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
      </form>
      <FieldDescription className="px-6 text-center">
        Silakan masuk menggunakan akun Anda untuk melanjutkan.
      </FieldDescription>
    </div>
  )
}
