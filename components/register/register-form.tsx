"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Smartphone, CheckCircle2, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import {
  EMPTY_REGISTRATION, INDIAN_STATES, LANGUAGES, buildRegisterPayload,
  validateRegistration, type PreferredLanguage, type RegistrationErrors, type RegistrationForm,
} from "@/lib/registration"
import { useCaseContext } from "@/lib/case-context"

type OtpStage = "idle" | "sent" | "verified"

const lbl = "mb-1.5 block text-sm font-semibold text-ink-900"
const inp = "w-full rounded-md border border-softborder bg-card px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-muted-foreground focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10"
const err = "mt-1 flex items-center gap-1 text-xs font-medium text-danger-ink"

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className={err}><AlertCircle className="h-3 w-3 shrink-0" />{message}</p>
}

export function RegisterForm() {
  const router = useRouter()
  const { setUser, setAuthenticated, addTimelineEvent } = useCaseContext()
  const [form, setForm] = useState<RegistrationForm>(EMPTY_REGISTRATION)
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [otpStage, setOtpStage] = useState<OtpStage>("idle")
  const [otpInput, setOtpInput] = useState("")
  const [otpError, setOtpError] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function update<K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function sendOtp() {
    if (!/^\d{10}$/.test(form.mobile_number)) {
      setErrors((prev) => ({ ...prev, mobile_number: "Enter a 10-digit mobile number, no country code." }))
      return
    }

    setSendingOtp(true)
    setOtpError("")
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+91${form.mobile_number}` }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setOtpError(data.error || "Failed to send OTP. Please try again.")
        setErrors((prev) => ({ ...prev, mobile_number: data.error }))
        return
      }

      setOtpStage("sent")
      setOtpError("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again."
      setOtpError(msg)
    } finally {
      setSendingOtp(false)
    }
  }

  async function verifyOtp() {
    if (!/^\d{4,10}$/.test(otpInput.trim())) {
      setOtpError("Enter the verification code sent to your mobile.")
      return
    }

    setVerifyingOtp(true)
    setOtpError("")
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${form.mobile_number}`,
          code: otpInput.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success || !data.verified) {
        setOtpError(data.error || "Invalid verification code.")
        return
      }

      setOtpStage("verified")
      setOtpError("")
      update("otp_verified", true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again."
      setOtpError(msg)
    } finally {
      setVerifyingOtp(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validateRegistration(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setSubmitting(true)
    const payload = buildRegisterPayload(form)
    console.log("[POST /api/v1/auth/register]", payload)
    await new Promise((r) => setTimeout(r, 900))

    // Write into global context
    setUser({
      user_id: "b7f3c1a2-9d4e-4c6a-8f21-3e5a7c9d1b0e",
      full_name: form.full_name.trim(),
      mobile_number: form.mobile_number,
      email: form.email.trim(),
      state: form.state,
      district: form.district.trim(),
      pincode: form.pincode,
      preferred_language: form.preferred_language,
      is_nri: form.is_nri,
      nri_country: form.nri_country,
      google_connected: false,
      fcm_enabled: false,
      notifications: { whatsapp: true, sms: true, push: true },
    })
    setAuthenticated(true)
    addTimelineEvent({
      event_id: `e-reg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Account created",
      actor: "USER",
      note: `Registered as ${form.full_name.trim()} from ${form.district}, ${form.state}`,
    })
    router.push("/intake")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* Step 1: OTP */}
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-parchment">1</span>
            <h2 className="font-serif text-lg font-bold text-ink-900">Verify your mobile</h2>
          </div>
          <label htmlFor="mobile" className={lbl}>Mobile number</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center rounded-md border border-softborder bg-card focus-within:border-ink-800 focus-within:ring-2 focus-within:ring-ink-900/10">
              <span className="flex items-center gap-1 border-r border-softborder px-3 py-2.5 text-sm font-semibold text-ink-700">
                <Smartphone className="h-4 w-4" />+91
              </span>
              <input
                id="mobile" inputMode="numeric" autoComplete="tel-national" placeholder="9876543210"
                disabled={otpStage === "verified"} value={form.mobile_number}
                data-error={Boolean(errors.mobile_number)}
                onChange={(e) => update("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full bg-transparent px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-muted-foreground disabled:text-muted-foreground"
              />
            </div>
            {otpStage !== "verified" && (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendingOtp}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-ink-900 px-4 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-900 hover:text-parchment disabled:opacity-60"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : otpStage === "sent" ? (
                  "Resend OTP"
                ) : (
                  "Send OTP"
                )}
              </button>
            )}
          </div>
          <FieldError message={errors.mobile_number} />

          {otpStage === "sent" && (
            <div className="mt-4 rounded-lg border border-amber-ink/30 bg-amber-soft p-4">
              <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-ink-900">
                Enter verification code
              </label>
              <p className="mb-2 text-xs text-ink-700">
                Sent via SMS to +91 {form.mobile_number} via Twilio Verify.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="otp"
                  inputMode="numeric"
                  placeholder="______"
                  value={otpInput}
                  disabled={verifyingOtp}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1 rounded-md border border-softborder bg-card px-3 py-2.5 text-center text-lg tracking-[0.5em] text-ink-900 outline-none focus:border-ink-800 disabled:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={verifyingOtp}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-semibold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
              {otpError && (
                <p className={err}>
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {otpError}
                </p>
              )}
            </div>
          )}
          {otpStage === "verified" && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-forest-soft px-3 py-2 text-sm font-semibold text-forest">
              <CheckCircle2 className="h-4 w-4" />Mobile verified
            </p>
          )}
          <FieldError message={errors.otp_verified} />
        </section>

        {/* Step 2: Profile */}
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-parchment">2</span>
            <h2 className="font-serif text-lg font-bold text-ink-900">Your details</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="full_name" className={lbl}>Full name</label>
              <input id="full_name" autoComplete="name" placeholder="Ravi Kumar" value={form.full_name}
                data-error={Boolean(errors.full_name)} onChange={(e) => update("full_name", e.target.value)} className={inp} />
              <FieldError message={errors.full_name} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className={lbl}>Email <span className="font-normal text-muted-foreground">(optional)</span></label>
              <input id="email" type="email" autoComplete="email" placeholder="ravi@example.com" value={form.email}
                data-error={Boolean(errors.email)} onChange={(e) => update("email", e.target.value)} className={inp} />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label htmlFor="state" className={lbl}>State / UT</label>
              <select id="state" value={form.state} data-error={Boolean(errors.state)}
                onChange={(e) => update("state", e.target.value)} className={inp}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <FieldError message={errors.state} />
            </div>
            <div>
              <label htmlFor="district" className={lbl}>District</label>
              <input id="district" placeholder="Chennai" value={form.district}
                data-error={Boolean(errors.district)} onChange={(e) => update("district", e.target.value)} className={inp} />
              <FieldError message={errors.district} />
            </div>
            <div>
              <label htmlFor="pincode" className={lbl}>Pincode</label>
              <input id="pincode" inputMode="numeric" placeholder="600001" value={form.pincode}
                data-error={Boolean(errors.pincode)}
                onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} className={inp} />
              <FieldError message={errors.pincode} />
            </div>
            <div>
              <span className={lbl}>Preferred language</span>
              <div className="flex overflow-hidden rounded-md border border-softborder" role="group">
                {LANGUAGES.map((lang) => (
                  <button key={lang.value} type="button"
                    onClick={() => update("preferred_language", lang.value as PreferredLanguage)}
                    className={`flex-1 px-2 py-2.5 text-sm font-semibold transition-colors ${form.preferred_language === lang.value ? "bg-ink-900 text-parchment" : "bg-card text-ink-700 hover:bg-bluesoft"}`}>
                    {lang.native}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-softborder bg-bluesoft/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={form.is_nri} onChange={(e) => update("is_nri", e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink-900" />
              <span className="text-sm text-ink-900">
                <span className="font-semibold">I am filing from abroad (NRI)</span>
                <span className="block text-xs text-ink-700">Non-resident Indians can file consumer complaints in India.</span>
              </span>
            </label>
            {form.is_nri && (
              <div className="mt-3">
                <label htmlFor="nri_country" className={lbl}>Country you are filing from</label>
                <input id="nri_country" placeholder="United States" value={form.nri_country}
                  data-error={Boolean(errors.nri_country)} onChange={(e) => update("nri_country", e.target.value)} className={inp} />
                <FieldError message={errors.nri_country} />
              </div>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="password" className={lbl}>Password</label>
            <input id="password" type="password" autoComplete="new-password"
              placeholder="At least 8 chars, 1 letter & 1 number" value={form.password}
              data-error={Boolean(errors.password)} onChange={(e) => update("password", e.target.value)} className={inp} />
            <FieldError message={errors.password} />
          </div>
        </section>

        <button type="submit" disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating your account…</> : <>Create account & continue<ArrowRight className="h-4 w-4" /></>}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-forest" />
          Your mobile number is AES-256 encrypted, per India&apos;s DPDP Act 2023.
        </p>
      </form>
    </div>
  )
}
