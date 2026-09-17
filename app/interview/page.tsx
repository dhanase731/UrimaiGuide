import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { InterviewForm } from "@/components/interview/interview-form"

export const metadata: Metadata = {
  title: "AI interview — Urimai",
  description: "Answer guided questions so Urimai can extract the facts needed for your complaint petition.",
}

export default function InterviewPage() {
  return (
    <PageShell backHref="/intake" backLabel="Back to intake" activeStep={3} doneUpTo={2}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 3 · AI interview</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Tell us the full story
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Answer these guided questions in plain language. The AI extracts the legal facts needed to draft your
          complaint petition under the Consumer Protection Act, 2019.
        </p>
      </div>
      <div className="mt-10">
        <InterviewForm />
      </div>
    </PageShell>
  )
}
