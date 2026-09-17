"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, LogOut, Trash2, CheckCircle2, Link2, Save } from "lucide-react"
import { LANGUAGES, type PreferredLanguage } from "@/lib/registration"
import { useCaseContext } from "@/lib/case-context"

const inp = "w-full rounded-md border border-softborder bg-card px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10 disabled:text-muted-foreground"

export function ProfileView() {
  const router = useRouter()
  const { user, setUser, reset } = useCaseContext()

  const [language, setLanguage] = useState<PreferredLanguage>(user.preferred_language || "ENGLISH")
  const [notifications, setNotifications] = useState(user.notifications || { whatsapp: true, sms: true, push: true })
  const [saved, setSaved] = useState(false)

  function toggleNotif(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    setUser({ preferred_language: language, notifications })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLogout() {
    reset()
    router.push("/")
  }

  function handleDeleteAccount() {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to delete your account and purge all case data? This action cannot be undone.")) {
      reset()
      router.push("/")
    }
  }

  const maskedMobile = user.mobile_number
    ? `XXXXXX${user.mobile_number.slice(-4)}`
    : "XXXXXXXXXX"

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Identity */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-5 font-serif text-lg font-bold text-ink-900">Identity & location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">Full name</label>
            <input value={user.full_name || "Ravi Kumar"} disabled className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">Mobile number</label>
            <input value={maskedMobile} disabled className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">State</label>
            <input value={user.state || "Tamil Nadu"} disabled className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-900">District</label>
            <input value={user.district || "Chennai"} disabled className={inp} />
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Preferred language</h2>
        <div className="flex flex-col gap-3">
          {LANGUAGES.map((lang) => (
            <label key={lang.value} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="language"
                value={lang.value}
                checked={language === lang.value}
                onChange={() => setLanguage(lang.value)}
                className="h-4 w-4 accent-ink-900"
              />
              <span className="text-sm font-semibold text-ink-900">{lang.native}</span>
              <span className="text-xs text-muted-foreground">{lang.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Notification channels</h2>
        <div className="flex flex-col gap-4">
          {[
            { key: "whatsapp" as const, label: "WhatsApp reminders", sub: "Delivered via MSG91 Business API" },
            { key: "sms" as const, label: "SMS fallback", sub: "Sent when WhatsApp delivery fails" },
            { key: "push" as const, label: "Android / PWA push", sub: "Firebase Cloud Messaging (FCM)" },
          ].map((item) => (
            <label key={item.key} className="flex cursor-pointer items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => toggleNotif(item.key)}
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
                  notifications[item.key] ? "bg-ink-900" : "bg-softborder"
                }`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  notifications[item.key] ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </button>
            </label>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Integrations</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg border border-softborder px-4 py-3">
            <div className="flex items-center gap-3">
              <Link2 className="h-4 w-4 text-amber-ink" />
              <div>
                <p className="text-sm font-semibold text-ink-900">Google account</p>
                <p className="text-xs text-muted-foreground">Gmail trigger & Google Calendar sync</p>
              </div>
            </div>
            {user.google_connected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {user.email || "citizen@gmail.com"}
              </span>
            ) : (
              <button type="button"
                className="rounded-md border border-softborder px-3 py-1.5 text-xs font-semibold text-ink-900 transition-colors hover:bg-bluesoft">
                Connect
              </button>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-softborder px-4 py-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-amber-ink" />
              <div>
                <p className="text-sm font-semibold text-ink-900">e-Jagriti credential vault</p>
                <p className="text-xs text-muted-foreground">AES-256 encrypted · used by n8n order scraper</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-forest">Stored</span>
          </div>
        </div>
      </section>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3 text-sm font-bold text-parchment transition-colors hover:bg-ink-800"
      >
        {saved ? <><CheckCircle2 className="h-4 w-4" />Saved</> : <><Save className="h-4 w-4" />Save preferences</>}
      </button>

      {/* Danger zone */}
      <section className="rounded-xl border border-danger-ink/20 bg-red-50 p-5">
        <h2 className="mb-4 font-serif text-base font-bold text-danger-ink">Danger zone</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-softborder bg-card px-4 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-bluesoft"
          >
            <LogOut className="h-4 w-4" />
            Log out of session
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="inline-flex items-center gap-1.5 rounded-md border border-danger-ink px-4 py-2.5 text-sm font-semibold text-danger-ink transition-colors hover:bg-danger-ink hover:text-parchment"
          >
            <Trash2 className="h-4 w-4" />
            Delete account & purge case data (DPDP Act 2023)
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Account deletion permanently removes all case data, documents, and personal information per India's
          Digital Personal Data Protection Act 2023.
        </p>
      </section>
    </div>
  )
}
