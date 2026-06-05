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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, pending] = useActionState(signupAction, {})

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={action}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">WattWise</span>
            </Link>
            <h1 className="text-xl font-bold">Daftar Akun WattWise</h1>
            <FieldDescription>
              Sudah punya akun? <Link href="/login">Masuk</Link>
            </FieldDescription>
          </div>
          {state.message ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="namauser"
              autoComplete="username"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="user@monitoring-listrik.local"
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
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Konfirmasi Password</FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {pending ? "Mendaftarkan..." : "Daftar"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        Akun baru otomatis dibuat sebagai role user.
      </FieldDescription>
    </div>
  )
}
