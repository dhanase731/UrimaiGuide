import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { IntakeForm } from "@/components/intake/intake-form"

export const metadata: Metadata = {
  title: "Describe your problem — Urimai",
  description:
    "Tell Urimai what happened in your own words — by typing or speaking in Tamil, Hindi, or English.",
}

const STEPS = [
  { n: 1, label: "Register", active: false, done: true },
  { n: 2, label: "Describe problem", active: true, done: false },
  { n: 3, label: "AI interview", active: false, done: false },
  { n: 4, label: "File complaint", active: false, done: false },
]

export default function IntakePage() {
  return (
    <main className="min-h-dvh bg-parchment">
      <header className="border-b border-softborder bg-parchment/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/urimai-emblem.png"
              alt="Urimai emblem"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-base font-bold tracking-tight text-ink-900">
                URIMAI
              </span>
              <span className="font-tamil text-xs text-amber-ink">உரிமை</span>
            </span>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">
            Module 2 · Problem intake
          </p>
          <h1 className="mt-2 text-balance font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            What went wrong?
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-ink-700">
            Describe your consumer problem in your own words — no legal jargon
            needed. Type it or speak it in Tamil, Hindi, or English. We&apos;ll
            create your case and translate it for classification.
          </p>
        </div>

        <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {STEPS.map((step, i) => (
            <li key={step.n} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step.active
                      ? "bg-ink-900 text-parchment"
                      : step.done
                        ? "bg-forest text-parchment"
                        : "border border-softborder bg-card text-muted-foreground"
                  }`}
                >
                  {step.done ? "\u2713" : step.n}
                </span>
                <span
                  className={
                    step.active ? "font-semibold text-ink-900" : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </span>
              {i < STEPS.length - 1 && (
                <span className="hidden h-px w-8 bg-softborder sm:block" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10 max-w-2xl">
          <IntakeForm />
        </div>
      </div>
    </main>
  )
}
