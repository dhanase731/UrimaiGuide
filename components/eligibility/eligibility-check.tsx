"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useCaseContext } from "@/lib/case-context"
import { buildEligibilityInputs } from "@/lib/eligibility/facts-bridge"
import {
  runAllRules,
  computeOverallStatus,
  type EligibilityRuleResult,
  type RuleStatus,
} from "@/lib/eligibility/rules"

// ── Status icon map ───────────────────────────────────────────────────────────

function StatusIcon({
  status,
  className = "h-5 w-5 shrink-0",
}: {
  status: RuleStatus
  className?: string
}) {
  switch (status) {
    case "PASS":
      return <CheckCircle2 className={`${className} text-forest`} />
    case "FAIL":
      return <XCircle className={`${className} text-danger-ink`} />
    case "INDETERMINATE":
      return <HelpCircle className={`${className} text-amber-ink`} />
    case "INFO":
      return <Info className={`${className} text-blue-500`} />
    case "NOT_APPLICABLE":
      return <Info className={`${className} text-muted-foreground`} />
  }
}

function statusBgClass(status: RuleStatus, isHardGate: boolean): string {
  switch (status) {
    case "PASS":          return "border-softborder"
    case "FAIL":          return isHardGate ? "border-danger-ink/20 bg-red-50" : "border-amber-ink/20 bg-amber-soft"
    case "INDETERMINATE": return "border-amber-ink/20 bg-amber-soft"
    case "INFO":          return "border-blue-200 bg-blue-50"
    case "NOT_APPLICABLE": return "border-softborder bg-parchment"
  }
}

function statusLabel(status: RuleStatus, isHardGate: boolean): string {
  switch (status) {
    case "PASS":           return "Satisfied"
    case "FAIL":           return isHardGate ? "Not satisfied" : "Advisory — not recorded"
    case "INDETERMINATE":  return "Cannot determine"
    case "INFO":           return "For information"
    case "NOT_APPLICABLE": return "Not applicable"
  }
}

function statusTextClass(status: RuleStatus, isHardGate: boolean): string {
  switch (status) {
    case "PASS":           return "text-forest"
    case "FAIL":           return isHardGate ? "text-danger-ink" : "text-amber-ink"
    case "INDETERMINATE":  return "text-amber-ink"
    case "INFO":           return "text-blue-600"
    case "NOT_APPLICABLE": return "text-muted-foreground"
  }
}

// ── Rule card ─────────────────────────────────────────────────────────────────

