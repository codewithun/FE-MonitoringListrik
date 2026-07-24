"use client"

import { useActionState, useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Loader2, CheckCircle2, Check, ChevronLeft } from "lucide-react"

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
  const [isPending, startTransition] = useTransition()

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



        {currentStep === 1 && (
          <form action={otpAction} className="w-full mt-6">
            <div className="flex flex-col gap-6 px-6 h-full w-full max-w-md mx-auto">
              <div className="flex flex-col items-center gap-4 text-center mb-2">
                <div className="flex items-center justify-center">
                  <img src="/logo.png" alt="WattWise Logo" className="h-14 w-14 object-contain" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mt-2">Lupa Password</h1>
              </div>

              {otpState.message && !isOtpSuccess ? (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 mb-2">
                  {otpState.message}
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
              </div>

              <Button 
                type="submit" 
                disabled={otpPending}
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-7 text-lg font-semibold mt-4 transition-colors"
              >
                {otpPending ? <Loader2 className="animate-spin mr-2" /> : null}
                {otpPending ? "Mengirim OTP..." : "Kirim Kode OTP"}
              </Button>

              <div className="text-center mt-6">
                <p className="text-sm text-white/50 font-medium">
                  Ingat password? <Link href="/user/login" className="text-blue-500 hover:text-blue-400 hover:underline ml-1">Masuk</Link>
                </p>
              </div>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form action={resetAction} className="w-full mt-6">
            <div className="flex flex-col gap-6 px-6 h-full w-full max-w-md mx-auto relative pt-12 sm:pt-8">
              <button 
                type="button" 
                onClick={() => window.location.reload()} 
                className="absolute top-0 left-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-white">Masukkan OTP</h1>
                <div className="text-white/70 text-sm mt-2">
                  <p>Kami telah mengirimkan kode OTP ke email Anda,</p>
                  <p className="font-semibold text-blue-500 mt-1">{savedEmail}</p>
                </div>
              </div>

              {resetMessageText && !isResetSuccess ? (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 mb-2">
                  {resetMessageText}
                </p>
              ) : null}

              <input type="hidden" name="email" value={savedEmail || ""} />

              {verifyStep === 0 ? (
                <div className="flex flex-col gap-8 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-center w-full">
                    <InputOTP maxLength={6} id="otp" name="otp" value={otpValue} onChange={setOtpValue} required>
                      <InputOTPGroup className="gap-3 sm:gap-4 flex">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot 
                            key={index} 
                            index={index} 
                            className="rounded-xl sm:rounded-2xl border-2 border-[#1E1B4B] bg-transparent text-white text-2xl font-bold w-12 h-14 sm:w-14 sm:h-16 ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500" 
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="flex items-center justify-center -mt-2">
                    {resendCountdown > 0 ? (
                      <span className="text-sm text-white/70">
                        Kami akan mengirim ulang kode dalam <span className="font-semibold text-blue-500">{resendCountdown} dtk</span>
                      </span>
                    ) : (
                      <div className="inline-block">
                        <span className="text-sm text-white/70">
                          Belum menerima kode?{" "}
                          <Button 
                            variant="link" 
                            className="h-auto p-0 text-sm text-blue-500 hover:text-blue-400 font-semibold"
                            type="submit"
                            formAction={otpAction}
                            disabled={otpPending}
                          >
                            Kirim Ulang
                          </Button>
                        </span>
                      </div>
                    )}
                  </div>

                  {verifyState.message && !verifyState.message.startsWith("SUCCESS_VERIFY:") ? (
                    <p className="text-red-500 text-sm text-center font-medium -mt-4">
                      {verifyState.message}
                    </p>
                  ) : null}

                  <Button
                    type="button"
                    onClick={() => {
                      const formData = new FormData()
                      formData.append("email", savedEmail || "")
                      formData.append("otp", otpValue)
                      startTransition(() => {
                        executeVerifyAction(formData)
                      })
                    }}
                    disabled={otpValue.length < 6 || verifyPending}
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-7 text-lg font-semibold transition-colors"
                  >
                    {verifyPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {verifyPending ? "Memverifikasi..." : "Verifikasi"}
                  </Button>
                </div>
              ) : verifyStep === 1 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">OTP Berhasil Diverifikasi</h3>
                  <p className="text-white/50 text-center text-sm px-4">
                    Silakan klik tombol di bawah untuk membuat password baru Anda.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setVerifyStep(2)}
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-6 mt-6 font-semibold transition-colors"
                  >
                    Buat Password Baru
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 duration-300">
                  <input type="hidden" name="otp" value={otpValue} />
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium text-white/90">Password Baru</label>
                    <PasswordInput
                      id="newPassword"
                      name="newPassword"
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border-white/10 bg-white/5 py-6 px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500 [&_button]:text-white/50 hover:[&_button]:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-white/90">Konfirmasi Password Baru</label>
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Ulangi password baru"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-2xl border-white/10 bg-white/5 py-6 px-4 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-blue-500 [&_button]:text-white/50 hover:[&_button]:text-white"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={resetPending}
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-7 text-lg font-semibold mt-4 transition-colors"
                  >
                    {resetPending ? <Loader2 className="mr-2 animate-spin" /> : null}
                    {resetPending ? "Menyimpan Password..." : "Simpan Password Baru"}
                  </Button>
                </div>
              )}

              {verifyStep === 0 && (
                <div className="text-center mt-6">
                  <p className="text-sm text-white/70 font-medium">
                    Sudah punya akun? <Link href="/user/login" className="text-blue-500 hover:text-blue-400 font-semibold ml-1">Masuk</Link>
                  </p>
                </div>
              )}
            </div>
          </form>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 px-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2 animate-in zoom-in duration-500">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Password Berhasil Diubah!</h2>
            <p className="text-white/50 text-center text-sm px-4">
              Anda sekarang dapat menggunakan password baru Anda untuk masuk ke dalam aplikasi.
            </p>
            <div className="pt-6 w-full">
              <Button asChild className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold transition-colors">
                <Link href="/user/login">
                  Kembali ke Halaman Login
                </Link>
              </Button>
            </div>
          </div>
        )}

    </div>
  )
}
