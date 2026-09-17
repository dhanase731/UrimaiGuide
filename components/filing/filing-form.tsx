"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Loader2, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react"
import { useCaseContext } from "@/lib/case-context"

function genAckNumber(city: string): string {
  const cityCode = (city || "CHN").slice(0, 3).toUpperCase()
  const year = new Date().getFullYear()
  const seq = String(Math.floor(Math.random() * 90000) + 10000)
  return `ACK/${cityCode}/${year}/${seq}`
}

export function FilingForm() {
  const router = useRouter()
  const { caseData, user, setCaseData, setHearings, addTimelineEvent, addTask } = useCaseContext()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [mode, setMode] = useState<"edaakhil" | "physical">("edaakhil")
  const [submitting, setSubmitting] = useState(false)
  const [filed, setFiled] = useState(false)
  const [ackNumber, setAckNumber] = useState("")
  const [nextHearing, setNextHearing] = useState("")

  const CHECKLIST = [
    { id: "c1", label: "Complaint petition reviewed and accurate" },
    { id: "c2", label: "Affidavit signed and ready to upload" },
    { id: "c3", label: "Evidence documents scanned and attached" },
    { id: "c4", label: `Filing fee of ₹${caseData.court_fee_amount || 200} ready for payment` },
    { id: "c5", label: "I understand this is a self-represented filing" },
  ]

  const allChecked = CHECKLIST.every((c) => checked[c.id])

  const summaryItems = [
    { label: "Case number", value: caseData.case_number || "Will be assigned on filing" },
    { label: "Forum", value: caseData.commission_full_name || "District Commission" },
    { label: "Respondent", value: caseData.opposite_party_name || "—" },
    { label: "Relief sought", value: caseData.transaction_amount > 0 ? `₹${caseData.transaction_amount.toLocaleString("en-IN")}` : "—" },
    { label: "Filing fee", value: `₹${caseData.court_fee_amount || 200}` },
    { label: "Documents", value: "4 ready" },
  ]

  async function handleFile() {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1200))

    const ack = genAckNumber(caseData.commission_city || user.district || "CHN")
    const filingDate = new Date().toISOString()
    // First hearing ~30 days from now
    const hearingDate = new Date(Date.now() + 30 * 86400000)
    const hearingDateStr = hearingDate.toISOString().split("T")[0]
    const hearingDateLabel = hearingDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })

    setAckNumber(ack)
    setNextHearing(hearingDateLabel)

    // Write back to context
    setCaseData({
      status: "HEARING_SCHEDULED",
      progress_percentage: 70,
      ejagriti_case_number: ack,
      acknowledgement_number: ack,
      filing_date: filingDate,
      tracking_activated: true,
      next_hearing_date: hearingDateStr,
      next_hearing_time: "10:30 AM",
      next_hearing_venue: caseData.commission_full_name || "District Consumer Commission",
      current_stage: "HEARING_SCHEDULED",
      last_synced_at: filingDate,
    })

    // Seed first hearing into context
    setHearings([{
      hearing_id: `h-${Date.now()}`,
      date: hearingDateStr,
      time: "10:30 AM",
      label: "First hearing",
      status: "SCHEDULED",
      notes: "Both parties to appear. Complainant to bring original documents.",
      source: "EDAAKHIL",
      scraped_at: filingDate,
    }])

    // Auto-create hearing task
    addTask({
      task_id: `t-hearing-${Date.now()}`,
      title: `Attend hearing at ${caseData.commission_city || "Commission"}`,
      description: `First hearing on ${hearingDateLabel} at 10:30 AM`,
      deadline: hearingDateStr,
      task_type: "HEARING",
      priority: "HIGH",
      status: "PENDING",
      source: "AUTO_HEARING",
      days_until_deadline: 30,
      reminder_active: true,
    })

    addTimelineEvent({
      event_id: `e-filed-${Date.now()}`,
      timestamp: filingDate,
      label: "Complaint filed",
      actor: "USER",
      note: `Acknowledgement: ${ack}. Next hearing: ${hearingDateLabel}.`,
    })

    setSubmitting(false)
    setFiled(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Case summary from context */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Filing summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {summaryItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-softborder bg-parchment px-3 py-2.5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 font-semibold text-ink-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Filing mode */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Filing mode</h2>
        <div className="flex gap-3">
          {([
            { value: "edaakhil", label: "eDaakhil (Online)", sub: "File via edaakhil.nic.in — recommended" },
            { value: "physical", label: "Physical filing", sub: `Visit ${caseData.commission_city || "the commission"} in person` },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`flex-1 rounded-lg border p-4 text-left transition-colors ${
                mode === opt.value ? "border-ink-900 bg-bluesoft" : "border-softborder bg-card hover:bg-bluesoft/50"
              }`}
            >
              <p className="text-sm font-semibold text-ink-900">{opt.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{opt.sub}</p>
            </button>
          ))}
        </div>
        {mode === "edaakhil" && (
          <a
            href="https://edaakhil.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 underline underline-offset-2"
          >
            Open eDaakhil portal <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </section>

      {/* Checklist */}
      {!filed && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Pre-filing checklist</h2>
          <div className="flex flex-col gap-3">
            {CHECKLIST.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!checked[item.id]}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 accent-ink-900"
                />
                <span className="text-sm text-ink-900">{item.label}</span>
              </label>
            ))}
          </div>
          {!allChecked && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              Complete all checklist items to enable filing.
            </p>
          )}
        </section>
      )}

      {filed ? (
        <section className="rounded-xl border border-forest/30 bg-forest-soft p-5 md:p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-forest" />
            <div>
              <p className="font-serif text-lg font-bold text-forest">Complaint filed successfully</p>
              <p className="mt-0.5 text-sm text-ink-800">
                Acknowledgement: <span className="font-mono font-bold">{ackNumber}</span>
              </p>
              <p className="text-sm text-ink-800">Next hearing: {nextHearing} · 10:30 AM</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/tracking")}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800"
          >
            Track your case <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      ) : (
        <button
          onClick={handleFile}
          disabled={!allChecked || submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" />Filing complaint…</>
            : <><CheckCircle2 className="h-4 w-4" />File complaint now <ArrowRight className="h-4 w-4" /></>}
        </button>
      )}
    </div>
  )
}
