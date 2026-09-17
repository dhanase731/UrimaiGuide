import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export const metadata: Metadata = {
  title: "Case dashboard — Urimai",
  description: "Track your consumer complaint case, view timeline, and take next actions.",
}

export default function DashboardPage() {
  return (
    <PageShell backHref="/intake" backLabel="Back to intake" activeStep={3} doneUpTo={2}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 3 · Case dashboard</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Your case at a glance
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Review your case status, timeline, and next actions. Every step is tracked and logged against your case ID.
        </p>
      </div>
      <div className="mt-10">
        <DashboardView />
      </div>
    </PageShell>
  )
}
