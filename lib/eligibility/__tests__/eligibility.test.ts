// lib/eligibility/__tests__/eligibility.test.ts
// Unit tests for Module 4 Eligibility rule engine and date utilities.
// These tests exercise pure functions only — no React, no Next.js, no network.
//
// Required test coverage (from implementation spec):
//  T01 — Recent purchase → R1 must not be falsely marked FAIL
//  T02 — Purchase >2 years but defect date is recent → do not auto-fail on purchase date
//  T03 — No determinable cause-of-action date → R1 INDETERMINATE
//  T04 — Commercial purpose + possible livelihood → R2 INDETERMINATE
//  T05 — seller_contacted = NO → R3 reflects that fact
//  T06 — seller_response without seller_contacted → must not imply prior contact
//  T07 — Missing purchase price → R5 INDETERMINATE
//  T08 — Conflict in purchase price → R5 INDETERMINATE
//  T09 — Problem description present → R4 procedural fact only (no 'deficiency established')
//  T10 — Warranty and physical damage remain INFO

import { describe, it, expect } from "vitest"
import type { Fact } from "@/lib/interview/facts"
import {
  parseRawDate,
  parseFactDate,
  parseRelativeTiming,
  daysBetween,
  addDays,
} from "../date-utils"
import {
  runRule_R1,
  runRule_R2,
  runRule_R3,
  runRule_R4,
  runRule_R5,
  runRule_R6,
  runRule_R7,
  computeOverallStatus,
} from "../rules"
import type { EligibilityInputs } from "../facts-bridge"

// ── Fact builders ─────────────────────────────────────────────────────────────

function knownFact(key: string, value: string): Fact {
  return { key, status: "KNOWN", value, source: "USER_ANSWER" }
}

function missingFact(key: string): Fact {
  return { key, status: "MISSING", value: null, source: null }
}

function uncertainFact(key: string, value: string): Fact {
  return { key, status: "UNCERTAIN", value, source: "USER_ANSWER" }
}

function conflictFact(key: string, value: string, conflictValue: string): Fact {
  return {
    key,
    status:        "CONFLICT",
    value,
    source:        "MODULE2_FIELD",
    conflictValue,
    conflictSource: "USER_ANSWER",
  }
}

function naFact(key: string): Fact {
  return { key, status: "NOT_APPLICABLE", value: null, source: null }
}

// ── Base inputs factory ───────────────────────────────────────────────────────
// Returns a minimal valid EligibilityInputs with everything MISSING.
// Individual tests override what they need.

function baseInputs(today: Date = new Date("2026-09-20")): EligibilityInputs {
  return {
    purchaseDateFact:       missingFact("purchase_date"),
    problemTimingFact:      missingFact("problem_timing"),
    sellerContactDateFact:  missingFact("seller_contact_date"),
    sellerResponseFact:     missingFact("seller_response"),
    sellerContactedFact:    missingFact("seller_contacted"),
    purchasePurpose:        "PERSONAL_USE",
    isResale:               false,
    problemDescriptionFact: missingFact("problem_description"),
    defectDescriptionRaw:   "",
    purchasePriceFact:      missingFact("purchase_price"),
    transactionAmount:      0,
    warrantyStatusFact:     missingFact("warranty_status"),
    physicalDamageFact:     missingFact("physical_damage"),
    sector:                 "ELECTRONICS",
    language:               "ENGLISH",
    today,
  }
}

// ── date-utils tests ──────────────────────────────────────────────────────────

describe("parseRawDate", () => {
  it("parses ISO YYYY-MM-DD", () => {
    const d = parseRawDate("2025-03-15")
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2025)
    expect(d!.getMonth()).toBe(2) // 0-indexed March
    expect(d!.getDate()).toBe(15)
  })

  it("parses DD/MM/YYYY", () => {
    const d = parseRawDate("15/03/2025")
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2025)
  })

  it("parses DD-MM-YYYY", () => {
    const d = parseRawDate("15-03-2025")
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2025)
  })

  it("parses natural DD Month YYYY", () => {
    const d = parseRawDate("15 March 2025")
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2025)
    expect(d!.getMonth()).toBe(2)
  })

  it("parses natural Month DD, YYYY", () => {
    const d = parseRawDate("March 15, 2025")
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2025)
  })

  it("returns null for bare 'yes'", () => {
    expect(parseRawDate("yes")).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(parseRawDate("")).toBeNull()
  })

  it("returns null for gibberish", () => {
    expect(parseRawDate("nj")).toBeNull()
  })
})

