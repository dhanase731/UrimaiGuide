import Image from "next/image"
import { ArrowRight, KeyRound, UserPlus, ShieldCheck } from "lucide-react"

const STATS = [
  { value: "₹0", label: "Filing fee guidance" },
  { value: "3", label: "Languages supported" },
  { value: "18", label: "Guided modules" },
]

export function Hero() {
  return (
    <section
      id="get-started"
      className="relative overflow-hidden bg-ink-900 text-parchment"
    >
      <Image
        src="/parchment-texture.png"
        alt=""
        fill
        priority
        aria-hidden="true"
        className="object-cover opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, #1E5C41 0%, transparent 45%), radial-gradient(circle at 85% 90%, #8C5E03 0%, transparent 45%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-parchment/25 bg-parchment/5 px-3 py-1 text-xs font-semibold tracking-wide text-amber-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Consumer Protection Act, 2019
          </span>

          <h1 className="mt-6 text-balance font-serif text-4xl font-bold tracking-tight md:text-6xl">
            Your Right to Consumer Justice
          </h1>
          <p className="mt-3 font-tamil text-xl text-amber-100/90 md:text-2xl">
            உரிமை — every citizen deserves a fair hearing
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-parchment/75 md:text-lg">
            A sovereign legal guidance platform that walks every Indian citizen
            through filing, tracking, and enforcing a consumer court complaint —
            in Tamil, Hindi, or English.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-parchment px-6 py-3 text-sm font-bold text-ink-900 transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              New citizen? Start consumer claim
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-parchment/30 px-6 py-3 text-sm font-bold text-parchment transition-colors hover:bg-parchment/10 sm:w-auto"
            >
              <KeyRound className="h-4 w-4" />
              Returning citizen? Sign in
            </a>
          </div>
        </div>

        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 border-t border-parchment/15 pt-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-serif text-3xl font-bold text-parchment md:text-4xl">
                {stat.value}
              </dd>
              <p className="mt-1 text-xs text-parchment/60 md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
