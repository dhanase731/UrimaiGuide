import { Mic, Brain, ClipboardList, ScrollText, Radar } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const STEPS: {
  icon: LucideIcon
  step: string
  title: string
  desc: string
  badge: string
}[] = [
  {
    icon: Mic,
    step: "01",
    title: "Describe your problem",
    desc: "Speak or type in Tamil, Hindi, or English. Bhashini transcribes and translates instantly.",
    badge: "Bhashini ASR",
  },
  {
    icon: Brain,
    step: "02",
    title: "Automatic classification",
    desc: "Your grievance is classified under the correct section of the Consumer Protection Act, 2019.",
    badge: "CPA § 2(10)",
  },
  {
    icon: ClipboardList,
    step: "03",
    title: "Guided statutory interview",
    desc: "A dynamic questionnaire confirms eligibility, limitation period, and jurisdiction.",
    badge: "13-Branch",
  },
  {
    icon: ScrollText,
    step: "04",
    title: "Court-ready draft",
    desc: "A cited complaint and affidavit are generated, then verified for evidence quality before filing.",
    badge: "RAG Draft",
  },
  {
    icon: Radar,
    step: "05",
    title: "Track & enforce",
    desc: "Automated case sync, spoken orders, and enforcement reminders until the company complies.",
    badge: "n8n Sync",
  },
]

export function Workflow() {
  return (
    <section
      id="workflow"
      className="border-y border-softborder bg-secondary/50"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-forest">
            The journey
          </span>
          <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Five guided steps to justice
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            From a spoken grievance to an enforced court order — Urimai stays
            with the citizen through the entire statutory lifecycle.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step) => (
            <li
              key={step.step}
              className="relative flex flex-col rounded-lg border border-softborder bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-900 text-parchment">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="font-serif text-2xl font-bold text-softborder">
                  {step.step}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-base font-bold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
              <span className="mt-4 inline-flex w-fit items-center rounded-full border border-softborder bg-amber-soft px-2.5 py-1 text-xs font-semibold text-amber-ink">
                {step.badge}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