describe("parseRelativeTiming", () => {
  const anchor = new Date("2025-01-01")

  it("resolves 'after 10 days' to anchor + 10 days", () => {
    const result = parseRelativeTiming("after 10 days", anchor)
    expect(result).not.toBeNull()
    expect(daysBetween(anchor, result!)).toBe(10)
  })

  it("resolves 'immediately' to anchor date", () => {
    const result = parseRelativeTiming("immediately", anchor)
    expect(result).not.toBeNull()
    expect(result!.toISOString().startsWith("2025-01-01")).toBe(true)
  })

  it("resolves '2 weeks later' to anchor + 14 days", () => {
    const result = parseRelativeTiming("2 weeks later", anchor)
    expect(result).not.toBeNull()
    expect(daysBetween(anchor, result!)).toBe(14)
  })

  it("returns null when anchor is null", () => {
    expect(parseRelativeTiming("after 10 days", null)).toBeNull()
  })

  it("returns null for ambiguous / unparseable input", () => {
    expect(parseRelativeTiming("sometime later", anchor)).toBeNull()
  })
})

describe("daysBetween", () => {
  it("returns positive when a is before b", () => {
    const a = new Date("2025-01-01")
    const b = new Date("2025-01-11")
    expect(daysBetween(a, b)).toBe(10)
  })

  it("returns negative when a is after b", () => {
    const a = new Date("2025-01-11")
    const b = new Date("2025-01-01")
    expect(daysBetween(a, b)).toBe(-10)
  })

  it("returns 0 for same day", () => {
    const a = new Date("2025-06-15")
    const b = new Date("2025-06-15")
    expect(daysBetween(a, b)).toBe(0)
  })
})

// ── R1 — Limitation Period ────────────────────────────────────────────────────

describe("R1 — Limitation Period", () => {

  // T01: Recent purchase (6 months ago) must NOT be FAIL
  it("T01: recent purchase (6 months ago) does not produce FAIL", () => {
    const today   = new Date("2026-09-20")
    const sixMoAgo = "2026-03-20"
    const inputs: EligibilityInputs = {
      ...baseInputs(today),
      purchaseDateFact: knownFact("purchase_date", sixMoAgo),
    }
    const result = runRule_R1(inputs)
    expect(result.status).not.toBe("FAIL")
    expect(result.status).toBe("INDETERMINATE") // cause-of-action not established
  })

  // T02: Purchase >2 years ago but defect date is recent → do not auto-fail on purchase date
  it("T02: purchase >2 years ago, recent seller-contact date → not automatically FAIL", () => {
    const today        = new Date("2026-09-20")
    const oldPurchase  = "2023-01-01"  // >2 years before today
    const recentContact = "2026-08-01" // ~50 days ago — within 2 years

    const inputs: EligibilityInputs = {
      ...baseInputs(today),
      purchaseDateFact:      knownFact("purchase_date", oldPurchase),
      sellerContactDateFact: knownFact("seller_contact_date", recentContact),
    }
    const result = runRule_R1(inputs)
    // Must not be FAIL — a recent date candidate exists
    expect(result.status).not.toBe("FAIL")
    // Should be INDETERMINATE (cause-of-action not established)
    expect(result.status).toBe("INDETERMINATE")
    // Explanation must mention the recent date
    expect(result.explanation).toContain("Seller contacted")
  })

  // T03: No parseable date at all → INDETERMINATE (not FAIL, not PASS)
  it("T03: no parseable date information → INDETERMINATE", () => {
    const inputs = baseInputs()
    const result = runRule_R1(inputs)
    expect(result.status).toBe("INDETERMINATE")
    expect(result.missingFacts).toContain("purchase_date")
    expect(result.clarificationMessage).not.toBeNull()
  })

  it("CONFLICT in purchase_date → INDETERMINATE", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      purchaseDateFact: conflictFact("purchase_date", "2025-01-01", "2024-06-01"),
    }
    const result = runRule_R1(inputs)
    expect(result.status).toBe("INDETERMINATE")
    expect(result.conflictFacts).toContain("purchase_date")
  })

  it("all dates are parseable and within 2 years → INDETERMINATE (not PASS — CoA not established)", () => {
    const today      = new Date("2026-09-20")
    const recentDate = "2026-01-15"
    const inputs: EligibilityInputs = {
      ...baseInputs(today),
      purchaseDateFact: knownFact("purchase_date", recentDate),
    }
    const result = runRule_R1(inputs)
    // Must remain INDETERMINATE — we never auto-assign a CoA date
    expect(result.status).toBe("INDETERMINATE")
    expect(result.requiresClarification).toBe(true)
  })
})

