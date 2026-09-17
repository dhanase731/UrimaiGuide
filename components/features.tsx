import {
  Languages,
  Scale,
  FileText,
  ShieldCheck,
  Volume2,
  Gavel,
  type LucideIcon,
} from "lucide-react"

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Languages,
    title: "Vernacular Voice Intake",
    desc: "Describe your problem in Tamil or Hindi via Bhashini ASR. No legal jargon required.",
  },
  {
    icon: Scale,
    title: "Statutory Guidance",
    desc: "Consumer Protection Act 2019 classification, jurisdiction, limitation, and eligibility checks.",
  },
  {
    icon: FileText,
    title: "RAG Complaint Drafting",
    desc: "Court-ready complaint and affidavit generated with cited precedents, in your language.",
  },
  {
    icon: ShieldCheck,
    title: "Evidence Quality Studio",
    desc: "PaddleOCR verifies your documents are readable before you file — no rejected submissions.",
  },
  {
    icon: Volume2,
    title: "Spoken Court Orders",
    desc: "Court orders read aloud in your language so you understand every directive.",
  },
  {
    icon: Gavel,
    title: "Enforcement Tracking",
    desc: "Track compliance deadlines and file Execution Applications if the company refuses to pay.",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-wide text-forest">
          What Urimai does
        </span>
        <h2 className="mt-3 text-balance font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          A complete pipeline from grievance to enforcement
        </h2>
        <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
          Every step of the consumer court journey — guided, translated, and
          statutorily grounded — so no citizen is left behind by procedure.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon
  title: string
  desc: string
}) {
  return (
    <div className="group rounded-lg border border-softborder bg-card p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-bluesoft transition-colors group-hover:bg-ink-900">
        <Icon className="h-5 w-5 text-ink-800 transition-colors group-hover:text-parchment" />
      </div>
      <h3 className="font-serif text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  )
}
