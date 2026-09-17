import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { OfficeNavigatorView } from "@/components/navigator/office-navigator-view"

export const metadata: Metadata = {
  title: "Office navigator — Urimai",
  description: "Find the nearest Notary Public, Sub-Registrar, or other government office to collect mandatory documents.",
}

export default function NavigatorPage() {
  return (
    <PageShell backHref="/documents" backLabel="Back to documents" activeStep={6} doneUpTo={5}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 9 · Office navigator</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Find nearest government office
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Some mandatory documents — like a notarised affidavit — require a visit to a government office.
          Urimai finds the nearest Notary Public or Sub-Registrar and tells you exactly what to bring.
        </p>
      </div>
      <div className="mt-10">
        <OfficeNavigatorView />
      </div>
    </PageShell>
  )
}
