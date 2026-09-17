import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { DocumentBuilder } from "@/components/documents/document-builder"

export const metadata: Metadata = {
  title: "Document builder — Urimai",
  description: "Review and download your AI-generated complaint petition, affidavit, and evidence index.",
}

export default function DocumentsPage() {
  return (
    <PageShell backHref="/jurisdiction" backLabel="Back to jurisdiction" activeStep={6} doneUpTo={5}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 6 · Document builder</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Your documents are ready
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Urimai has generated your complaint petition, affidavit, and evidence index using GPT-4o and the facts
          from your interview. Review, preview, and download each document before filing.
        </p>
      </div>
      <div className="mt-10">
        <DocumentBuilder />
      </div>
    </PageShell>
  )
}
