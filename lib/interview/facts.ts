// lib/interview/facts.ts
// Structured fact state for Module 3.
// Every fact has explicit status: KNOWN | MISSING | UNCERTAIN | NOT_APPLICABLE | CONFLICT
// CONFLICT: two or more pieces of information contradict each other — must be resolved by user.
// Facts are never silently overwritten; sources are always preserved.

// ── Types ────────────────────────────────────────────────────────────────────

export type FactStatus =
  | "KNOWN"           // confirmed, structurally valid value
  | "MISSING"         // not yet answered
  | "UNCERTAIN"       // answer was ambiguous or failed structural validation
  | "NOT_APPLICABLE"  // irrelevant for this device / case path
  | "CONFLICT"        // two sources give contradictory values; needs user clarification

export type FactSource =
  | "MODULE2_TEXT"           // extracted from Module 2 free text
  | "MODULE2_FIELD"          // populated from a structured Module 2 field
  | "MODULE2_CLASSIFICATION" // set by the NLP classification step
  | "USER_ANSWER"            // provided by the user during Module 3 interview
  | "USER_CORRECTION"        // user explicitly corrected an earlier fact

export interface Fact {
  key:           string
  status:        FactStatus
  value:         string | null   // current best value; user's original words; never invented
  source:        FactSource | null
  originalValue?: string | null  // preserved when user corrects or conflicts with an earlier value
  conflictValue?: string | null  // the new value that conflicts with the existing one
  conflictSource?: FactSource | null
  confidence?:   "HIGH" | "MEDIUM" | "LOW" // optional for uncertain facts
}

// ── Fact key taxonomy ────────────────────────────────────────────────────────
// Grouped logically. Evidence is broken into sub-facts so each can be
// tracked independently rather than stored as one opaque string.

export type FactKey =
  // Product
  | "device_type"
  | "brand"
  | "model"
  | "serial_imei"           // optional; only asked when relevant
  // Purchase
  | "purchase_date"
  | "purchase_price"
  | "seller"
  | "purchase_platform"
  | "order_id"              // optional
  // Defect
  | "problem_description"
  | "problem_timing"        // when did it start (relative, e.g. "10 days after purchase")
  | "problem_still_occurring"
  // Cause / context
  | "physical_damage"       // drop / liquid / external damage — YES/NO/UNKNOWN
  // Warranty
  | "warranty_status"
  // Repair / service
  | "repair_attempted"
  | "repair_details"        // gated on repair_attempted = YES
  // Seller / manufacturer contact
  | "seller_contacted"
  | "seller_contact_date"   // optional, gated on seller_contacted = YES
  | "seller_response"
  | "complaint_ref_number"  // ticket / reference number — optional
  // Remedy sought
  | "replacement_requested"
  | "refund_requested"
  | "relief_sought"
  // Evidence — each tracked separately
  | "evidence_invoice"
  | "evidence_order_confirmation"
  | "evidence_warranty_card"
  | "evidence_photos"
  | "evidence_videos"
  | "evidence_chat_records"
  | "evidence_emails"
  | "evidence_service_job_sheet"
  | "evidence_repair_receipt"
  | "evidence_other"

export type InterviewFactState = Record<FactKey, Fact>

// ── Empty state ───────────────────────────────────────────────────────────────

export const ALL_FACT_KEYS: FactKey[] = [
  "device_type", "brand", "model", "serial_imei",
  "purchase_date", "purchase_price", "seller", "purchase_platform", "order_id",
  "problem_description", "problem_timing", "problem_still_occurring",
  "physical_damage",
  "warranty_status",
  "repair_attempted", "repair_details",
  "seller_contacted", "seller_contact_date", "seller_response", "complaint_ref_number",
  "replacement_requested", "refund_requested", "relief_sought",
  "evidence_invoice", "evidence_order_confirmation", "evidence_warranty_card",
  "evidence_photos", "evidence_videos", "evidence_chat_records",
  "evidence_emails", "evidence_service_job_sheet", "evidence_repair_receipt",
  "evidence_other",
]

export function emptyFactState(): InterviewFactState {
  return Object.fromEntries(
    ALL_FACT_KEYS.map(k => [
      k,
      { key: k, status: "MISSING" as FactStatus, value: null, source: null },
    ])
  ) as InterviewFactState
}

// ── Device-specific required facts ───────────────────────────────────────────
// Facts not in the required list for a given device are marked NOT_APPLICABLE.
// Evidence facts that are always optional are handled separately via PRIORITY_ORDER.

