"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react"
import { useCaseContext } from "@/lib/case-context"

function parseDateStr(s: string): Date | null {
  if (!s) return null
  // Try DD/MM/YYYY
  const parts = s.split("/")
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`)
    if (!isNaN(d.getTime())) return d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export function EligibilityCheck() {
  const router = useRouter()
  const { caseData, setCaseData, addTimelineEvent } = useCaseContext()
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Derive rules dynamically from caseData ──────────────────────────────────

  const purchaseDate = parseDateStr(caseData.purchase_date)
  const now = new Date()
  const daysSincePurchase = purchaseDate
    ? Math.floor((now.getTime() - purchaseDate.getTime()) / 86400000)
    : 0
  const daysRemaining = 730 - daysSincePurchase
  const withinLimitation = !purchaseDate || daysSincePurchase <= 730
  const limitationWarning = daysRemaining < 90 && daysRemaining > 0

  const txAmount = caseData.transaction_amount || 0
  const isConsumer = !caseData.is_resale && caseData.purchase_purpose !== "COMMERCIAL"

  // Pecuniary jurisdiction
  let forumLabel = "District Consumer Disputes Redressal Commission"
  let forumSection = "Section 34, CPA 2019"
  if (txAmount > 20000000) { forumLabel = "National Consumer Disputes Redressal Commission"; forumSection = "Section 58, CPA 2019" }
  else if (txAmount > 5000000) { forumLabel = "State Consumer Disputes Redressal Commission"; forumSection = "Section 47, CPA 2019" }

  const hasDeficiency = !!(caseData.defect_description?.trim())
  const hasNotifiedOP = !!(caseData.company_response?.trim())

  const filingDeadline = purchaseDate
    ? new Date(purchaseDate.getTime() + 730 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Within 2 years of cause of action"

  const RULES = [
    {
      id: "r1",
      label: "Limitation period",
      description: "Complaint must be filed within 2 years of the cause of action (Section 69, CPA 2019).",
      passed: withinLimitation,
      detail: purchaseDate
        ? withinLimitation
          ? `Purchase date: ${purchaseDate.toLocaleDateString("en-IN")}. ${daysRemaining} days remaining. Filing deadline: ${filingDeadline}.`
          : `Purchase date: ${purchaseDate.toLocaleDateString("en-IN")}. Limitation period expired ${Math.abs(daysRemaining)} days ago. Condonation application required.`
        : "Purchase date not provided — assumed within limitation period.",
      warning: limitationWarning,
    },
    {
      id: "r2",
      label: "Consumer definition",
      description: "Complainant must be a consumer under Section 2(7) of CPA 2019.",
      passed: isConsumer,
      detail: isConsumer
        ? `${caseData.product_service || "Goods/services"} purchased for personal use, not for resale or commercial purpose.`
        : "Goods purchased for commercial/resale purpose — may not qualify as a consumer complaint.",
    },
    {
      id: "r3",
      label: "Pecuniary jurisdiction",
      description: "Complaint value determines the correct forum.",
      passed: txAmount > 0,
      detail: txAmount > 0
        ? `₹${txAmount.toLocaleString("en-IN")} → ${forumLabel} (${forumSection}).`
        : "Transaction amount not provided — cannot determine forum.",
    },
    {
      id: "r4",
      label: "Deficiency established",
      description: "A prima facie deficiency in goods or services must be identifiable.",
      passed: hasDeficiency,
      detail: hasDeficiency
        ? caseData.defect_description
        : "No deficiency description provided. Please describe what went wrong.",
    },
    {
      id: "r5",
      label: "Prior notice to opposite party",
      description: "Complainant should have given the seller an opportunity to remedy.",
      passed: hasNotifiedOP,
      detail: hasNotifiedOP
        ? `Opposite party contacted. Response: "${caseData.company_response?.slice(0, 120)}${(caseData.company_response?.length || 0) > 120 ? "…" : ""}"`
        : "No record of contacting the opposite party. Strongly recommended before filing.",
    },
  ]

  const allPassed = RULES.every((r) => r.passed)
  const condonationRequired = !withinLimitation

  async function handleConfirm() {
    setConfirmed(true)
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))

    setCaseData({
      status: "JURISDICTION_ROUTING",
      progress_percentage: 50,
      is_eligible: allPassed,
      eligibility_status: allPassed ? "ELIGIBLE" : "ISSUES_FOUND",
      filing_deadline: filingDeadline,
      days_remaining: daysRemaining,
      limitation_status: !withinLimitation ? "EXPIRED" : limitationWarning ? "WARNING" : "SAFE",
      condonation_required: condonationRequired,
      overall_recommendation: allPassed
        ? "Proceed to jurisdiction routing."
        : "Resolve flagged issues before filing.",
    })

    addTimelineEvent({
      event_id: `e-eligibility-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Eligibility confirmed",
      actor: "SYSTEM",
      note: `${RULES.filter((r) => r.passed).length}/5 criteria passed. ${condonationRequired ? "Condonation required." : ""}`,
    })

    setSubmitting(false)
    router.push("/jurisdiction")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Result banner */}
      <div className={`rounded-xl border p-5 ${allPassed ? "border-forest/30 bg-forest-soft" : "border-danger-ink/30 bg-red-50"}`}>
        <div className="flex items-center gap-3">
          {allPassed ? <ShieldCheck className="h-6 w-6 text-forest" /> : <XCircle className="h-6 w-6 text-danger-ink" />}
          <div>
            <p className="font-serif text-lg font-bold text-ink-900">
              {allPassed ? "Your complaint is eligible" : "Eligibility issue found"}
            </p>
            <p className="text-sm text-ink-700">
              {allPassed
                ? `All ${RULES.length} eligibility criteria under the Consumer Protection Act, 2019 are satisfied.`
                : "One or more criteria could not be verified. Review the details below."}
            </p>
          </div>
        </div>
      </div>

      {/* Case summary from context */}
      {(caseData.opposite_party_name || caseData.product_service) && (
        <div className="rounded-lg border border-softborder bg-parchment px-4 py-3 text-xs text-ink-700">
          <span className="font-semibold">Case: </span>
          {caseData.product_service} from {caseData.opposite_party_name}
          {caseData.transaction_amount > 0 && ` · ₹${caseData.transaction_amount.toLocaleString("en-IN")}`}
          {caseData.primary_case_type_label && ` · ${caseData.primary_case_type_label}`}
        </div>
      )}

      {/* Rules */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-5 font-serif text-lg font-bold text-ink-900">Eligibility criteria</h2>
        <div className="flex flex-col gap-4">
          {RULES.map((rule) => (
            <div key={rule.id} className={`flex items-start gap-3 rounded-lg border p-4 ${
              rule.passed ? "border-softborder" : "border-danger-ink/20 bg-red-50"
            }`}>
              {rule.passed
                ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
                : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-ink" />}
              <div>
                <p className="text-sm font-semibold text-ink-900">{rule.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{rule.description}</p>
                <p className={`mt-1.5 text-xs font-medium ${rule.passed ? "text-forest" : "text-danger-ink"}`}>
                  {rule.detail}
                </p>
                {"warning" in rule && rule.warning && rule.passed && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-ink">
                    <AlertCircle className="h-3 w-3" />
                    Warning: less than 90 days remaining — file soon.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legal note */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-ink/30 bg-amber-soft p-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
        <p className="text-xs leading-relaxed text-ink-800">
          This eligibility check is an AI-assisted preliminary assessment under the Consumer Protection Act, 2019.
          It does not constitute legal advice. The final determination rests with the Consumer Commission.
        </p>
      </div>

      {allPassed && (
        <button
          onClick={handleConfirm}
          disabled={confirmed || submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
        >
          {submitting
            ? <><Loader2 className="h-4 w-4 animate-spin" />Routing to jurisdiction…</>
            : <>Confirm & proceed to jurisdiction <ArrowRight className="h-4 w-4" /></>}
        </button>
      )}
    </div>
  )
}
