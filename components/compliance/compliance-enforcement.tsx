"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, ArrowRight, Loader2, ShieldAlert, Clock, FileText } from "lucide-react"
import { useCaseContext } from "@/lib/case-context"

type DirectionStatus = "PENDING" | "COMPLIED" | "DEFAULTED"

const ENFORCEMENT_STEPS = [
  { id: "es1", label: "File execution petition", description: "File EP under Section 72 of CPA 2019 if opposite party defaults after deadline." },
  { id: "es2", label: "Attach property", description: "Commission can attach and sell property of the defaulting party." },
  { id: "es3", label: "Imprisonment", description: "Defaulter can be imprisoned for up to 3 years under Section 72." },
]

const STATUS_STYLES: Record<DirectionStatus, string> = {
  PENDING: "bg-amber-soft text-amber-ink border-amber-ink/20",
  COMPLIED: "bg-forest-soft text-forest border-forest/20",
  DEFAULTED: "bg-red-50 text-danger-ink border-danger-ink/20",
}

export function ComplianceEnforcement() {
  const router = useRouter()
  const { compliance, setCompliance, orders, caseData, addTimelineEvent } = useCaseContext()

  // Derive directions from final order in context, or from compliance record
  const finalOrder = orders.find((o) => o.order_type === "FINAL")

  const derivedDirections = compliance?.directions ?? (
    finalOrder?.amounts_ordered.length
      ? finalOrder.amounts_ordered.map((a, i) => ({
          id: `ci${i + 1}`,
          direction: `${a.type}: ₹${a.amount.toLocaleString("en-IN")}`,
          deadline: finalOrder.deadlines[i]?.calculated_deadline || new Date(Date.now() + a.compliance_days * 86400000).toISOString().split("T")[0],
          status: "PENDING" as DirectionStatus,
        }))
      : [
          { id: "ci1", direction: `Refund ₹${caseData.transaction_amount.toLocaleString("en-IN")} with 9% interest p.a. from date of purchase`, deadline: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0], status: "PENDING" as DirectionStatus },
          { id: "ci2", direction: "Pay ₹5,000 as compensation for mental agony and harassment", deadline: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0], status: "PENDING" as DirectionStatus },
          { id: "ci3", direction: "Pay ₹2,000 as litigation costs", deadline: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0], status: "PENDING" as DirectionStatus },
        ]
  )

  const [statuses, setStatuses] = useState<Record<string, DirectionStatus>>(
    Object.fromEntries(derivedDirections.map((d) => [d.id, d.status]))
  )
  const [filing, setFiling] = useState(false)
  const [epFiled, setEpFiled] = useState(false)

  const allComplied = Object.values(statuses).every((s) => s === "COMPLIED")
  const anyDefaulted = Object.values(statuses).some((s) => s === "DEFAULTED")

  function updateStatus(id: string, s: DirectionStatus) {
    setStatuses((prev) => {
      const next = { ...prev, [id]: s }
      // Sync back to compliance context
      const updatedDirections = derivedDirections.map((d) => ({ ...d, status: next[d.id] ?? d.status }))
      setCompliance({
        compliance_id: compliance?.compliance_id || `comp-${Date.now()}`,
        amount_ordered: caseData.transaction_amount + 7000,
        compliance_deadline: derivedDirections[0]?.deadline || "",
        amount_received: 0,
        status: Object.values(next).every((v) => v === "COMPLIED") ? "COMPLIED"
          : Object.values(next).some((v) => v === "DEFAULTED") ? "DEFAULTED"
          : "PENDING",
        days_remaining: 45,
        op_appeal_deadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        directions: updatedDirections,
      })
      return next
    })
  }

  async function handleFileEP() {
    setFiling(true)
    await new Promise((r) => setTimeout(r, 900))
    setFiling(false)
    setEpFiled(true)
    addTimelineEvent({
      event_id: `e-ep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Execution petition filed",
      actor: "USER",
      note: "Filed under Section 72, CPA 2019 due to non-compliance by opposite party.",
    })
  }

  const orderDate = finalOrder?.order_date
    ? new Date(finalOrder.order_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "the final order date"

  const complianceDeadline = derivedDirections[0]?.deadline
    ? new Date(derivedDirections[0].deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "45 days from order"

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <div className="mb-1 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-ink" />
          <h2 className="font-serif text-lg font-bold text-ink-900">Compliance tracker</h2>
        </div>
        <p className="mb-5 text-sm text-ink-700">
          Final order issued on {orderDate}. Compliance deadline: <strong>{complianceDeadline}</strong>.
          Mark each direction as complied or defaulted.
        </p>
        <div className="flex flex-col gap-4">
          {derivedDirections.map((item) => (
            <div key={item.id} className="rounded-lg border border-softborder p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.direction}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Deadline: {new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[statuses[item.id]]}`}>
                  {statuses[item.id]}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {(["PENDING", "COMPLIED", "DEFAULTED"] as DirectionStatus[]).map((s) => (
                  <button key={s} type="button" onClick={() => updateStatus(item.id, s)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      statuses[item.id] === s
                        ? s === "COMPLIED" ? "border-forest bg-forest text-parchment"
                          : s === "DEFAULTED" ? "border-danger-ink bg-danger-ink text-parchment"
                          : "border-ink-900 bg-ink-900 text-parchment"
                        : "border-softborder bg-card text-ink-700 hover:bg-bluesoft"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {allComplied && (
        <div className="rounded-xl border border-forest/30 bg-forest-soft p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-forest" />
            <div>
              <p className="font-serif text-lg font-bold text-forest">Case closed — full compliance</p>
              <p className="mt-0.5 text-sm text-ink-800">
                All directions of the final order have been complied with. Your case is now closed.
              </p>
            </div>
          </div>
          <button onClick={() => router.push("/dashboard")}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800">
            Back to dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {anyDefaulted && !allComplied && (
        <section className="rounded-xl border border-danger-ink/20 bg-red-50 p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-danger-ink" />
            <h2 className="font-serif text-lg font-bold text-ink-900">Enforcement options</h2>
          </div>
          <div className="mb-4 flex flex-col gap-3">
            {ENFORCEMENT_STEPS.map((step) => (
              <div key={step.id} className="rounded-lg border border-softborder bg-card p-3">
                <p className="text-sm font-semibold text-ink-900">{step.label}</p>
                <p className="mt-0.5 text-xs text-ink-700">{step.description}</p>
              </div>
            ))}
          </div>
          {epFiled ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <CheckCircle2 className="h-4 w-4" />Execution petition filed successfully.
            </p>
          ) : (
            <button onClick={handleFileEP} disabled={filing}
              className="inline-flex items-center gap-2 rounded-md bg-danger-ink px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:opacity-90 disabled:opacity-60">
              {filing
                ? <><Loader2 className="h-4 w-4 animate-spin" />Filing EP…</>
                : <>File execution petition <ArrowRight className="h-4 w-4" /></>}
            </button>
          )}
        </section>
      )}
    </div>
  )
}