const PRODUCT_BASE: FactKey[] = ["device_type", "brand", "purchase_date", "seller", "purchase_price"]
const WITH_MODEL:   FactKey[] = [...PRODUCT_BASE, "model"]
const WITH_PLATFORM: FactKey[] = [...WITH_MODEL, "purchase_platform"]

const DEFECT_BASE: FactKey[] = ["problem_description", "problem_timing", "problem_still_occurring", "physical_damage"]
const WARRANTY_AND_REPAIR: FactKey[] = ["warranty_status", "repair_attempted", "repair_details"]

const CONTACT_BASE: FactKey[] = ["seller_contacted", "seller_response"]
const WITH_CONTACT_DETAIL: FactKey[] = [...CONTACT_BASE, "seller_contact_date", "complaint_ref_number"]

const REMEDY_BASE:  FactKey[] = ["relief_sought"]
const WITH_REPLACE: FactKey[] = [...REMEDY_BASE, "replacement_requested", "refund_requested"]

// Evidence: only the most common are required; exotic ones stay MISSING/optional.
const EVIDENCE_REQUIRED: FactKey[] = [
  "evidence_invoice", "evidence_photos", "evidence_chat_records", "evidence_emails",
]

const MOBILE_LAPTOP_REQUIRED: FactKey[] = [
  ...WITH_PLATFORM, ...DEFECT_BASE, ...WARRANTY_AND_REPAIR,
  ...WITH_CONTACT_DETAIL, ...WITH_REPLACE, ...EVIDENCE_REQUIRED,
]
const TV_TABLET_CAMERA_REQUIRED: FactKey[] = [
  ...WITH_PLATFORM, ...DEFECT_BASE, ...WARRANTY_AND_REPAIR,
  ...WITH_CONTACT_DETAIL, ...WITH_REPLACE, ...EVIDENCE_REQUIRED,
]
const APPLIANCE_REQUIRED: FactKey[] = [
  ...WITH_MODEL, ...DEFECT_BASE, ...WARRANTY_AND_REPAIR,
  ...CONTACT_BASE, ...REMEDY_BASE, ...EVIDENCE_REQUIRED,
]
const CHARGER_REQUIRED: FactKey[] = [
  ...WITH_PLATFORM, ...DEFECT_BASE,
  ...CONTACT_BASE, "refund_requested", ...EVIDENCE_REQUIRED,
]
const AUDIO_SMART_REQUIRED: FactKey[] = [
  ...WITH_PLATFORM, ...DEFECT_BASE, ...WARRANTY_AND_REPAIR,
  ...WITH_CONTACT_DETAIL, ...WITH_REPLACE, ...EVIDENCE_REQUIRED,
]

export const DEVICE_REQUIRED_FACTS: Record<string, FactKey[]> = {
  MOBILE_PHONE:       MOBILE_LAPTOP_REQUIRED,
  LAPTOP:             MOBILE_LAPTOP_REQUIRED,
  TELEVISION:         TV_TABLET_CAMERA_REQUIRED,
  TABLET:             TV_TABLET_CAMERA_REQUIRED,
  CAMERA:             TV_TABLET_CAMERA_REQUIRED,
  REFRIGERATOR:       APPLIANCE_REQUIRED,
  WASHING_MACHINE:    APPLIANCE_REQUIRED,
  AIR_CONDITIONER:    APPLIANCE_REQUIRED,
  PRINTER:            APPLIANCE_REQUIRED,
  MICROWAVE:          APPLIANCE_REQUIRED,
  CHARGER_POWER_BANK: CHARGER_REQUIRED,
  SMART_DEVICE:       AUDIO_SMART_REQUIRED,
  AUDIO_DEVICE:       AUDIO_SMART_REQUIRED,
  OTHER_ELECTRONICS:  APPLIANCE_REQUIRED,
}

export function applyDeviceScope(
  state: InterviewFactState,
  deviceCategory: string
): InterviewFactState {
  const required = DEVICE_REQUIRED_FACTS[deviceCategory] ?? APPLIANCE_REQUIRED
  const next = { ...state }
  for (const key of ALL_FACT_KEYS) {
    if (!required.includes(key) && next[key].status === "MISSING") {
      next[key] = { ...next[key], status: "NOT_APPLICABLE" }
    }
  }
  return next
}

