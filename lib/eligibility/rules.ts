// lib/eligibility/rules.ts
// Pure, deterministic rule engine for Module 4 Eligibility.
// No React. No Gemini. No network calls. No side effects.
//
// Each rule is a pure function: (EligibilityInputs) => EligibilityRuleResult
//
// LEGAL NOTICE:
// This module contains PROCEDURAL eligibility checks only.
// It does NOT make legal merits determinations.
// All legal references (section numbers, etc.) are display labels only.
// The rules identified as requiring external legal verification are marked
// with [LEGAL-VERIFY] comments and must be confirmed against the current
// text of the Consumer Protection Act, 2019 and any applicable amendments
// before this output is presented as authoritative.
//
// Rules requiring legal verification before implementation:
//   H1 — Section 69 limitation period (2 years) — confirm current Act text
//   H2 — What constitutes the cause-of-action date for a defect case
//   H3 — Condonation of delay mechanism under Section 69(2)
//   H4 — Section 2(7) consumer definition — self-employment/livelihood carve-out
//   H6 — Whether prior notice is a mandatory precondition for filing

import { isYes, isNo, type Fact, type FactKey } from "@/lib/interview/facts"
import type { EligibilityInputs } from "./facts-bridge"
import {
  parseFactDate,
  parseRelativeTiming,
  daysBetween,
  formatDateIN,
  addDays,
} from "./date-utils"

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * PASS            — the rule's procedural condition is satisfied.
 * FAIL            — the rule's procedural condition is clearly not satisfied.
 * INDETERMINATE   — a material input is MISSING, UNCERTAIN, or CONFLICT;
 *                   the rule cannot safely resolve to PASS or FAIL.
 * NOT_APPLICABLE  — the rule does not apply to this case type.
 * INFO            — informational only; cannot pass or fail (R6, R7).
 */
export type RuleStatus =
  | "PASS"
  | "FAIL"
  | "INDETERMINATE"
  | "NOT_APPLICABLE"
  | "INFO"

/** A single fact that contributed to (or was missing from) a rule's result. */
export interface SupportingFact {
  key:    string
  label:  string
  value:  string | null
  status: Fact["status"]
  source: Fact["source"]
}

