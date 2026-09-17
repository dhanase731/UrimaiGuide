import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { ProfileView } from "@/components/profile/profile-view"

export const metadata: Metadata = {
  title: "Profile & settings — Urimai",
  description: "Manage your identity, language preference, notification channels, and data governance settings.",
}

export default function ProfilePage() {
  return (
    <PageShell backHref="/dashboard" backLabel="Back to dashboard" activeStep={8} doneUpTo={7}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 1 · Profile</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Citizen profile & governance
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Update your language preference, notification channels, and integrations. Your data is protected
          under India's DPDP Act 2023 — you can request full deletion at any time.
        </p>
      </div>
      <div className="mt-10">
        <ProfileView />
      </div>
    </PageShell>
  )
}