// ── Structural validation ─────────────────────────────────────────────────────
// Returns true when a raw string is a structurally acceptable value for its fact type.
// This is intentionally permissive — "10 days after purchase" is valid for problem_timing.
// Only clearly wrong types are rejected (e.g. "yes" for a date field).

const YES_NO_KEYS = new Set<FactKey>([
  "repair_attempted", "seller_contacted", "replacement_requested", "refund_requested",
  "problem_still_occurring", "physical_damage",
  "evidence_invoice", "evidence_order_confirmation", "evidence_warranty_card",
  "evidence_photos", "evidence_videos", "evidence_chat_records",
  "evidence_emails", "evidence_service_job_sheet", "evidence_repair_receipt",
  "evidence_other",
])

const DATE_LIKE_KEYS = new Set<FactKey>(["purchase_date"])
const PRICE_LIKE_KEYS = new Set<FactKey>(["purchase_price"])

// Patterns that are obviously NOT a date (single word, no digit, no month name)
const MONTH_NAMES = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december/i
const DATE_PATTERN = /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{1,2}\s+\w+\s+\d{4}/

export function isStructurallyValid(key: FactKey, value: string): boolean {
  if (!value || value.trim().length === 0) return false
  const v = value.trim().toLowerCase()

  if (DATE_LIKE_KEYS.has(key)) {
    // Must contain digits and look like a date or relative expression
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true          // ISO date
    if (DATE_PATTERN.test(v)) return true                     // natural date
    if (MONTH_NAMES.test(v)) return true                      // month name present
    if (/\d/.test(v) && v.length >= 4) return true           // has digits, reasonable length
    // Reject bare words like "yes", "today", "nj"
    if (/^(yes|no|nope|yeah|today|now|never|nj|nm|km|abc)$/.test(v)) return false
    return false
  }

  if (PRICE_LIKE_KEYS.has(key)) {
    // Must contain digits
    return /\d/.test(v)
  }

  if (YES_NO_KEYS.has(key)) {
    return isYes(value) || isNo(value)
  }

  // For all other keys: accept if there's at least 2 non-whitespace characters
  return v.replace(/\s/g, "").length >= 2
}

// ── Yes/No helpers ────────────────────────────────────────────────────────────

export function isNo(value: string | null): boolean {
  if (!value) return false
  const v = value.toLowerCase().trim()
  return (
    v === "no" || v === "nope" || v === "nah" ||
    v.startsWith("no,") || v.startsWith("no ") ||
    v === "இல்லை" || v === "नहीं"
  )
}

export function isYes(value: string | null): boolean {
  if (!value) return false
  const v = value.toLowerCase().trim()
  return (
    v === "yes" || v === "yeah" || v === "yep" || v === "yup" ||
    v.startsWith("yes,") || v.startsWith("yes ") ||
    v === "ஆம்" || v === "हाँ" || v === "हां"
  )
}

// ── Priority order ────────────────────────────────────────────────────────────
// Defines the preferred questioning sequence.
// Facts marked NOT_APPLICABLE or KNOWN are automatically skipped.
export const PRIORITY_ORDER: FactKey[] = [
  // Purchase basics
  "purchase_date", "purchase_price", "seller", "purchase_platform",
  "model", "order_id",
  // Defect
  "problem_timing", "problem_still_occurring", "physical_damage",
  // Warranty & repair
  "warranty_status",
  "repair_attempted", "repair_details",
  // Seller contact
  "seller_contacted", "seller_contact_date", "seller_response", "complaint_ref_number",
  // Remedy
  "replacement_requested", "refund_requested", "relief_sought",
  // Evidence
  "evidence_invoice", "evidence_order_confirmation", "evidence_warranty_card",
  "evidence_photos", "evidence_videos", "evidence_chat_records",
  "evidence_emails", "evidence_service_job_sheet", "evidence_repair_receipt",
  "evidence_other",
  // Optional extras (asked last, only if applicable)
  "serial_imei",
]

// ── Conditional skip rules ────────────────────────────────────────────────────
// A fact is skipped if its prerequisite resolves to an incompatible value.
// skipIfNo  = skip this fact when prereq is KNOWN + isNo
// skipIfYes = skip this fact when prereq is KNOWN + isYes

export type ConditionalRule = {
  prereq:      FactKey
  skipIfNo?:   boolean
  skipIfYes?:  boolean
}

