import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { CaseTracking } from "@/components/tracking/case-tracking"

export const metadata: Metadata = {
  title: "Track case — Urimai",
  description: "Monitor your case status, upcoming hearings, and notifications in real time.",
}

export default function TrackingPage() {
  return (
    <PageShell backHref="/filing" backLabel="Back to filing" activeStep={8} doneUpTo={7}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 8 · Case tracking</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Track your case
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Monitor hearing dates, commission orders, and compliance deadlines. Urimai sends push notifications
          before every hearing so you never miss a date.
        </p>
      </div>
      <div className="mt-10">
        <CaseTracking />
      </div>
    </PageShell>
  )
}