export interface EligibilityRuleResult {
  /** Short identifier, e.g. "R1". */
  id:   string
  name: string
  /**
   * Result status. Rules R6 and R7 always return INFO.
   * A FAIL or INDETERMINATE on R1–R5 must be surfaced prominently.
   */
  status: RuleStatus
  /**
   * true  → a FAIL here is a procedural blocker.
   * false → a FAIL here is advisory (R3) or informational (R6, R7).
   *
   * [LEGAL-VERIFY H6] R3 is currently advisory. If CPA 2019 establishes
   * prior notice as a mandatory precondition, set isHardGate = true for R3.
   */
  isHardGate: boolean
  /** Plain-language explanation in neutral procedural wording. */
  explanation: string
  /**
   * Optional secondary note for clarification / legal reference.
   * Display strings only — not logic conditions.
   */
  legalRef: string | null
  /** Facts that contributed to (or are needed for) this result. */
  supportingFacts: SupportingFact[]
  /** Material facts that are MISSING and caused or contributed to INDETERMINATE. */
  missingFacts: FactKey[]
  /** Material facts that are UNCERTAIN and caused or contributed to INDETERMINATE. */
  uncertainFacts: FactKey[]
  /** Material facts that are in CONFLICT and caused or contributed to INDETERMINATE. */
  conflictFacts: FactKey[]
  /** true when the user should be shown a clarification prompt before proceeding. */
  requiresClarification: boolean
  /** Human-readable description of what needs to be clarified. null if not needed. */
  clarificationMessage: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSupportingFact(fact: Fact, label: string): SupportingFact {
  return {
    key:    fact.key,
    label,
    value:  fact.value,
    status: fact.status,
    source: fact.source,
  }
}

/**
 * Returns true when a Fact's status prevents reliable use as an input
 * (MISSING, UNCERTAIN, or CONFLICT).
 */
function isUnresolved(fact: Fact): boolean {
  return (
    fact.status === "MISSING" ||
    fact.status === "UNCERTAIN" ||
    fact.status === "CONFLICT"
  )
}

function pushUnresolved(
  fact: Fact,
  key: FactKey,
  missing: FactKey[],
  uncertain: FactKey[],
  conflict: FactKey[]
) {
  if (fact.status === "MISSING")   missing.push(key)
  if (fact.status === "UNCERTAIN") uncertain.push(key)
  if (fact.status === "CONFLICT")  conflict.push(key)
}

// ── R1 — Limitation Period ────────────────────────────────────────────────────
//
// [LEGAL-VERIFY H1] The statutory period is stated as two years in Section 69
// of the Consumer Protection Act, 2019. The constant TWO_YEARS_DAYS below
// reflects this. Confirm the current Act text before publishing.
//
// [LEGAL-VERIFY H2] "The date on which the cause of action has arisen" is a
// legal question, not a factual one. This rule displays all available dates and
// their arithmetic but does NOT auto-select one as the legal cause-of-action
// date. The user must understand which date is legally operative.
//
// [LEGAL-VERIFY H3] Condonation of delay under Section 69(2) — confirm the
// mechanism and any limit on the condonation window.
//
// WARNING_DAYS_THRESHOLD: the number of days remaining below which a warning
// is surfaced. Currently 90 days — not a legal rule, just a UX signal.

const TWO_YEARS_DAYS     = 730  // [LEGAL-VERIFY H1]
const WARNING_DAYS_THRESHOLD = 90

interface DateCandidate {
  label:       string
  date:        Date
  source:      string
  isAbsolute:  boolean   // true = directly stated; false = derived from relative timing
}

export function runRule_R1(inputs: EligibilityInputs): EligibilityRuleResult {
  const {
    purchaseDateFact,
    problemTimingFact,
    sellerContactDateFact,
    sellerResponseFact,
    today,
  } = inputs

  const supporting: SupportingFact[] = []
  const missing:    FactKey[]        = []
  const uncertain:  FactKey[]        = []
  const conflict:   FactKey[]        = []

  // ── Collect all available date facts for display ─────────────────────────
  supporting.push(toSupportingFact(purchaseDateFact,      "Purchase date"))
  supporting.push(toSupportingFact(problemTimingFact,     "When problem started"))
  supporting.push(toSupportingFact(sellerContactDateFact, "Date seller was contacted"))
  supporting.push(toSupportingFact(sellerResponseFact,    "Seller response / refusal"))

  // ── Parse each available date ─────────────────────────────────────────────
  const purchaseDate      = parseFactDate(purchaseDateFact)
  const sellerContactDate = parseFactDate(sellerContactDateFact)

  // problem_timing is usually a relative expression; try to anchor it to purchaseDate
  let problemOccurrenceDate: Date | null = null
  if (problemTimingFact.status === "KNOWN" && problemTimingFact.value) {
    // First try direct parse (user may have entered an absolute date)
    problemOccurrenceDate = parseFactDate(problemTimingFact)
    // If that failed and we have a purchase date, try relative parse
    if (!problemOccurrenceDate && purchaseDate) {
      problemOccurrenceDate = parseRelativeTiming(problemTimingFact.value, purchaseDate)
    }
  }

  // ── Build candidates list (dates we know something about) ────────────────
  const candidates: DateCandidate[] = []

  if (purchaseDate) {
    candidates.push({
      label:      "Purchase date",
      date:       purchaseDate,
      source:     `${purchaseDateFact.source ?? "unknown"} — ${purchaseDateFact.value ?? ""}`,
      isAbsolute: true,
    })
  }

  if (problemOccurrenceDate) {
    const isAbsolute = parseFactDate(problemTimingFact) !== null
    candidates.push({
      label:      "Problem occurrence (derived from timing)",
      date:       problemOccurrenceDate,
      source:     `${problemTimingFact.source ?? "unknown"} — "${problemTimingFact.value ?? ""}"`,
      isAbsolute,
    })
  }

  if (sellerContactDate) {
    candidates.push({
      label:      "Seller contacted",
      date:       sellerContactDate,
      source:     `${sellerContactDateFact.source ?? "unknown"} — ${sellerContactDateFact.value ?? ""}`,
      isAbsolute: true,
    })
  }

  // ── Check for unresolved material facts ──────────────────────────────────
  // purchase_date is material to all limitation arithmetic
  if (isUnresolved(purchaseDateFact)) {
    pushUnresolved(purchaseDateFact, "purchase_date", missing, uncertain, conflict)
  }

  // ── Build explanation with date arithmetic ────────────────────────────────
  const dateLines: string[] = candidates.map(c => {
    const daysAgo      = daysBetween(c.date, today)
    const daysLeft     = TWO_YEARS_DAYS - daysAgo
    const deadline     = formatDateIN(addDays(c.date, TWO_YEARS_DAYS))
    const sign         = daysLeft >= 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days past the 2-year period`
    const absoluteNote = c.isAbsolute ? "" : " (approximate — derived from relative timing)"
    return `• ${c.label}: ${formatDateIN(c.date)}${absoluteNote} → if this is the cause-of-action date, filing deadline would be ${deadline} (${sign})`
  })

  // ── Determine status ──────────────────────────────────────────────────────
  // FAIL only when EVERY available parseable date is more than 2 years before today.
  // If no date is parseable at all, or if cause-of-action date cannot be established,
  // return INDETERMINATE — never auto-fail on ambiguity.
  //
  // [LEGAL-VERIFY H2] This rule intentionally does NOT choose which date is the
  // legal cause-of-action date. That determination belongs to the Commission.

  let status:  RuleStatus = "INDETERMINATE"
  let explanation         = ""
  let clarificationMessage: string | null = null
  let legalRef: string | null =
    "Section 69, Consumer Protection Act, 2019: complaint must be filed within two years from the date on which the cause of action has arisen. [LEGAL-VERIFY H1]"  // display only

  if (candidates.length === 0) {
    // No parseable dates at all
    status              = "INDETERMINATE"
    clarificationMessage =
      "No date information could be confirmed. The purchase date, date the problem started, " +
      "and date the seller was contacted are all missing or unconfirmed. " +
      "These are needed to assess whether the complaint is within the limitation period."
    explanation =
      "Limitation period: cannot be assessed — no confirmed date information is available."

  } else if (candidates.every(c => daysBetween(c.date, today) > TWO_YEARS_DAYS)) {
    // All available dates are beyond 2 years — flag as potential expiry
    // but keep as INDETERMINATE because the cause-of-action date is not established.
    // Only mark FAIL when the user has explicitly confirmed a cause-of-action date
    // and it is > 2 years ago — that confirmation step is not implemented here.
    status              = "INDETERMINATE"
    clarificationMessage =
      "All available dates appear to be more than two years before today. " +
      "If the legally relevant cause-of-action date is also more than two years ago, " +
      "a condonation application under Section 69(2) may be required. " +
      "Please confirm which date is the operative cause-of-action date."  // [LEGAL-VERIFY H3]
    legalRef =
      "Section 69(2), Consumer Protection Act, 2019: a complaint filed after the two-year period " +
      "may be entertained if the complainant satisfies the Commission that there was sufficient cause " +
      "for not filing within the period. The Commission must record its reasons for condoning the delay. " +
      "There is no fixed statutory outer time limit stated in Section 69 itself — condonation is at " +
      "the Commission's discretion on the facts. [H1 verified: 2-year period confirmed. H3 verified: no outer limit in statute.]"
    explanation =
      "Limitation period: all recorded dates are more than two years before today. " +
      "If the cause-of-action date is confirmed to be within the two-year period, " +
      "this rule may be satisfied."

  } else {
    // At least one candidate is within the 2-year window
    // Still INDETERMINATE — cause-of-action date not established
    status              = "INDETERMINATE"
    const withinWindow  = candidates.filter(c => daysBetween(c.date, today) <= TWO_YEARS_DAYS)
    const hasWarning    = withinWindow.some(c => {
      const daysLeft = TWO_YEARS_DAYS - daysBetween(c.date, today)
      return daysLeft < WARNING_DAYS_THRESHOLD
    })

    explanation =
      `Limitation period: ${withinWindow.length} of ${candidates.length} recorded date(s) ` +
      `fall within the two-year period. The legally operative cause-of-action date has not ` +
      `been established — see dates below.` +
      (hasWarning ? " Warning: fewer than 90 days remain on one or more recorded dates." : "")

    clarificationMessage =
      "The cause of action date is a legal question that cannot be determined automatically. " +
      "Section 69 of the Consumer Protection Act, 2019 requires filing within two years of " +
      "the date on which the cause of action arose. This may be the date the defect appeared, " +
      "the date the seller refused to remedy the problem, or another date depending on the facts. " +
      "Review the dates below and confirm the relevant date before proceeding."
  }

  // Append date-by-date lines to explanation
  if (dateLines.length > 0) {
    explanation += "\n\nAvailable dates:\n" + dateLines.join("\n")
  }

  // Unresolved purchase date always requires clarification
  if (missing.includes("purchase_date") || uncertain.includes("purchase_date") || conflict.includes("purchase_date")) {
    clarificationMessage = (clarificationMessage ?? "") +
      "\n\nThe purchase date is missing or unconfirmed, which prevents any limitation arithmetic."
  }

  return {
    id:   "R1",
    name: "Limitation period",
    status,
    isHardGate:           true,
    explanation,
    legalRef,
    supportingFacts:      supporting,
    missingFacts:         missing,
    uncertainFacts:       uncertain,
    conflictFacts:        conflict,
    requiresClarification: true,  // always require user acknowledgement for R1
    clarificationMessage,
  }
}

// ── R2 — Consumer Status ──────────────────────────────────────────────────────
//
// [LEGAL-VERIFY H4] Section 2(7) of the Consumer Protection Act, 2019 defines
// "consumer". A purchase for "commercial purpose" may be excluded, but purchases
// for self-employment / livelihood are typically protected. The exact statutory
// language must be verified before implementing a binary PASS/FAIL on this field.
//
// The current implementation treats "COMMERCIAL" + is_resale=false as
// INDETERMINATE (possible livelihood use) rather than automatic FAIL.

export function runRule_R2(inputs: EligibilityInputs): EligibilityRuleResult {
  const { purchasePurpose, isResale } = inputs

  const supportingFacts: SupportingFact[] = [
    {
      key:    "purchase_purpose",
      label:  "Purchase purpose",
      value:  purchasePurpose || null,
      status: purchasePurpose ? "KNOWN" : "MISSING",
      source: "MODULE2_FIELD",
    },
    {
      key:    "is_resale",
      label:  "Purchased for resale",
      value:  String(isResale),
      status: "KNOWN",
      source: "MODULE2_FIELD",
    },
  ]

  // Resale → definitive procedural exclusion
  if (isResale) {
    return {
      id:   "R2",
      name: "Consumer status",
      status:       "FAIL",
      isHardGate:   true,
      explanation:
        "The goods were recorded as purchased for resale. A purchaser who buys goods for resale " +
        "does not meet the consumer definition under Section 2(7) of the Consumer Protection Act, 2019.",
      legalRef:     "Section 2(7), Consumer Protection Act, 2019. [LEGAL-VERIFY H4]",
      supportingFacts,
      missingFacts:  [],
      uncertainFacts: [],
      conflictFacts:  [],
      requiresClarification: false,
      clarificationMessage:  null,
    }
  }

  // Personal use → PASS
  if (purchasePurpose === "PERSONAL_USE") {
    return {
      id:   "R2",
      name: "Consumer status",
      status:       "PASS",
      isHardGate:   true,
      explanation:
        "Purchase purpose recorded as personal use and not for resale. " +
        "This satisfies the procedural consumer definition check.",
      legalRef:     "Section 2(7), Consumer Protection Act, 2019. [LEGAL-VERIFY H4]",
      supportingFacts,
      missingFacts:  [],
      uncertainFacts: [],
      conflictFacts:  [],
      requiresClarification: false,
      clarificationMessage:  null,
    }
  }

  // Commercial purpose + not resale → INDETERMINATE
  // May be a self-employment / livelihood purchase protected under Section 2(7).
  if (purchasePurpose === "COMMERCIAL") {
    return {
      id:   "R2",
      name: "Consumer status",
      status:       "INDETERMINATE",
      isHardGate:   true,
      explanation:
        "Purchase purpose is recorded as commercial. However, under Section 2(7) of the Consumer Protection Act, 2019, " +
        "\"commercial purpose\" explicitly does not include use of goods bought exclusively for the purposes of " +
        "earning one's livelihood by means of self-employment. A final legal determination cannot be made " +
        "automatically from this field alone — please clarify the nature of the purchase.",
      legalRef:     "Section 2(7), Consumer Protection Act, 2019. [LEGAL-VERIFY H4]",
      supportingFacts,
      missingFacts:  [],
      uncertainFacts: [],
      conflictFacts:  [],
      requiresClarification: true,
      clarificationMessage:
        "Please clarify: was this purchase made for a commercial/profit-making purpose, " +
        "or for use in your self-employment / livelihood? This affects whether the complaint " +
        "qualifies as a consumer complaint.",
    }
  }

  // Purpose field is empty or unrecognised → INDETERMINATE
  return {
    id:   "R2",
    name: "Consumer status",
    status:       "INDETERMINATE",
    isHardGate:   true,
    explanation:
      "Purchase purpose has not been recorded or could not be determined. " +
      "Consumer status cannot be confirmed without this information.",
    legalRef:     "Section 2(7), Consumer Protection Act, 2019. [LEGAL-VERIFY H4]",
    supportingFacts,
    missingFacts:  [],
    uncertainFacts: [],
    conflictFacts:  [],
    requiresClarification: true,
    clarificationMessage:
      "The purpose of the purchase (personal use, commercial use, or self-employment) " +
      "has not been recorded. Please verify this information in the intake details.",
  }
}

// ── R3 — Prior Contact with Opposite Party ────────────────────────────────────
//
// [LEGAL-VERIFY H6] Whether prior notice to the opposite party is a mandatory
// precondition for filing under CPA 2019 must be verified. This rule is
// currently advisory (isHardGate: false). If legal verification establishes
// it as mandatory, set isHardGate: true.
//
// IMPORTANT: seller_response is NOT used as proof that contact was made.
// Only seller_contacted (Module 3 interview fact) is used.

export function runRule_R3(inputs: EligibilityInputs): EligibilityRuleResult {
  const { sellerContactedFact, sellerContactDateFact, sellerResponseFact, complaint_ref_number } = {
    ...inputs,
    complaint_ref_number: undefined as Fact | undefined,
  }

  const missing:   FactKey[] = []
  const uncertain: FactKey[] = []
  const conflict:  FactKey[] = []

  const supporting: SupportingFact[] = [
    toSupportingFact(sellerContactedFact,   "Seller contacted"),
    toSupportingFact(sellerContactDateFact, "Date of contact"),
    toSupportingFact(sellerResponseFact,    "Seller response (for information only — not proof of contact)"),
  ]

  if (sellerContactedFact.status === "KNOWN") {
    if (isYes(sellerContactedFact.value)) {
      return {
        id:   "R3",
        name: "Prior contact with opposite party",
        status:       "PASS",
        isHardGate:   false,    // [LEGAL-VERIFY H6]
        explanation:
          "Seller or manufacturer was contacted about the problem before this complaint. " +
          "This is a recommended step before filing.",
        legalRef:     "[LEGAL-VERIFY H6] — whether prior notice is a mandatory precondition under CPA 2019 must be confirmed.",
        supportingFacts: supporting,
        missingFacts:  [],
        uncertainFacts: [],
        conflictFacts:  [],
        requiresClarification: false,
        clarificationMessage:  null,
      }
    }

    if (isNo(sellerContactedFact.value)) {
      return {
        id:   "R3",
        name: "Prior contact with opposite party",
        status:       "FAIL",
        isHardGate:   false,    // advisory — [LEGAL-VERIFY H6]
        explanation:
          "No prior contact with the seller or manufacturer has been recorded. " +
          "It is strongly recommended to give the opposite party an opportunity to address " +
          "the problem before filing a complaint with the Consumer Commission.",
        legalRef:     "[LEGAL-VERIFY H6] — whether prior notice is a mandatory precondition under CPA 2019 must be confirmed.",
        supportingFacts: supporting,
        missingFacts:  [],
        uncertainFacts: [],
        conflictFacts:  [],
        requiresClarification: true,
        clarificationMessage:
          "No contact with the seller has been recorded. Consider contacting the seller " +
          "or manufacturer with a written notice before filing.",
      }
    }
  }

  // MISSING / UNCERTAIN / CONFLICT → INDETERMINATE
  pushUnresolved(sellerContactedFact, "seller_contacted", missing, uncertain, conflict)

  return {
    id:   "R3",
    name: "Prior contact with opposite party",
    status:       "INDETERMINATE",
    isHardGate:   false,    // [LEGAL-VERIFY H6]
    explanation:
      "Whether the seller or manufacturer was contacted has not been confirmed.",
    legalRef:     "[LEGAL-VERIFY H6] — whether prior notice is a mandatory precondition under CPA 2019 must be confirmed.",
    supportingFacts: supporting,
    missingFacts:  missing,
    uncertainFacts: uncertain,
    conflictFacts:  conflict,
    requiresClarification: true,
    clarificationMessage:
      "Please confirm whether the seller or manufacturer was contacted about this problem.",
  }
}

// ── R4 — Defect / Problem Described ──────────────────────────────────────────
//
// This is a procedural fact check only.
// A non-empty description does NOT establish a legal deficiency.
// Wording must use "Problem/defect described: Yes" — not "Deficiency established".

export function runRule_R4(inputs: EligibilityInputs): EligibilityRuleResult {
  const { problemDescriptionFact, defectDescriptionRaw } = inputs

  const missing:   FactKey[] = []
  const uncertain: FactKey[] = []
  const conflict:  FactKey[] = []

  const supporting: SupportingFact[] = [
    toSupportingFact(problemDescriptionFact, "Problem/defect description"),
  ]

  // CONFLICT in description → INDETERMINATE
  if (problemDescriptionFact.status === "CONFLICT") {
    conflict.push("problem_description")
    return {
      id:   "R4",
      name: "Problem/defect described",
      status:       "INDETERMINATE",
      isHardGate:   true,
      explanation:
        "The problem description contains conflicting information that has not been resolved.",
      legalRef:     null,
      supportingFacts: supporting,
      missingFacts:  missing,
      uncertainFacts: uncertain,
      conflictFacts:  conflict,
      requiresClarification: true,
      clarificationMessage:
        "There is a conflict in the problem description recorded during the interview. " +
        "Please resolve this before proceeding.",
    }
  }

  // KNOWN and non-empty → PASS (procedural fact only)
  if (
    problemDescriptionFact.status === "KNOWN" &&
    problemDescriptionFact.value?.trim()
  ) {
    return {
      id:   "R4",
      name: "Problem/defect described",
      status:       "PASS",
      isHardGate:   true,
      explanation:
        "Problem/defect described: Yes. " +
        "A description of the problem has been provided. " +
        "Whether this constitutes a deficiency in goods or services is a determination " +
        "for the Consumer Commission — not assessed here.",
      legalRef:     null,
      supportingFacts: supporting,
      missingFacts:  [],
      uncertainFacts: [],
      conflictFacts:  [],
      requiresClarification: false,
      clarificationMessage:  null,
    }
  }

  // Fallback: CaseData defect_description non-empty → PASS with lower confidence
  if (defectDescriptionRaw.trim()) {
    const fallbackFact: SupportingFact = {
      key:    "defect_description",
      label:  "Problem description (from intake form)",
      value:  defectDescriptionRaw,
      status: "KNOWN",
      source: "MODULE2_FIELD",
    }
    return {
      id:   "R4",
      name: "Problem/defect described",
      status:       "PASS",
      isHardGate:   true,
      explanation:
        "Problem/defect described: Yes (from intake form). " +
        "A description of the problem has been provided. " +
        "Whether this constitutes a deficiency in goods or services is a determination " +
        "for the Consumer Commission — not assessed here.",
      legalRef:     null,
      supportingFacts: [fallbackFact],
      missingFacts:  [],
      uncertainFacts: [],
      conflictFacts:  [],
      requiresClarification: false,
      clarificationMessage:  null,
    }
  }

  // Nothing available → INDETERMINATE
  pushUnresolved(problemDescriptionFact, "problem_description", missing, uncertain, conflict)
  if (!missing.includes("problem_description") &&
      !uncertain.includes("problem_description") &&
      !conflict.includes("problem_description")) {
    missing.push("problem_description")
  }

  return {
    id:   "R4",
    name: "Problem/defect described",
    status:       "INDETERMINATE",
    isHardGate:   true,
    explanation:
      "No problem or defect description has been recorded. " +
      "A description of the issue is required to proceed.",
    legalRef:     null,
    supportingFacts: supporting,
    missingFacts:  missing,
    uncertainFacts: uncertain,
    conflictFacts:  conflict,
    requiresClarification: true,
    clarificationMessage:
      "No description of the problem has been found in either the intake form or the interview. " +
      "Please go back and describe the defect or issue.",
  }
}

// ── R5 — Claim Amount Determinable ────────────────────────────────────────────
//
// Module 4 only determines whether a usable claim amount is known.
// It does NOT compute or re-implement forum jurisdiction thresholds.
// Those are handled exclusively by Module 5 (jurisdiction-routing.tsx).

export function runRule_R5(inputs: EligibilityInputs): EligibilityRuleResult {
  const { purchasePriceFact, transactionAmount } = inputs

  const missing:   FactKey[] = []
  const uncertain: FactKey[] = []
  const conflict:  FactKey[] = []

  const supporting: SupportingFact[] = [
    toSupportingFact(purchasePriceFact, "Purchase price"),
  ]

  // CONFLICT → INDETERMINATE
  if (purchasePriceFact.status === "CONFLICT") {
    conflict.push("purchase_price")
    return {
      id:   "R5",
      name: "Claim amount determinable",
      status:       "INDETERMINATE",
      isHardGate:   true,
      explanation:
        "The purchase price recorded during the interview contains conflicting values. " +
        "The correct amount must be confirmed before the appropriate forum can be determined.",
      legalRef:     null,
      supportingFacts: supporting,
      missingFacts:  missing,
      uncertainFacts: uncertain,
      conflictFacts:  conflict,
      requiresClarification: true,
      clarificationMessage:
        "There is a conflict in the purchase price. Please clarify the correct amount.",
    }
  }

  // KNOWN with a parseable non-zero amount → PASS
  if (purchasePriceFact.status === "KNOWN" && purchasePriceFact.value) {
    const parsed = parseFloat(purchasePriceFact.value.replace(/[^0-9.]/g, ""))
    if (!isNaN(parsed) && parsed > 0) {
      return {
        id:   "R5",
        name: "Claim amount determinable",
        status:       "PASS",
        isHardGate:   true,
        explanation:
          `Claim amount: ${purchasePriceFact.value}. ` +
          "The appropriate forum will be determined in Module 5 based on this amount.",
        legalRef:     null,
        supportingFacts: supporting,
        missingFacts:  [],
        uncertainFacts: [],
        conflictFacts:  [],
        requiresClarification: false,
        clarificationMessage:  null,
      }
    }
  }

  // Fallback: CaseData transaction_amount > 0 → PASS (lower priority)
  if (transactionAmount > 0) {
    const fallbackFact: SupportingFact = {
      key:    "transaction_amount",
      label:  "Transaction amount (from intake form)",
      value:  `₹${transactionAmount.toLocaleString("en-IN")}`,
      status: "KNOWN",
      source: "MODULE2_FIELD",
    }
    return {
      id:   "R5",
      name: "Claim amount determinable",
      status:       "PASS",
      isHardGate:   true,
      explanation:
        `Claim amount (from intake form): ₹${transactionAmount.toLocaleString("en-IN")}. ` +
        "The appropriate forum will be determined in Module 5 based on this amount.",
      legalRef:     null,
      supportingFacts: [fallbackFact],
      missingFacts:  [],
      uncertainFacts: [],
      conflictFacts:  [],
      requiresClarification: false,
      clarificationMessage:  null,
    }
  }

  // UNCERTAIN → INDETERMINATE
  if (purchasePriceFact.status === "UNCERTAIN") {
    uncertain.push("purchase_price")
    return {
      id:   "R5",
      name: "Claim amount determinable",
      status:       "INDETERMINATE",
      isHardGate:   true,
      explanation:
        "The purchase price was recorded but could not be confirmed as a valid amount. " +
        "The appropriate forum cannot be determined without a confirmed claim amount.",
      legalRef:     null,
      supportingFacts: supporting,
      missingFacts:  missing,
      uncertainFacts: uncertain,
      conflictFacts:  conflict,
      requiresClarification: true,
      clarificationMessage:
        "Please confirm the purchase price (a numeric amount in Indian Rupees). " +
        "This is needed to determine the correct Consumer Commission.",
    }
  }

  // MISSING / zero → INDETERMINATE
  missing.push("purchase_price")
  return {
    id:   "R5",
    name: "Claim amount determinable",
    status:       "INDETERMINATE",
    isHardGate:   true,
    explanation:
      "No purchase price has been recorded. " +
      "The appropriate Consumer Commission cannot be determined without a claim amount.",
    legalRef:     null,
    supportingFacts: supporting,
    missingFacts:  missing,
    uncertainFacts: uncertain,
    conflictFacts:  conflict,
    requiresClarification: true,
    clarificationMessage:
      "The purchase price is missing. Please go back to the interview and provide " +
      "the amount paid for the product.",
  }
}

// ── R6 — Warranty Status (INFO only) ─────────────────────────────────────────
//
// Warranty status is relevant case context — not an eligibility gate.
// "Under warranty" does not guarantee a favourable outcome.
// "Warranty expired" does not disqualify a complaint.

export function runRule_R6(inputs: EligibilityInputs): EligibilityRuleResult {
  const { warrantyStatusFact } = inputs

  const supporting: SupportingFact[] = [
    toSupportingFact(warrantyStatusFact, "Warranty status"),
  ]

  let explanation: string
  if (warrantyStatusFact.status === "KNOWN" && warrantyStatusFact.value) {
    explanation = `Warranty status: ${warrantyStatusFact.value}.`
  } else if (warrantyStatusFact.status === "NOT_APPLICABLE") {
    explanation = "Warranty status: not applicable for this product type."
  } else {
    explanation = "Warranty status: not recorded."
  }

  explanation +=
    " Warranty status may be relevant to the nature of the deficiency and the relief available. " +
    "It is not by itself a condition for filing a consumer complaint."

  return {
    id:   "R6",
    name: "Warranty status",
    status:       "INFO",
    isHardGate:   false,
    explanation,
    legalRef:     null,
    supportingFacts: supporting,
    missingFacts:  [],
    uncertainFacts: [],
    conflictFacts:  [],
    requiresClarification: false,
    clarificationMessage:  null,
  }
}

// ── R7 — Physical Damage (INFO only) ─────────────────────────────────────────
//
// Physical damage is recorded for case context only.
// Its presence or absence does not determine procedural eligibility.
// Whether it constitutes misuse that defeats a warranty claim is a
// merits question for the Commission, not determined here.

export function runRule_R7(inputs: EligibilityInputs): EligibilityRuleResult {
  const { physicalDamageFact } = inputs

  const supporting: SupportingFact[] = [
    toSupportingFact(physicalDamageFact, "Physical damage"),
  ]

  let explanation: string
  if (physicalDamageFact.status === "KNOWN") {
    if (isYes(physicalDamageFact.value)) {
      explanation =
        "Physical damage: Yes — physical damage (drop, crack, or liquid exposure) has been recorded."
    } else if (isNo(physicalDamageFact.value)) {
      explanation = "Physical damage: No — no physical damage has been recorded."
    } else {
      explanation = `Physical damage: ${physicalDamageFact.value ?? "recorded"}.`
    }
  } else if (physicalDamageFact.status === "NOT_APPLICABLE") {
    explanation = "Physical damage: not applicable for this product type."
  } else {
    explanation = "Physical damage: not confirmed."
  }

  explanation +=
    " Physical damage may affect the warranty position and the nature of the claim. " +
    "It does not by itself determine eligibility or the outcome of the complaint."

  return {
    id:   "R7",
    name: "Physical damage",
    status:       "INFO",
    isHardGate:   false,
    explanation,
    legalRef:     null,
    supportingFacts: supporting,
    missingFacts:  [],
    uncertainFacts: [],
    conflictFacts:  [],
    requiresClarification: false,
    clarificationMessage:  null,
  }
}

// ── Run all rules ─────────────────────────────────────────────────────────────

export function runAllRules(inputs: EligibilityInputs): EligibilityRuleResult[] {
  return [
    runRule_R1(inputs),
    runRule_R2(inputs),
    runRule_R3(inputs),
    runRule_R4(inputs),
    runRule_R5(inputs),
    runRule_R6(inputs),
    runRule_R7(inputs),
  ]
}

// ── Overall status ────────────────────────────────────────────────────────────
// Summarises the set of results for the confirmation UI.

export type OverallEligibilityStatus =
  | "ALL_PASS"           // all hard-gate rules passed; advisory/info rules may vary
  | "HAS_FAIL"           // at least one hard-gate rule returned FAIL
  | "HAS_INDETERMINATE"  // at least one hard-gate rule is INDETERMINATE (no FAIL)
  | "INFORMATIONAL_ONLY" // no hard-gate rules evaluated (shouldn't happen in practice)

export function computeOverallStatus(results: EligibilityRuleResult[]): OverallEligibilityStatus {
  const gateResults = results.filter(r => r.isHardGate)

  if (gateResults.length === 0) return "INFORMATIONAL_ONLY"

  if (gateResults.some(r => r.status === "FAIL")) return "HAS_FAIL"

  if (gateResults.some(r => r.status === "INDETERMINATE")) return "HAS_INDETERMINATE"

  if (gateResults.every(r => r.status === "PASS")) return "ALL_PASS"

  return "HAS_INDETERMINATE"
}
