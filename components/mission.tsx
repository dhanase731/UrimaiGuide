import { ArrowRight, UserPlus } from "lucide-react"

export function Mission() {
  return (
    <section id="mission" className="bg-card">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span
          aria-hidden="true"
          className="font-serif text-5xl leading-none text-softborder"
        >
          &ldquo;
        </span>
        <p className="mt-2 text-balance font-serif text-2xl font-medium italic leading-relaxed text-ink-800 md:text-3xl">
          The right to consumer justice is a constitutional right. Urimai exists
          to make that right accessible to every citizen, in every language.
        </p>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Constitutional Parchment &amp; Judicial Robes
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#get-started"
            className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-6 py-3 text-sm font-bold text-parchment transition-transform hover:scale-[1.02]"
          >
            <UserPlus className="h-4 w-4" />
            Start your consumer claim
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