// ── R2 — Consumer Status ──────────────────────────────────────────────────────

describe("R2 — Consumer Status", () => {

  it("PERSONAL_USE + not resale → PASS", () => {
    const result = runRule_R2({ ...baseInputs(), purchasePurpose: "PERSONAL_USE", isResale: false })
    expect(result.status).toBe("PASS")
  })

  it("is_resale = true → FAIL regardless of purpose", () => {
    const result = runRule_R2({ ...baseInputs(), purchasePurpose: "PERSONAL_USE", isResale: true })
    expect(result.status).toBe("FAIL")
    expect(result.isHardGate).toBe(true)
  })

  // T04: Commercial purpose + not resale → INDETERMINATE (possible livelihood use)
  it("T04: COMMERCIAL purpose + not resale → INDETERMINATE (possible self-employment)", () => {
    const result = runRule_R2({ ...baseInputs(), purchasePurpose: "COMMERCIAL", isResale: false })
    expect(result.status).toBe("INDETERMINATE")
    expect(result.requiresClarification).toBe(true)
    // Explanation must mention self-employment / livelihood, not a final determination
    expect(result.explanation.toLowerCase()).toMatch(/self.?employ|livelihood/)
  })

  it("empty purchase_purpose → INDETERMINATE", () => {
    const result = runRule_R2({ ...baseInputs(), purchasePurpose: "" })
    expect(result.status).toBe("INDETERMINATE")
  })
})

// ── R3 — Prior Contact ────────────────────────────────────────────────────────

describe("R3 — Prior Contact", () => {

  // T05: seller_contacted = NO → R3 reflects FAIL (advisory, not hard gate)
  it("T05: seller_contacted = NO → advisory FAIL, not hard gate", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      sellerContactedFact: knownFact("seller_contacted", "No"),
    }
    const result = runRule_R3(inputs)
    expect(result.status).toBe("FAIL")
    expect(result.isHardGate).toBe(false)     // advisory
    expect(result.requiresClarification).toBe(true)
  })

  it("seller_contacted = YES → PASS (advisory)", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      sellerContactedFact: knownFact("seller_contacted", "Yes"),
    }
    const result = runRule_R3(inputs)
    expect(result.status).toBe("PASS")
    expect(result.isHardGate).toBe(false)
  })

  // T06: seller_response present but seller_contacted MISSING → must not imply contact
  it("T06: seller_response present but seller_contacted MISSING → INDETERMINATE (not PASS)", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      sellerContactedFact: missingFact("seller_contacted"),
      sellerResponseFact:  knownFact("seller_response", "They refused to replace"),
    }
    const result = runRule_R3(inputs)
    // seller_response alone must not flip this to PASS
    expect(result.status).toBe("INDETERMINATE")
    expect(result.missingFacts).toContain("seller_contacted")
  })

  it("seller_contacted UNCERTAIN → INDETERMINATE", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      sellerContactedFact: uncertainFact("seller_contacted", "maybe"),
    }
    const result = runRule_R3(inputs)
    expect(result.status).toBe("INDETERMINATE")
    expect(result.uncertainFacts).toContain("seller_contacted")
  })
})

// ── R4 — Problem Described ────────────────────────────────────────────────────

