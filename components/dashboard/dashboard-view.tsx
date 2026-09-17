"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FileText, Clock, CheckCircle2, ArrowRight,
  Scale, MapPin, IndianRupee,
} from "lucide-react"
import { useCaseContext } from "@/lib/case-context"
import { STATUS_LABELS, type CaseStatus } from "@/lib/case"

function StatusBadge({ status }: { status: CaseStatus | string }) {
  const map: Record<string, string> = {
    FILING_READY: "bg-forest-soft text-forest border-forest/20",
    FILED: "bg-bluesoft text-ink-800 border-softborder",
    HEARING_SCHEDULED: "bg-bluesoft text-ink-800 border-softborder",
    COMPLIANCE_PENDING: "bg-amber-soft text-amber-ink border-amber-ink/20",
    ORDER_ISSUED: "bg-amber-soft text-amber-ink border-amber-ink/20",
    CLOSED: "bg-card text-muted-foreground border-softborder",
  }
  const cls = map[status] ?? "bg-bluesoft text-ink-800 border-softborder"
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {STATUS_LABELS[status as CaseStatus] ?? status}
    </span>
  )
}

const NEXT_ACTIONS = [
  { label: "Review AI interview answers", href: "/interview", statusGate: ["AI_INTERVIEW", "ELIGIBILITY_CHECK", "JURISDICTION_ROUTING", "DOCUMENT_GENERATION", "FILING_READY", "FILED", "HEARING_SCHEDULED", "ORDER_ISSUED", "COMPLIANCE_PENDING", "CLOSED"] },
  { label: "Confirm eligibility result", href: "/eligibility", statusGate: ["ELIGIBILITY_CHECK", "JURISDICTION_ROUTING", "DOCUMENT_GENERATION", "FILING_READY", "FILED", "HEARING_SCHEDULED", "ORDER_ISSUED", "COMPLIANCE_PENDING", "CLOSED"] },
  { label: "Verify jurisdiction assignment", href: "/jurisdiction", statusGate: ["JURISDICTION_ROUTING", "DOCUMENT_GENERATION", "FILING_READY", "FILED", "HEARING_SCHEDULED", "ORDER_ISSUED", "COMPLIANCE_PENDING", "CLOSED"] },
  { label: "Review generated documents", href: "/documents", statusGate: ["DOCUMENT_GENERATION", "FILING_READY", "FILED", "HEARING_SCHEDULED", "ORDER_ISSUED", "COMPLIANCE_PENDING", "CLOSED"] },
  { label: "File complaint with the court", href: "/filing", statusGate: ["FILING_READY"], cta: true },
  { label: "Track case status", href: "/tracking", statusGate: ["FILED", "HEARING_SCHEDULED", "ORDER_ISSUED", "COMPLIANCE_PENDING", "CLOSED"] },
  { label: "View court orders", href: "/orders", statusGate: ["ORDER_ISSUED", "COMPLIANCE_PENDING", "CLOSED"] },
  { label: "Enforce compliance", href: "/compliance", statusGate: ["COMPLIANCE_PENDING", "CLOSED"] },
  { label: "Manage tasks & deadlines", href: "/tasks", statusGate: null },
  { label: "48-hour hearing coach", href: "/hearing-prep", statusGate: null },
  { label: "Notification history", href: "/notifications", statusGate: null },
  { label: "Find government offices", href: "/navigator", statusGate: null },
  { label: "Profile & settings", href: "/profile", statusGate: null },
]

export function DashboardView() {
  const { caseData, user, timeline } = useCaseContext()
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview")

  const currentStatus = caseData.status

  return (
    <div className="flex flex-col gap-6">
      {/* Case card */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {caseData.case_number ? "Case number" : "Welcome"}
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-ink-900">
              {caseData.case_number || `${user.full_name || "Citizen"} — case in progress`}
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>

        {caseData.opposite_party_name && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
              <div>
                <p className="text-xs text-muted-foreground">Respondent</p>
                <p className="text-sm font-semibold text-ink-900">{caseData.opposite_party_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="text-sm font-semibold text-ink-900">
                  {caseData.primary_case_type_label || caseData.primary_case_type?.replace(/_/g, " ") || "—"}
                </p>
              </div>
            </div>
            {caseData.transaction_amount > 0 && (
              <div className="flex items-start gap-2.5">
                <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
                <div>
                  <p className="text-xs text-muted-foreground">Relief sought</p>
                  <p className="text-sm font-semibold text-ink-900">₹{caseData.transaction_amount.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}
            {caseData.commission_city && (
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
                <div>
                  <p className="text-xs text-muted-foreground">Forum</p>
                  <p className="text-sm font-semibold text-ink-900">{caseData.recommended_commission} — {caseData.commission_city}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!caseData.opposite_party_name && (
          <p className="mt-3 text-sm text-muted-foreground">
            Complete the intake and interview steps to populate your case details.
          </p>
        )}
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-softborder bg-card p-1" role="tablist">
        {(["overview", "timeline"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={activeTab === t} onClick={() => setActiveTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              activeTab === t ? "bg-ink-900 text-parchment" : "text-ink-700 hover:bg-bluesoft"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <h2 className="mb-4 font-serif text-lg font-bold text-ink-900">Next actions</h2>
          <div className="flex flex-col gap-3">
            {NEXT_ACTIONS.map((item) => {
              const done = item.statusGate !== null && !item.statusGate.includes(currentStatus)
              const active = item.statusGate?.includes(currentStatus) ?? true
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                    item.cta && active
                      ? "border-ink-900 bg-ink-900 text-parchment hover:bg-ink-800"
                      : done
                        ? "border-forest/20 bg-forest-soft text-forest"
                        : "border-softborder bg-card text-ink-900 hover:bg-bluesoft"
                  }`}>
                  <span className="flex items-center gap-2">
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {activeTab === "timeline" && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <h2 className="mb-5 font-serif text-lg font-bold text-ink-900">Case timeline</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline events yet. Start by describing your problem.</p>
          ) : (
            <ol className="relative flex flex-col border-l border-softborder pl-6">
              {[...timeline].reverse().map((event, i) => (
                <li key={event.event_id} className={`relative ${i < timeline.length - 1 ? "pb-6" : ""}`}>
                  <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full border border-softborder bg-card">
                    <span className="h-2 w-2 rounded-full bg-ink-900" />
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-900">{event.label}</p>
                  {event.note && <p className="mt-0.5 text-xs text-ink-700">{event.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  )
}
