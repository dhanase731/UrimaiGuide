import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { RegisterForm } from "@/components/register/register-form"

export const metadata: Metadata = {
  title: "Create your account — Urimai",
  description:
    "Register as a new citizen to begin your guided consumer court complaint with Urimai.",
}

const STEPS = [
  { n: 1, label: "Register", active: true },
  { n: 2, label: "Describe problem", active: false },
  { n: 3, label: "AI interview", active: false },
  { n: 4, label: "File complaint", active: false },
]

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-parchment">
      <header className="border-b border-softborder bg-parchment/85 backdrop-blur">
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
              <span className="font-serif text-base font-bold tracking-tight text-ink-900">
                URIMAI
              </span>
              <span className="font-tamil text-xs text-amber-ink">உரிமை</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="max-w-2xl">
          <h1 className="text-balance font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Create your Urimai account
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-ink-700">
            Your account is the identity behind every case, document, and
            notification. Verify your mobile, add your details, and we&apos;ll
            take you straight to describing your problem.
          </p>
        </div>

        {/* Journey stepper */}
        <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {STEPS.map((step, i) => (
            <li key={step.n} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step.active
                      ? "bg-ink-900 text-parchment"
                      : "border border-softborder bg-card text-muted-foreground"
                  }`}
                >
                  {step.n}
                </span>
                <span
                  className={
                    step.active
                      ? "font-semibold text-ink-900"
                      : "text-muted-foreground"
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

        <div className="mt-10">
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
