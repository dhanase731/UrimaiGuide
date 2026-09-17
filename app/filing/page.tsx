import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { FilingForm } from "@/components/filing/filing-form"

export const metadata: Metadata = {
  title: "File complaint — Urimai",
  description: "Submit your consumer complaint to the District Commission via eDaakhil or physical filing.",
}

export default function FilingPage() {
  return (
    <PageShell backHref="/documents" backLabel="Back to documents" activeStep={7} doneUpTo={6}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 7 · Court filing</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          File your complaint
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Complete the pre-filing checklist and submit your complaint to the District Consumer Disputes Redressal
          Commission via eDaakhil — the Government of India&apos;s official e-filing portal.
        </p>
      </div>
      <div className="mt-10">
        <FilingForm />
      </div>
    </PageShell>
  )
}