export const CONDITIONAL_SKIP: Partial<Record<FactKey, ConditionalRule>> = {
  // Repair details only if repair was attempted
  repair_details:         { prereq: "repair_attempted",  skipIfNo: true  },
  // Seller contact details only if seller was contacted
  seller_contact_date:    { prereq: "seller_contacted",  skipIfNo: true  },
  seller_response:        { prereq: "seller_contacted",  skipIfNo: true  },
  complaint_ref_number:   { prereq: "seller_contacted",  skipIfNo: true  },
  replacement_requested:  { prereq: "seller_contacted",  skipIfNo: true  },
  refund_requested:       { prereq: "seller_contacted",  skipIfNo: true  },
  // Service job sheet only if repair was attempted
  evidence_service_job_sheet: { prereq: "repair_attempted", skipIfNo: true },
  evidence_repair_receipt:    { prereq: "repair_attempted", skipIfNo: true },
}

// ── Required / missing computation ───────────────────────────────────────────

export function getMissingFacts(state: InterviewFactState): FactKey[] {
  return PRIORITY_ORDER.filter(k => {
    const fact = state[k]
    if (!fact) return false
    if (fact.status === "NOT_APPLICABLE") return false
    if (fact.status === "KNOWN") return false
    // CONFLICT counts as unresolved — must appear in missing list
    // so the interview asks for clarification

    const cond = CONDITIONAL_SKIP[k]
    if (cond) {
      const prereq = state[cond.prereq]
      if (prereq?.status === "KNOWN") {
        if (cond.skipIfNo  && isNo(prereq.value))  return false
        if (cond.skipIfYes && isYes(prereq.value)) return false
      }
    }
    return true
  })
}

// ── Completion check ──────────────────────────────────────────────────────────
// Complete ONLY when:
// - no fact is still MISSING or UNCERTAIN (for required facts after conditional skips)
// - no fact is in CONFLICT status
// This replaces the old "count == 19" rule.

export function isInterviewComplete(state: InterviewFactState): boolean {
  const missing = getMissingFacts(state)
  if (missing.length > 0) return false
  // Also block if any applicable fact is in CONFLICT
  const hasConflict = ALL_FACT_KEYS.some(
    k => state[k]?.status === "CONFLICT"
  )
  return !hasConflict
}

// ── Counting helpers (for progress display) ───────────────────────────────────

export function countApplicableFacts(state: InterviewFactState): number {
  return ALL_FACT_KEYS.filter(k => state[k]?.status !== "NOT_APPLICABLE").length
}

export function countKnownFacts(state: InterviewFactState): number {
  return ALL_FACT_KEYS.filter(k => state[k]?.status === "KNOWN").length
}

// ── Human-readable labels ─────────────────────────────────────────────────────

export const FACT_LABELS: Record<FactKey, string> = {
  device_type:                  "Device type",
  brand:                        "Brand",
  model:                        "Model",
  serial_imei:                  "Serial / IMEI",
  purchase_date:                "Purchase date",
  purchase_price:               "Purchase price",
  seller:                       "Seller / company",
  purchase_platform:            "Purchase platform",
  order_id:                     "Order / invoice ID",
  problem_description:          "Problem description",
  problem_timing:               "When problem started",
  problem_still_occurring:      "Problem still occurring",
  physical_damage:              "Physical damage",
  warranty_status:              "Warranty status",
  repair_attempted:             "Repair attempted",
  repair_details:               "Repair details",
  seller_contacted:             "Seller contacted",
  seller_contact_date:          "Contact date",
  seller_response:              "Seller's response",
  complaint_ref_number:         "Complaint / ticket number",
  replacement_requested:        "Replacement requested",
  refund_requested:             "Refund requested",
  relief_sought:                "Relief sought",
  evidence_invoice:             "Invoice / receipt",
  evidence_order_confirmation:  "Order confirmation",
  evidence_warranty_card:       "Warranty card",
  evidence_photos:              "Photos",
  evidence_videos:              "Videos",
  evidence_chat_records:        "Chat records (WhatsApp / SMS)",
  evidence_emails:              "Emails",
  evidence_service_job_sheet:   "Service / job sheet",
  evidence_repair_receipt:      "Repair receipt",
  evidence_other:               "Other documents",
}

export const SOURCE_LABELS: Record<FactSource, string> = {
  MODULE2_TEXT:           "From your description",
  MODULE2_FIELD:          "From intake form",
  MODULE2_CLASSIFICATION: "Auto-detected",
  USER_ANSWER:            "Your answer",
  USER_CORRECTION:        "Your correction",
}
