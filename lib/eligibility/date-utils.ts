// lib/eligibility/date-utils.ts
// Pure date parsing and arithmetic helpers for Module 4 Eligibility.
// All functions are side-effect-free and testable without any framework.
//
// IMPORTANT: None of these functions make legal determinations.
// They provide arithmetic only. Whether a given date is the legally
// correct cause-of-action date is a legal question, not computed here.

import type { Fact } from "@/lib/interview/facts"

// ── ISO date string ───────────────────────────────────────────────────────────

const ISO_RE  = /^(\d{4})-(\d{2})-(\d{2})$/
// DD/MM/YYYY or DD-MM-YYYY
const DMY_RE  = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
// Natural: "10 January 2024", "January 10, 2024", "10 Jan 2024"
const MONTH_NAMES: Record<string, number> = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
  jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8,
  sep:9, oct:10, nov:11, dec:12,
}

const NATURAL_DMY_RE = new RegExp(
  `(\\d{1,2})\\s+(${Object.keys(MONTH_NAMES).join("|")})\\s+(\\d{4})`,
  "i"
)
const NATURAL_MDY_RE = new RegExp(
  `(${Object.keys(MONTH_NAMES).join("|")})\\s+(\\d{1,2}),?\\s+(\\d{4})`,
  "i"
)

/**
 * Attempt to parse a raw string into a Date.
 * Returns null when the string does not resemble a recognisable date.
 * Never throws.
 */
export function parseRawDate(raw: string): Date | null {
  if (!raw || !raw.trim()) return null
  const s = raw.trim()

  // YYYY-MM-DD
  const iso = s.match(ISO_RE)
  if (iso) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(DMY_RE)
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`)
    return isNaN(d.getTime()) ? null : d
  }

  // "10 January 2024"
  const ndmy = s.match(NATURAL_DMY_RE)
  if (ndmy) {
    const mon = MONTH_NAMES[ndmy[2].toLowerCase()]
    if (mon) {
      const d = new Date(`${ndmy[3]}-${String(mon).padStart(2,"0")}-${ndmy[1].padStart(2,"0")}`)
      return isNaN(d.getTime()) ? null : d
    }
  }

  // "January 10, 2024"
  const nmdy = s.match(NATURAL_MDY_RE)
  if (nmdy) {
    const mon = MONTH_NAMES[nmdy[1].toLowerCase()]
    if (mon) {
      const d = new Date(`${nmdy[3]}-${String(mon).padStart(2,"0")}-${nmdy[2].padStart(2,"0")}`)
      return isNaN(d.getTime()) ? null : d
    }
  }

  // Try native parser as a last resort — only accept well-formed results
  const fallback = new Date(s)
  if (!isNaN(fallback.getTime()) && /\d{4}/.test(s)) return fallback

  return null
}

/**
 * Parse the value inside a Fact object.
 * Returns null when the Fact is not KNOWN, has no value, or the value is
 * not a recognisable date string.
 */
export function parseFactDate(fact: Fact): Date | null {
  if (fact.status !== "KNOWN") return null
  if (!fact.value) return null
  return parseRawDate(fact.value)
}

/**
 * Attempt to derive an absolute Date from a relative problem-timing
 * expression ("after 10 days", "2 weeks later", "immediately", etc.)
 * anchored against a known purchase date.
 *
 * Returns null when:
 * - the anchor is null
 * - the timing string is not parseable as a recognised relative expression
 *
 * IMPORTANT: The returned date is an arithmetic approximation only.
 * It does NOT constitute a legal determination of the cause-of-action date.
 */
export function parseRelativeTiming(timingValue: string | null, anchorDate: Date | null): Date | null {
  if (!timingValue || !anchorDate) return null
  const t = timingValue.toLowerCase().trim()

  // "immediately" / "right away" / "same day" / "from the beginning" / "from day one"
  if (/\b(immediately|right\s+away|same\s+day|from\s+(?:the\s+)?(?:beginning|start|day\s+one|day\s+1))\b/.test(t)) {
    return new Date(anchorDate)
  }

  // "after N days/weeks/months" or "N days/weeks/months after purchase"
  const m1 = t.match(/(\d+)\s*(days?|weeks?|months?)/)
  if (m1) {
    const n  = parseInt(m1[1], 10)
    const unit = m1[2]
    const result = new Date(anchorDate)
    if (/days?/.test(unit))   result.setDate(result.getDate() + n)
    if (/weeks?/.test(unit))  result.setDate(result.getDate() + n * 7)
    if (/months?/.test(unit)) result.setMonth(result.getMonth() + n)
    return result
  }

  // "within N days/weeks/months"
  const m2 = t.match(/within\s+(\d+)\s*(days?|weeks?|months?)/)
  if (m2) {
    const n    = parseInt(m2[1], 10)
    const unit = m2[2]
    const result = new Date(anchorDate)
    if (/days?/.test(unit))   result.setDate(result.getDate() + n)
    if (/weeks?/.test(unit))  result.setDate(result.getDate() + n * 7)
    if (/months?/.test(unit)) result.setMonth(result.getMonth() + n)
    return result
  }

  // "within a day/week/month"
  const m3 = t.match(/within\s+a\s+(day|week|month)/)
  if (m3) {
    const result = new Date(anchorDate)
    if (m3[1] === "day")   result.setDate(result.getDate() + 1)
    if (m3[1] === "week")  result.setDate(result.getDate() + 7)
    if (m3[1] === "month") result.setMonth(result.getMonth() + 1)
    return result
  }

  return null
}

/**
 * Whole-day difference: positive when a is before b.
 */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

/**
 * Format a Date as "DD Month YYYY" for Indian-locale display.
 */
export function formatDateIN(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

/**
 * Add a number of days to a Date (non-mutating).
 */
export function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

/**
 * Returns true when the date string inside a Fact looks like a valid,
 * parseable calendar date. Does NOT check whether it is within any limit.
 */
export function isFactDateParseable(fact: Fact): boolean {
  return parseFactDate(fact) !== null
}