describe("R4 — Problem Described", () => {

  // T09: Problem description present → procedural fact only, not 'deficiency established'
  it("T09: known description → PASS with procedural wording only", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      problemDescriptionFact: knownFact(
        "problem_description",
        "Screen stopped working completely within 10 days of purchase"
      ),
    }
    const result = runRule_R4(inputs)
    expect(result.status).toBe("PASS")
    // Must use procedural wording — NOT 'deficiency established'
    expect(result.explanation.toLowerCase()).not.toContain("deficiency established")
    expect(result.explanation.toLowerCase()).not.toContain("legal deficiency")
    // Should say 'described'
    expect(result.explanation.toLowerCase()).toContain("described")
  })

  it("description from CaseData fallback → PASS", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      problemDescriptionFact: missingFact("problem_description"),
      defectDescriptionRaw:   "Screen cracked after normal use",
    }
    const result = runRule_R4(inputs)
    expect(result.status).toBe("PASS")
    expect(result.explanation.toLowerCase()).not.toContain("deficiency established")
  })

  it("no description anywhere → INDETERMINATE", () => {
    const result = runRule_R4(baseInputs())
    expect(result.status).toBe("INDETERMINATE")
    expect(result.missingFacts).toContain("problem_description")
  })

  it("CONFLICT in description → INDETERMINATE", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      problemDescriptionFact: conflictFact(
        "problem_description", "screen broken", "battery dead"
      ),
    }
    const result = runRule_R4(inputs)
    expect(result.status).toBe("INDETERMINATE")
    expect(result.conflictFacts).toContain("problem_description")
  })
})

// ── R5 — Claim Amount ─────────────────────────────────────────────────────────

describe("R5 — Claim Amount Determinable", () => {

  it("KNOWN valid price → PASS with amount, no forum thresholds", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      purchasePriceFact: knownFact("purchase_price", "₹45000"),
    }
    const result = runRule_R5(inputs)
    expect(result.status).toBe("PASS")
    expect(result.explanation).toContain("₹45000")
    // Must NOT mention commission tiers (those belong to Module 5)
    expect(result.explanation).not.toMatch(/DCDRC|SCDRC|NCDRC|lakh|crore|Section 34|Section 47|Section 58/)
  })

  it("fallback transactionAmount > 0 → PASS", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      purchasePriceFact: missingFact("purchase_price"),
      transactionAmount: 12000,
    }
    const result = runRule_R5(inputs)
    expect(result.status).toBe("PASS")
    expect(result.explanation).toContain("12,000")
  })

  // T07: Missing purchase price → INDETERMINATE
  it("T07: missing purchase price + no transaction amount → INDETERMINATE", () => {
    const result = runRule_R5(baseInputs())
    expect(result.status).toBe("INDETERMINATE")
    expect(result.missingFacts).toContain("purchase_price")
  })

  // T08: Conflict in purchase price → INDETERMINATE
  it("T08: CONFLICT in purchase price → INDETERMINATE", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      purchasePriceFact: conflictFact("purchase_price", "₹45000", "₹38000"),
    }
    const result = runRule_R5(inputs)
    expect(result.status).toBe("INDETERMINATE")
    expect(result.conflictFacts).toContain("purchase_price")
  })

  it("UNCERTAIN purchase price → INDETERMINATE", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      purchasePriceFact: uncertainFact("purchase_price", "around 40k"),
    }
    const result = runRule_R5(inputs)
    expect(result.status).toBe("INDETERMINATE")
    expect(result.uncertainFacts).toContain("purchase_price")
  })
})

// ── R6 — Warranty Status ──────────────────────────────────────────────────────

describe("R6 — Warranty Status", () => {

  // T10 (part 1): Warranty always returns INFO
  it("T10a: 'Under warranty' → INFO only", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      warrantyStatusFact: knownFact("warranty_status", "Under warranty"),
    }
    const result = runRule_R6(inputs)
    expect(result.status).toBe("INFO")
    expect(result.isHardGate).toBe(false)
    expect(result.explanation).toContain("Under warranty")
    // Must not imply eligibility outcome
    expect(result.explanation.toLowerCase()).not.toMatch(/guarantee|will win|strong|weak/)
  })

  it("T10a: 'Warranty expired' → INFO only", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      warrantyStatusFact: knownFact("warranty_status", "Warranty expired"),
    }
    const result = runRule_R6(inputs)
    expect(result.status).toBe("INFO")
    expect(result.isHardGate).toBe(false)
  })

  it("missing warranty status → INFO (not INDETERMINATE)", () => {
    const result = runRule_R6(baseInputs())
    expect(result.status).toBe("INFO")
  })

  it("NOT_APPLICABLE warranty status → INFO", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      warrantyStatusFact: naFact("warranty_status"),
    }
    const result = runRule_R6(inputs)
    expect(result.status).toBe("INFO")
  })
})

// ── R7 — Physical Damage ──────────────────────────────────────────────────────

