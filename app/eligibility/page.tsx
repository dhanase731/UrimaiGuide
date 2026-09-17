import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { EligibilityCheck } from "@/components/eligibility/eligibility-check"

export const metadata: Metadata = {
  title: "Eligibility check — Urimai",
  description: "Verify that your complaint meets all eligibility criteria under the Consumer Protection Act, 2019.",
}

export default function EligibilityPage() {
  return (
    <PageShell backHref="/interview" backLabel="Back to interview" activeStep={4} doneUpTo={3}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 4 · Eligibility check</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Is your complaint eligible?
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Urimai checks 5 criteria under the Consumer Protection Act, 2019 — limitation period, consumer definition,
          pecuniary jurisdiction, deficiency, and prior notice — before proceeding.
        </p>
      </div>
      <div className="mt-10">
        <EligibilityCheck />
      </div>
    </PageShell>
  )
}
