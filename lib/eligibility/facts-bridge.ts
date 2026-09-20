// lib/eligibility/facts-bridge.ts
// Extracts a typed, flat EligibilityInputs object from CaseData + InterviewFactState.
// No React. No side effects. No network calls.
//
// Purpose: insulate the rule engine and the UI component from raw context shapes.
// The bridge preserves every Fact's status/value/source/conflict fields.
// It never flattens away MISSING, UNCERTAIN, or CONFLICT.

import type { CaseData } from "@/lib/case-context"
import {
  emptyFactState,
  type Fact,
  type InterviewFactState,
} from "@/lib/interview/facts"

// ── EligibilityInputs ─────────────────────────────────────────────────────────
// The single typed contract between the bridge and the rule engine.

export interface EligibilityInputs {
  // ── Date-related (R1 — Limitation) ─────────────────────────────────────────
  /** Purchase date as a full Fact — may be KNOWN, MISSING, UNCERTAIN, or CONFLICT. */
  purchaseDateFact:      Fact
  /** Relative timing expression from Module 3 (e.g. "after 10 days"). May be NOT_APPLICABLE. */
  problemTimingFact:     Fact
  /** Date on which seller was contacted — gated on sellerContactedFact = YES. */
  sellerContactDateFact: Fact
  /** Seller's response / refusal — informational for R1, not proof of contact. */
  sellerResponseFact:    Fact
  /** Whether the seller was contacted at all — used for R3. */
  sellerContactedFact:   Fact

  // ── Consumer status (R2) ───────────────────────────────────────────────────
  /** "PERSONAL_USE" | "COMMERCIAL" | "" — from CaseData (Module 2). */
  purchasePurpose: string
  /** Whether the goods were purchased for resale — from CaseData (Module 2). */
  isResale: boolean

  // ── Deficiency description (R4) ────────────────────────────────────────────
  /** Problem/defect description from Module 3 interview. */
  problemDescriptionFact: Fact
  /** Fallback: raw defect text from Module 2 intake (CaseData.defect_description). */
  defectDescriptionRaw:   string

  // ── Claim amount (R5) ──────────────────────────────────────────────────────
  /** Purchase price as a full Fact from Module 3. */
  purchasePriceFact:   Fact
  /** Fallback: numeric amount from CaseData (Module 2 intake). 0 if unknown. */
  transactionAmount:   number

  // ── Informational facts (R6, R7) ───────────────────────────────────────────
  /** Warranty status — INFO only. */
  warrantyStatusFact:  Fact
  /** Physical damage — INFO only. */
  physicalDamageFact:  Fact

  // ── Contextual ─────────────────────────────────────────────────────────────
  /** Sector from NLP classification (e.g. "ELECTRONICS", "BANKING"). */
  sector:   string
  /** User's preferred interface language. */
  language: string
  /** Injected current date — never call Date.now() inside rules. */
  today:    Date
}

// ── Internal helper ───────────────────────────────────────────────────────────
// Returns a named MISSING sentinel fact.  Used when a key does not exist in the
// retrieved InterviewFactState (e.g. the state came from an older session that
// pre-dates a new fact key being added).

function missingFact(key: string): Fact {
  return {
    key,
    status: "MISSING",
    value:  null,
    source: null,
  }
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build EligibilityInputs from the React context objects.
 *
 * @param caseData  The current CaseData from useCaseContext().
 * @param today     The reference date for limit calculations — inject so rules
 *                  stay pure/testable.  Pass `new Date()` in production.
 */
export function buildEligibilityInputs(
  caseData: CaseData,
  today: Date
): EligibilityInputs {
  // ── Retrieve the full InterviewFactState saved by Module 3 ────────────────
  // It is stored under case_specific_data.interview_fact_state.
  // Fall back to an empty state if Module 3 was never completed.
  const rawFactState = caseData.case_specific_data?.interview_fact_state
  const factState: InterviewFactState =
    rawFactState && typeof rawFactState === "object"
      ? (rawFactState as InterviewFactState)
      : emptyFactState()

  // Helper: get a Fact by key, falling back to a MISSING sentinel if absent.
  const get = (key: string): Fact =>
    (factState as Record<string, Fact>)[key] ?? missingFact(key)

  // ── Synthesise a purchase_date Fact when only CaseData has it ────────────
  // Module 2 may have set caseData.purchase_date even if the interview Fact
  // is MISSING (e.g. user skipped Module 3).
  let purchaseDateFact = get("purchase_date")
  if (
    purchaseDateFact.status === "MISSING" &&
    caseData.purchase_date?.trim()
  ) {
    purchaseDateFact = {
      key:    "purchase_date",
      status: "KNOWN",
      value:  caseData.purchase_date.trim(),
      source: "MODULE2_FIELD",
    }
  }

  // ── Synthesise a problem_description Fact when only CaseData has it ──────
  let problemDescriptionFact = get("problem_description")
  if (
    problemDescriptionFact.status === "MISSING" &&
    caseData.defect_description?.trim()
  ) {
    problemDescriptionFact = {
      key:    "problem_description",
      status: "KNOWN",
      value:  caseData.defect_description.trim(),
      source: "MODULE2_FIELD",
    }
  }

  // ── Synthesise a purchase_price Fact when only CaseData has it ───────────
  let purchasePriceFact = get("purchase_price")
  if (
    purchasePriceFact.status === "MISSING" &&
    caseData.transaction_amount > 0
  ) {
    purchasePriceFact = {
      key:    "purchase_price",
      status: "KNOWN",
      value:  `₹${caseData.transaction_amount}`,
      source: "MODULE2_FIELD",
    }
  }

  return {
    // Date-related
    purchaseDateFact,
    problemTimingFact:     get("problem_timing"),
    sellerContactDateFact: get("seller_contact_date"),
    sellerResponseFact:    get("seller_response"),
    sellerContactedFact:   get("seller_contacted"),

    // Consumer status
    purchasePurpose: caseData.purchase_purpose ?? "",
    isResale:        caseData.is_resale ?? false,

    // Deficiency
    problemDescriptionFact,
    defectDescriptionRaw: caseData.defect_description?.trim() ?? "",

    // Claim amount
    purchasePriceFact,
    transactionAmount: caseData.transaction_amount ?? 0,

    // Informational
    warrantyStatusFact: get("warranty_status"),
    physicalDamageFact: get("physical_damage"),

    // Contextual
    sector:   caseData.sector   ?? "",
    language: (caseData.input_language as string) ?? "ENGLISH",
    today,
  }
}