describe("R7 — Physical Damage", () => {

  // T10 (part 2): Physical damage always returns INFO
  it("T10b: physical_damage = Yes → INFO only", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      physicalDamageFact: knownFact("physical_damage", "Yes"),
    }
    const result = runRule_R7(inputs)
    expect(result.status).toBe("INFO")
    expect(result.isHardGate).toBe(false)
    // Must not conclude misuse or defeat the complaint
    expect(result.explanation.toLowerCase()).not.toMatch(/defeat|disqualif|ineligible|misuse/)
  })

  it("T10b: physical_damage = No → INFO only", () => {
    const inputs: EligibilityInputs = {
      ...baseInputs(),
      physicalDamageFact: knownFact("physical_damage", "No"),
    }
    const result = runRule_R7(inputs)
    expect(result.status).toBe("INFO")
    expect(result.isHardGate).toBe(false)
  })

  it("missing physical damage → INFO (not INDETERMINATE)", () => {
    const result = runRule_R7(baseInputs())
    expect(result.status).toBe("INFO")
  })
})

// ── computeOverallStatus ──────────────────────────────────────────────────────

describe("computeOverallStatus", () => {

  it("all hard-gate PASS → ALL_PASS", () => {
    const results = [
      { status: "PASS",  isHardGate: true  },
      { status: "PASS",  isHardGate: true  },
      { status: "INFO",  isHardGate: false },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(computeOverallStatus(results as any)).toBe("ALL_PASS")
  })

  it("any hard-gate FAIL → HAS_FAIL", () => {
    const results = [
      { status: "PASS",          isHardGate: true },
      { status: "FAIL",          isHardGate: true },
      { status: "INDETERMINATE", isHardGate: true },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(computeOverallStatus(results as any)).toBe("HAS_FAIL")
  })

  it("INDETERMINATE but no FAIL → HAS_INDETERMINATE", () => {
    const results = [
      { status: "PASS",          isHardGate: true },
      { status: "INDETERMINATE", isHardGate: true },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(computeOverallStatus(results as any)).toBe("HAS_INDETERMINATE")
  })

  it("only INFO results → INFORMATIONAL_ONLY", () => {
    const results = [
      { status: "INFO", isHardGate: false },
      { status: "INFO", isHardGate: false },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(computeOverallStatus(results as any)).toBe("INFORMATIONAL_ONLY")
  })
})

// ── Wording safety checks ─────────────────────────────────────────────────────
// Ensure no rule emits forbidden language.

describe("Safe wording — no forbidden phrases in any rule output", () => {
  const FORBIDDEN = [
    "guaranteed eligible",
    "guaranteed ineligible",
    "you will win",
    "you will lose",
    "case is strong",
    "case is weak",
    "deficiency established",
    "legal deficiency established",
  ]

  function checkWording(explanation: string, clarification: string | null) {
    const combined = (explanation + " " + (clarification ?? "")).toLowerCase()
    for (const phrase of FORBIDDEN) {
      expect(combined).not.toContain(phrase.toLowerCase())
    }
  }

  it("R1 all-missing inputs has no forbidden phrases", () => {
    const r = runRule_R1(baseInputs())
    checkWording(r.explanation, r.clarificationMessage)
  })

  it("R2 COMMERCIAL has no forbidden phrases", () => {
    const r = runRule_R2({ ...baseInputs(), purchasePurpose: "COMMERCIAL" })
    checkWording(r.explanation, r.clarificationMessage)
  })

  it("R3 NO has no forbidden phrases", () => {
    const r = runRule_R3({ ...baseInputs(), sellerContactedFact: knownFact("seller_contacted", "No") })
    checkWording(r.explanation, r.clarificationMessage)
  })

  it("R4 PASS has no forbidden phrases", () => {
    const r = runRule_R4({ ...baseInputs(), problemDescriptionFact: knownFact("problem_description", "Screen broke") })
    checkWording(r.explanation, r.clarificationMessage)
  })

  it("R6 KNOWN has no forbidden phrases", () => {
    const r = runRule_R6({ ...baseInputs(), warrantyStatusFact: knownFact("warranty_status", "Under warranty") })
    checkWording(r.explanation, r.clarificationMessage)
  })

  it("R7 YES has no forbidden phrases", () => {
    const r = runRule_R7({ ...baseInputs(), physicalDamageFact: knownFact("physical_damage", "Yes") })
    checkWording(r.explanation, r.clarificationMessage)
  })
})
