import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { HearingPrepView } from "@/components/hearing-prep/hearing-prep-view"

export const metadata: Metadata = {
  title: "Hearing preparation — Urimai",
  description: "48-hour courtroom coaching: documents to carry, opening statement, judge questions, and rebuttal guide.",
}

export default function HearingPrepPage() {
  return (
    <PageShell backHref="/tracking" backLabel="Back to tracking" activeStep={8} doneUpTo={7}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 17 · Hearing coach</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          48-hour hearing preparation
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Your hearing is in 48 hours. Review what to carry, what to say, and how to respond to the opposite
          party's lawyer. Download the offline cheat-sheet for use inside the courtroom.
        </p>
      </div>
      <div className="mt-10">
        <HearingPrepView />
      </div>
    </PageShell>
  )
}
