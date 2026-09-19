// lib/interview/facts.ts
// Defines the structured Case Interview State for Module 3.
// Each fact has a status: KNOWN | MISSING | UNCERTAIN | NOT_APPLICABLE

export type FactStatus = "KNOWN" | "MISSING" | "UNCERTAIN" | "NOT_APPLICABLE"

export interface Fact {
  key: string
  status: FactStatus
  value: string | null   // always the user's original words, never invented
}

// All possible facts for an electronics consumer complaint
export type FactKey =
  | "device_type"
  | "brand"
  | "model"
  | "purchase_date"
  | "seller"
  | "purchase_platform"   // Amazon / Flipkart / local shop etc.
  | "purchase_price"
  | "invoice_available"
  | "problem_description"
  | "problem_started"     // when the problem first appeared
  | "warranty_status"
  | "repair_attempted"
  | "seller_contacted"
  | "seller_response"
  | "replacement_requested"
  | "refund_requested"
  | "relief_sought"
  | "evidence_available"

export type InterviewFactState = Record<FactKey, Fact>

export function emptyFactState(): InterviewFactState {
  const keys: FactKey[] = [
    "device_type", "brand", "model", "purchase_date", "seller",
    "purchase_platform", "purchase_price", "invoice_available",
    "problem_description", "problem_started", "warranty_status",
    "repair_attempted", "seller_contacted", "seller_response",
    "replacement_requested", "refund_requested", "relief_sought",
    "evidence_available",
  ]
  return Object.fromEntries(
    keys.map(k => [k, { key: k, status: "MISSING", value: null }])
  ) as InterviewFactState
}

// ── Device-specific required facts ──────────────────────────────────────────
// Only facts in this list will be asked for a given device.
// Facts not in the list are marked NOT_APPLICABLE automatically.

const COMMON_REQUIRED: FactKey[] = [
  "device_type", "brand", "purchase_date", "seller",
  "purchase_price", "invoice_available", "problem_description",
  "problem_started", "seller_contacted", "seller_response",
  "relief_sought", "evidence_available",
]

const WITH_WARRANTY: FactKey[] = [...COMMON_REQUIRED, "warranty_status", "repair_attempted"]
const WITH_MODEL: FactKey[] = [...WITH_WARRANTY, "model"]
const WITH_PLATFORM: FactKey[] = [...WITH_MODEL, "purchase_platform"]
const WITH_REPLACEMENT: FactKey[] = [...WITH_PLATFORM, "replacement_requested", "refund_requested"]

export const DEVICE_REQUIRED_FACTS: Record<string, FactKey[]> = {
  MOBILE_PHONE:       WITH_REPLACEMENT,
  LAPTOP:             WITH_REPLACEMENT,
  TELEVISION:         WITH_REPLACEMENT,
  REFRIGERATOR:       WITH_WARRANTY,
  WASHING_MACHINE:    WITH_WARRANTY,
  AIR_CONDITIONER:    WITH_WARRANTY,
  CHARGER_POWER_BANK: [...COMMON_REQUIRED, "purchase_platform", "refund_requested"],
  SMART_DEVICE:       WITH_PLATFORM,
  AUDIO_DEVICE:       WITH_PLATFORM,
  CAMERA:             WITH_REPLACEMENT,
  TABLET:             WITH_REPLACEMENT,
  PRINTER:            WITH_WARRANTY,
  MICROWAVE:          WITH_WARRANTY,
  OTHER_ELECTRONICS:  WITH_WARRANTY,
}

// Mark facts that are not required for this device as NOT_APPLICABLE
export function applyDeviceScope(
  state: InterviewFactState,
  deviceCategory: string
): InterviewFactState {
  const required = DEVICE_REQUIRED_FACTS[deviceCategory] ?? WITH_WARRANTY
  const next = { ...state }
  for (const key of Object.keys(next) as FactKey[]) {
    if (!required.includes(key) && next[key].status === "MISSING") {
      next[key] = { ...next[key], status: "NOT_APPLICABLE" }
    }
  }
  return next
}

// Return ordered list of facts still MISSING or UNCERTAIN (in priority order)
const PRIORITY_ORDER: FactKey[] = [
  "purchase_date", "purchase_price", "seller", "purchase_platform",
  "model", "invoice_available", "problem_started", "warranty_status",
  "repair_attempted", "seller_contacted", "seller_response",
  "replacement_requested", "refund_requested", "relief_sought",
  "evidence_available",
]

export function getMissingFacts(state: InterviewFactState): FactKey[] {
  return PRIORITY_ORDER.filter(
    k => state[k]?.status === "MISSING" || state[k]?.status === "UNCERTAIN"
  )
}

export function isInterviewComplete(state: InterviewFactState): boolean {
  return getMissingFacts(state).length === 0
}

// Human-readable labels for facts (used in the recorded-answers panel)
export const FACT_LABELS: Record<FactKey, string> = {
  device_type:           "Device type",
  brand:                 "Brand",
  model:                 "Model",
  purchase_date:         "Purchase date",
  seller:                "Seller / company",
  purchase_platform:     "Purchase platform",
  purchase_price:        "Purchase price",
  invoice_available:     "Invoice available",
  problem_description:   "Problem description",
  problem_started:       "Problem started",
  warranty_status:       "Warranty status",
  repair_attempted:      "Repair attempted",
  seller_contacted:      "Seller contacted",
  seller_response:       "Seller's response",
  replacement_requested: "Replacement requested",
  refund_requested:      "Refund requested",
  relief_sought:         "Relief sought",
  evidence_available:    "Evidence available",
}
