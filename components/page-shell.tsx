"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const MODULE_STEPS = [
  { n: 1, label: "Register", path: "/register" },
  { n: 2, label: "Intake", path: "/intake" },
  { n: 3, label: "Interview", path: "/interview" },
  { n: 4, label: "Eligibility", path: "/eligibility" },
  { n: 5, label: "Jurisdiction", path: "/jurisdiction" },
  { n: 6, label: "Documents", path: "/documents" },
  { n: 7, label: "File", path: "/filing" },
  { n: 8, label: "Track", path: "/tracking" },
  { n: 9, label: "Orders", path: "/orders" },
  { n: 10, label: "Enforce", path: "/compliance" },
]

export function PageShell({
  children,
  backHref,
  backLabel = "Back",
  activeStep,
  doneUpTo,
}: {
  children: React.ReactNode
  backHref: string
  backLabel?: string
  activeStep: number
  doneUpTo: number
}) {
  return (
    <main className="min-h-dvh bg-parchment">
      <header className="sticky top-0 z-40 border-b border-softborder bg-parchment/85 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-6 md:px-10 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/urimai-emblem.png"
              alt="Urimai emblem"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-base font-bold tracking-tight text-ink-900">URIMAI</span>
              <span className="font-tamil text-xs text-amber-ink">உரிமை</span>
            </span>
          </Link>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <ol className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
          {MODULE_STEPS.map((step, i) => {
            const done = step.n < activeStep && step.n <= doneUpTo
            const active = step.n === activeStep
            return (
              <li key={step.n} className="flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      active
                        ? "bg-ink-900 text-parchment"
                        : done
                          ? "bg-forest text-parchment"
                          : "border border-softborder bg-card text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : step.n}
                  </span>
                  <span className={active ? "font-semibold text-ink-900" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </span>
                {i < MODULE_STEPS.length - 1 && (
                  <span className="hidden h-px w-6 bg-softborder sm:block" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
        {children}
      </div>
    </main>
  )
}
