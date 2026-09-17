import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { JurisdictionRouting } from "@/components/jurisdiction/jurisdiction-routing"

export const metadata: Metadata = {
  title: "Jurisdiction routing — Urimai",
  description: "Urimai identifies the correct consumer forum based on your location and complaint value.",
}

export default function JurisdictionPage() {
  return (
    <PageShell backHref="/eligibility" backLabel="Back to eligibility" activeStep={5} doneUpTo={4}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 5 · Jurisdiction routing</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Which court hears your case?
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Under Section 34 of the Consumer Protection Act, 2019, the correct forum is determined by your location
          and the value of the complaint. Urimai routes you automatically.
        </p>
      </div>
      <div className="mt-10">
        <JurisdictionRouting />
      </div>
    </PageShell>
  )
}
