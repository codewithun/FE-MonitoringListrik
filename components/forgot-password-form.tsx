"use client"

import { useActionState, useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, CheckCircle2, Check } from "lucide-react"

import { requestOtpAction, resetPasswordWithOtpAction, verifyOtpAction } from "@/app/actions/auth"
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
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [otpState, otpAction, otpPending] = useActionState(requestOtpAction, {})
  const [resetState, resetAction, resetPending] = useActionState(resetPasswordWithOtpAction, {})
  const [verifyState, executeVerifyAction, verifyPending] = useActionState(verifyOtpAction, {})
  const [otpValue, setOtpValue] = useState("")
  // 0: input OTP, 1: OTP Success Checkmark, 2: Input New Password
  const [verifyStep, setVerifyStep] = useState(0)

  const isOtpSuccess = otpState.message?.startsWith("SUCCESS_OTP:")
  const savedEmail = isOtpSuccess ? otpState.message?.split(":")[1] : ""

  const isResetSuccess = resetState.message?.startsWith("SUCCESS_RESET:")
  const resetMessageText = isResetSuccess ? resetState.message?.replace("SUCCESS_RESET:", "") : resetState.message

  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (isOtpSuccess) {
      setResendCountdown(60)
    }
  }, [otpState.message, isOtpSuccess])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCountdown])

  useEffect(() => {
    if (verifyState.message?.startsWith("SUCCESS_VERIFY:")) {
      setVerifyStep(1)
    }
  }, [verifyState.message])

  // Determine current step
  // Step 1: Request OTP
  // Step 2: Verify OTP & Reset Password
  // Step 3: Success

  let currentStep = 1
  if (isResetSuccess) {
    currentStep = 3
  } else if (isOtpSuccess) {
    currentStep = 2
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
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
          <h1 className="text-xl font-bold">Lupa Password <span className="text-blue-600">Watt</span><span className="text-yellow-500">Wise</span></h1>
          <FieldDescription>
            Ingat password? <Link href="/login">Masuk</Link>
          </FieldDescription>
        </div>

        {currentStep === 1 && (
          <form action={otpAction} className="w-full">
            <FieldGroup>
              {otpState.message && !isOtpSuccess ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {otpState.message}
                </p>
              ) : null}
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
                <Button type="submit" disabled={otpPending}>
                  {otpPending ? <Loader2 className="animate-spin" /> : null}
                  {otpPending ? "Mengirim OTP..." : "Kirim Kode OTP"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}

        {currentStep === 2 && (
          <form action={resetAction} className="w-full">
            <FieldGroup>

              {resetMessageText && !isResetSuccess ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {resetMessageText}
                </p>
              ) : null}

              <input type="hidden" name="email" value={savedEmail || ""} />

              {verifyStep === 0 ? (
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="text-center pb-2 pt-2">
                    <p className="text-muted-foreground text-sm font-medium">
                      Kami telah mengirimkan kode OTP ke email Anda,
                    </p>
                    <p className="font-semibold text-primary mt-0.5 tracking-wide">
                      {savedEmail}
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="otp">Kode OTP (6 Digit)</FieldLabel>
                    <div className="flex justify-center w-full my-2">
                      <InputOTP maxLength={6} id="otp" name="otp" value={otpValue} onChange={setOtpValue} required>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </Field>

                  <div className="flex flex-col gap-3 mt-4">
                    {verifyState.message && !verifyState.message.startsWith("SUCCESS_VERIFY:") ? (
                      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {verifyState.message}
                      </p>
                    ) : null}
                    <Button type="submit" formAction={executeVerifyAction} disabled={otpValue.length !== 6 || verifyPending}>
                      {verifyPending ? <Loader2 className="animate-spin" /> : null}
                      {verifyPending ? "Memverifikasi..." : "Verifikasi Kode OTP"}
                    </Button>
                    
                    {resendCountdown > 0 ? (
                      <div className="text-center py-2 text-sm font-medium text-muted-foreground">
                        Kami akan mengirim ulang kode dalam <span className="text-primary">{resendCountdown} s</span>
                      </div>
                    ) : (
                      <Button type="submit" formAction={otpAction} variant="outline" disabled={otpPending}>
                        {otpPending ? <Loader2 className="animate-spin" /> : null}
                        {otpPending ? "Mengirim..." : "Kirim Ulang Kode OTP"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}

              {verifyStep === 1 && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300 mt-2">
                  <input type="hidden" name="otp" value={otpValue} />
                  <div className="flex flex-col items-center justify-center text-center pt-2 pb-4">
                    <div className="h-20 w-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                      <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <Check className="h-8 w-8 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Sukses</h2>
                    <p className="text-muted-foreground text-sm">Kode OTP terverifikasi. Silakan lanjut untuk membuat password baru.</p>
                  </div>
                  <Button type="button" onClick={() => setVerifyStep(2)}>
                    Lanjut Buat Password
                  </Button>
                </div>
              )}

              {verifyStep === 2 && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300 mt-2">
                  <input type="hidden" name="otp" value={otpValue} />
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">Buat Password Baru</h2>
                    <p className="text-sm text-muted-foreground text-center">Masukkan password baru untuk akun Anda.</p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="newPassword">Password Baru</FieldLabel>
                    <PasswordInput
                      id="newPassword"
                      name="newPassword"
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Konfirmasi Password Baru</FieldLabel>
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Ulangi password baru"
                      autoComplete="new-password"
                      required
                    />
                  </Field>

                  <Field>
                    <Button type="submit" disabled={resetPending}>
                      {resetPending ? <Loader2 className="animate-spin" /> : null}
                      {resetPending ? "Menyimpan..." : "Simpan Password Baru"}
                    </Button>
                  </Field>
                </div>
              )}
            </FieldGroup>
          </form>
        )}

        {currentStep === 3 && (
          <div className="w-full">
            <FieldGroup>
              <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
                {resetMessageText}
              </p>
              <Field>
                <Button asChild type="button" variant="outline" className="w-full">
                  <Link href="/login">Kembali ke halaman Login</Link>
                </Button>
              </Field>
            </FieldGroup>
          </div>
        )}

      </FieldGroup>

      {currentStep === 1 && (
        <FieldDescription className="px-6 text-center">
          Masukkan Email Anda untuk menerima kode verifikasi OTP 6-digit.
        </FieldDescription>
      )}
    </div>
  )
}
