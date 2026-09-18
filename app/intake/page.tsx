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

export default function IntakePage() {
  return (
    <main className="min-h-dvh bg-parchment">
      <header className="sticky top-0 z-40 border-b border-softborder bg-parchment/85 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-6 md:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/urimai-emblem.png"
              alt="Urimai emblem"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-bold tracking-tight text-ink-900">
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
        <div className="mt-10 max-w-2xl">
          <IntakeForm />
        </div>
      </div>
    </main>
  )
}
