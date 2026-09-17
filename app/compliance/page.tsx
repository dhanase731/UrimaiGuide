import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { ComplianceEnforcement } from "@/components/compliance/compliance-enforcement"

export const metadata: Metadata = {
  title: "Compliance enforcement — Urimai",
  description: "Track whether the opposite party has complied with the court order, and file an execution petition if they default.",
}

export default function CompliancePage() {
  return (
    <PageShell backHref="/orders" backLabel="Back to orders" activeStep={10} doneUpTo={9}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 10 · Compliance enforcement</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Enforce the court order
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Mark each direction of the final order as complied or defaulted. If the opposite party defaults,
          Urimai guides you through filing an execution petition under Section 72 of the Consumer Protection Act, 2019.
        </p>
      </div>
      <div className="mt-10">
        <ComplianceEnforcement />
      </div>
    </PageShell>
  )
}