function RuleCard({ rule }: { rule: EligibilityRuleResult }) {
  const [expanded, setExpanded] = useState(false)

  const hasFacts =
    rule.supportingFacts.some(f => f.value !== null) ||
    rule.missingFacts.length > 0 ||
    rule.uncertainFacts.length > 0 ||
    rule.conflictFacts.length > 0

  // Split multi-line explanation (R1 has embedded \n\n date list)
  const explanationLines = rule.explanation.split("\n").map((l, i) => (
    <span key={i} className="block">
      {l}
    </span>
  ))

  return (
    <div
      className={`rounded-lg border p-4 ${statusBgClass(rule.status, rule.isHardGate)}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <StatusIcon status={rule.status} className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink-900">{rule.name}</p>
            <span
              className={`text-xs font-semibold ${statusTextClass(rule.status, rule.isHardGate)}`}
            >
              {statusLabel(rule.status, rule.isHardGate)}
            </span>
          </div>

          {/* Explanation */}
          <div
            className={`mt-1.5 text-xs font-medium ${statusTextClass(rule.status, rule.isHardGate)}`}
          >
            {explanationLines}
          </div>

          {/* Clarification message */}
          {rule.requiresClarification && rule.clarificationMessage && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-ink/20 bg-card px-3 py-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-ink" />
              <p className="text-xs text-ink-800">{rule.clarificationMessage}</p>
            </div>
          )}

          {/* Legal reference — display only, not a legal conclusion */}
          {rule.legalRef && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              {rule.legalRef}
            </p>
          )}

          {/* Expandable facts section */}
          {hasFacts && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-ink-900 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Hide supporting information</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Show supporting information</>
              )}
            </button>
          )}

          {expanded && hasFacts && (
            <div className="mt-3 flex flex-col gap-1.5">
              {/* Known supporting facts */}
              {rule.supportingFacts
                .filter(f => f.value !== null || f.status === "KNOWN")
                .map(f => (
                  <div
                    key={f.key}
                    className="rounded border border-softborder bg-parchment px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-ink-900">{f.label}:</span>{" "}
                    <span className="text-ink-700">{f.value ?? "—"}</span>
                    {f.source && (
                      <span className="ml-2 text-muted-foreground">
                        [{f.source}]
                      </span>
                    )}
                  </div>
                ))}

              {/* Unresolved facts */}
              {rule.missingFacts.map(k => (
                <div
                  key={`missing-${k}`}
                  className="rounded border border-amber-ink/20 bg-card px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold text-amber-ink">Missing:</span>{" "}
                  <span className="text-ink-700">{k}</span>
                </div>
              ))}
              {rule.uncertainFacts.map(k => (
                <div
                  key={`uncertain-${k}`}
                  className="rounded border border-amber-ink/20 bg-card px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold text-amber-ink">Uncertain:</span>{" "}
                  <span className="text-ink-700">{k}</span>
                </div>
              ))}
              {rule.conflictFacts.map(k => (
                <div
                  key={`conflict-${k}`}
                  className="rounded border border-danger-ink/20 bg-red-50 px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold text-danger-ink">Conflict:</span>{" "}
                  <span className="text-ink-700">{k}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function EligibilityCheck() {
  const router = useRouter()
  const { caseData, setCaseData, addTimelineEvent } = useCaseContext()

  const [confirmed, setConfirmed]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Build inputs + run rules (memoised — pure, no side effects) ───────────
  const { inputs, results, overallStatus } = useMemo(() => {
    const inp = buildEligibilityInputs(caseData, new Date())
    const res = runAllRules(inp)
    return { inputs: inp, results: res, overallStatus: computeOverallStatus(res) }
  }, [caseData])

  // ── Counts for the summary banner ─────────────────────────────────────────
  const gateResults    = results.filter(r => r.isHardGate)
  const passCount      = gateResults.filter(r => r.status === "PASS").length
  const failCount      = gateResults.filter(r => r.status === "FAIL").length
  const indeterCount   = gateResults.filter(r => r.status === "INDETERMINATE").length
  const totalGateCount = gateResults.length

  // Collect all unresolved clarification messages for the pre-proceed summary
  const unresolvedItems = results.filter(
    r => r.requiresClarification && r.clarificationMessage && r.status !== "PASS"
  )

  // ── Confirmation handler ──────────────────────────────────────────────────
  // The user can proceed regardless of INDETERMINATE / advisory FAIL — they are
  // acknowledging the unresolved information, not asserting everything passed.
  // A hard-gate FAIL blocks proceeding.

  const hasHardFail = failCount > 0 && gateResults.some(r => r.status === "FAIL" && r.isHardGate)

  async function handleConfirm() {
    setConfirmed(true)
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 700))

    // Derive filing deadline range from R1 supporting facts
    // We surface the earliest parseable date's deadline as a reference.
    // This is NOT a legal determination — displayed as a reference range only.
    const r1 = results.find(r => r.id === "R1")
    const purchaseDateFact = inputs.purchaseDateFact
    let filingDeadline = "Cannot be determined — cause-of-action date not established"
    let daysRemaining  = 0
    let limitationStatus: "SAFE" | "WARNING" | "CRITICAL" | "EXPIRED" = "SAFE"

    if (purchaseDateFact.status === "KNOWN" && purchaseDateFact.value) {
      // Use date-utils inline here to avoid importing at module level in a "use client" component
      // The bridge already parsed and the rule already computed — extract from supportingFacts
      const r1PurchaseLine = r1?.supportingFacts.find(f => f.key === "purchase_date")
      if (r1PurchaseLine?.value) {
        // Re-derive for CaseData storage only (not a legal conclusion)
        const parts = r1PurchaseLine.value.split(/[\/\-]/)
        let d: Date | null = null
        if (parts.length === 3 && parts[0].length === 4) {
          d = new Date(r1PurchaseLine.value)
        } else if (parts.length === 3) {
          d = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`)
        }
        if (d && !isNaN(d.getTime())) {
          const deadline = new Date(d)
          deadline.setDate(deadline.getDate() + 730)
          filingDeadline =
            `${deadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ` +
            "(based on purchase date — cause-of-action date not established)"
          const today = new Date()
          daysRemaining = Math.floor((deadline.getTime() - today.getTime()) / 86_400_000)
          if (daysRemaining < 0)       limitationStatus = "EXPIRED"
          else if (daysRemaining < 30) limitationStatus = "CRITICAL"
          else if (daysRemaining < 90) limitationStatus = "WARNING"
          else                         limitationStatus = "SAFE"
        }
      }
    }

    const allGatesPassed = overallStatus === "ALL_PASS"

    setCaseData({
      status:               "JURISDICTION_ROUTING",
      progress_percentage:  50,
      is_eligible:          allGatesPassed,
      eligibility_status:   overallStatus,
      filing_deadline:      filingDeadline,
      days_remaining:       daysRemaining,
      limitation_status:    limitationStatus,
      condonation_required: limitationStatus === "EXPIRED",
      overall_recommendation:
        hasHardFail
          ? "One or more procedural requirements are not satisfied. Review the flagged items before proceeding."
          : indeterCount > 0
          ? "Some eligibility information could not be determined. Review unresolved items before filing."
          : "All checked criteria are satisfied. Proceed to jurisdiction routing.",
      case_specific_data: {
        ...caseData.case_specific_data,
        eligibility_rule_results: results,
        eligibility_overall_status: overallStatus,
        eligibility_assessed_at: new Date().toISOString(),
      },
    })

    addTimelineEvent({
      event_id:  `e-eligibility-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label:     "Eligibility check completed",
      actor:     "SYSTEM",
      note:
        `Gate rules: ${passCount} passed, ${failCount} failed, ${indeterCount} indeterminate. ` +
        `Overall: ${overallStatus}.`,
    })

    setSubmitting(false)
    router.push("/jurisdiction")
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* ── Summary banner ──────────────────────────────────────────────── */}
      <div
        className={`rounded-xl border p-5 ${
          overallStatus === "ALL_PASS"
            ? "border-forest/30 bg-forest-soft"
            : overallStatus === "HAS_FAIL"
            ? "border-danger-ink/30 bg-red-50"
            : "border-amber-ink/30 bg-amber-soft"
        }`}
      >
        <div className="flex items-start gap-3">
          {overallStatus === "ALL_PASS" ? (
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-forest" />
          ) : overallStatus === "HAS_FAIL" ? (
            <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-danger-ink" />
          ) : (
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-ink" />
          )}
          <div>
            <p className="font-serif text-lg font-bold text-ink-900">
              {overallStatus === "ALL_PASS"
                ? "Procedural checks satisfied"
                : overallStatus === "HAS_FAIL"
                ? "One or more procedural requirements not satisfied"
                : "Some information could not be determined"}
            </p>
            <p className="mt-1 text-sm text-ink-700">
              {overallStatus === "ALL_PASS"
                ? `All ${totalGateCount} procedural criteria are satisfied based on the available information.`
                : overallStatus === "HAS_FAIL"
                ? `${failCount} of ${totalGateCount} procedural criteria were not satisfied. Review the details below.`
                : `${passCount} of ${totalGateCount} criteria satisfied · ${indeterCount} could not be determined · ${failCount} not satisfied.`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Case summary ─────────────────────────────────────────────────── */}
      {(caseData.opposite_party_name || caseData.product_service) && (
        <div className="rounded-lg border border-softborder bg-parchment px-4 py-3 text-xs text-ink-700">
          <span className="font-semibold">Case: </span>
          {caseData.product_service}
          {caseData.opposite_party_name && ` from ${caseData.opposite_party_name}`}
          {caseData.transaction_amount > 0 &&
            ` · ₹${caseData.transaction_amount.toLocaleString("en-IN")}`}
          {caseData.primary_case_type_label && ` · ${caseData.primary_case_type_label}`}
        </div>
      )}

      {/* ── Rule cards ───────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-5 font-serif text-lg font-bold text-ink-900">
          Eligibility criteria
        </h2>
        <div className="flex flex-col gap-4">
          {results.map(rule => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </section>

      {/* ── Unresolved items summary (shown when proceeding despite INDETERMINATE) */}
      {unresolvedItems.length > 0 && (
        <section className="rounded-xl border border-amber-ink/30 bg-amber-soft p-5">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-amber-ink">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Information that could not be determined
          </h2>
          <p className="mb-3 text-xs text-ink-800">
            The following items were not resolved during the interview. You may proceed, but
            be aware that this information may be required when filing.
          </p>
          <ul className="flex flex-col gap-2">
            {unresolvedItems.map(r => (
              <li
                key={r.id}
                className="rounded-lg border border-amber-ink/20 bg-card px-4 py-3 text-xs"
              >
                <p className="font-semibold text-ink-900">{r.name}</p>
                <p className="mt-0.5 text-ink-700">{r.clarificationMessage}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Legal disclaimer ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-ink/30 bg-amber-soft p-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
        <p className="text-xs leading-relaxed text-ink-800">
          This eligibility check is an AI-assisted preliminary procedural assessment
          under the Consumer Protection Act, 2019. It does not constitute legal advice
          and does not determine the merits of the complaint. Legal references shown are
          for information only and must be verified against current legislation.
          The final determination rests with the Consumer Commission.
        </p>
      </div>

      {/* ── Hard fail: cannot proceed ────────────────────────────────────── */}
      {hasHardFail && (
        <div className="flex items-start gap-3 rounded-lg border border-danger-ink/30 bg-red-50 p-4">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-ink" />
          <p className="text-xs leading-relaxed text-ink-800">
            One or more procedural requirements are not satisfied. Please review the items
            marked as "Not satisfied" above before proceeding to jurisdiction routing.
          </p>
        </div>
      )}

      {/* ── Confirm button ───────────────────────────────────────────────── */}
      {!hasHardFail && (
        <button
          onClick={handleConfirm}
          disabled={confirmed || submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Routing to jurisdiction…
            </>
          ) : indeterCount > 0 ? (
            <>
              Acknowledge and proceed to jurisdiction
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Confirm and proceed to jurisdiction
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      )}

      {/* ── Indeterminate warning below button ──────────────────────────── */}
      {!hasHardFail && indeterCount > 0 && (
        <p className="text-xs text-amber-ink">
          You are proceeding with {indeterCount} unresolved item
          {indeterCount > 1 ? "s" : ""}. These will be noted in the case record.
        </p>
      )}
    </div>
  )
}
