// lib/interview/extractor.ts
// Reads Module 2 CaseData and pre-populates the InterviewFactState.
// Rules:
//   - Only marks a fact KNOWN when explicitly present in the source text/fields.
//   - Never invents values.
//   - Never overwrites a fact that is already KNOWN (higher-priority source wins).
//   - Evidence is decomposed into individual sub-facts (evidence_invoice, evidence_photos, etc.)
//   - problem_timing is extracted separately from problem_description.

import type { CaseData } from "@/lib/case-context"
import {
  emptyFactState,
  applyDeviceScope,
  isNo,
  isYes,
  type InterviewFactState,
  type FactKey,
  type FactSource,
} from "./facts"

// ── Internal helpers ──────────────────────────────────────────────────────────

function setKnown(
  state: InterviewFactState,
  key: FactKey,
  value: string,
  source: FactSource
): InterviewFactState {
  return { ...state, [key]: { key, status: "KNOWN", value, source } }
}

/** Only writes the fact if the slot is currently MISSING. */
function setIfMissing(
  state: InterviewFactState,
  key: FactKey,
  value: string | null | undefined,
  source: FactSource
): InterviewFactState {
  if (!value) return state
  if (state[key]?.status === "MISSING") return setKnown(state, key, value, source)
  return state
}

// ── Date normalisation ────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
  jan: "01", feb: "02", mar: "03", apr: "04",
  jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
}

export function extractDate(text: string): string | null {
  const t = text.toLowerCase()
  // DD Month YYYY — "10 January 2026"
  const m1 = t.match(
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/
  )
  if (m1) return `${m1[3]}-${MONTHS[m1[2]]}-${m1[1].padStart(2, "0")}`

  // Month DD, YYYY — "January 10, 2026"
  const m2 = t.match(
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/
  )
  if (m2) return `${m2[3]}-${MONTHS[m2[1]]}-${m2[2].padStart(2, "0")}`

  // DD/MM/YYYY or DD-MM-YYYY
  const m3 = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m3) return `${m3[3]}-${m3[2].padStart(2, "0")}-${m3[1].padStart(2, "0")}`

  // YYYY-MM-DD (already ISO)
  const m4 = t.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m4) return m4[0]

  return null
}

// ── Brand detection ───────────────────────────────────────────────────────────

const BRAND_LIST: [string, string][] = [
  ["samsung",        "Samsung"],
  ["apple",          "Apple"],
  ["oneplus",        "OnePlus"],
  ["one plus",       "OnePlus"],
  ["redmi",          "Redmi"],
  ["realme",         "Realme"],
  ["oppo",           "OPPO"],
  ["vivo",           "Vivo"],
  ["nokia",          "Nokia"],
  ["motorola",       "Motorola"],
  ["moto ",          "Motorola"],
  ["dell",           "Dell"],
  ["hewlett",        "HP"],
  [" hp ",           "HP"],
  ["lenovo",         "Lenovo"],
  ["asus",           "Asus"],
  ["acer",           "Acer"],
  [" lg ",           "LG"],
  ["sony",           "Sony"],
  ["whirlpool",      "Whirlpool"],
  ["godrej",         "Godrej"],
  ["daikin",         "Daikin"],
  ["voltas",         "Voltas"],
  ["bosch",          "Bosch"],
  ["ifb",            "IFB"],
  ["haier",          "Haier"],
  ["panasonic",      "Panasonic"],
  ["xiaomi",         "Xiaomi"],
  [" mi ",           "Xiaomi"],
  ["poco",           "POCO"],
  ["iqoo",           "iQOO"],
  ["nothing phone",  "Nothing"],
  ["google pixel",   "Google"],
  ["pixel",          "Google"],
  ["huawei",         "Huawei"],
  ["honor",          "Honor"],
  ["tcl",            "TCL"],
  ["hisense",        "Hisense"],
]

function extractBrand(text: string): string | null {
  const t = ` ${text.toLowerCase()} `
  for (const [kw, label] of BRAND_LIST) {
    if (t.includes(kw)) return label
  }
  return null
}

// ── Model extraction ──────────────────────────────────────────────────────────

function extractModel(text: string): string | null {
  const patterns: RegExp[] = [
    /\bsamsung\s+(galaxy\s+[a-z0-9]+(?:\s+(?:ultra|pro|plus|fe|lite|max|fan\s+edition))?)/i,
    /\b(iphone\s+\d+(?:\s+(?:pro\s+max|pro|max|plus|mini))?)/i,
    /\b(redmi\s+(?:note\s+)?\d+(?:\s+(?:pro\+?|plus|ultra|turbo))?)/i,
    /\b(realme\s+(?:narzo\s+|gt\s+|c\s*)?\d+(?:\s+(?:pro|plus|ultra))?)/i,
    /\b(oneplus\s+\d+(?:\s+(?:pro|r|t|ultra))?)/i,
    /\b(google\s+pixel\s+\d+(?:\s+(?:pro|a|xl|fold))?)/i,
    /\b(pixel\s+\d+(?:\s+(?:pro|a|xl|fold))?)/i,
    /\b(macbook\s+(?:pro|air)(?:\s+\d+(?:\s*(?:inch|"))?)?)/i,
    /\b(macbook\s+(?:pro|air|mini))/i,
    /\b(thinkpad\s+[a-z]\d+(?:\s+\w+)?)/i,
    /\b(inspiron\s+\d+)/i,
    /\b(pavilion\s+\d+)/i,
    /\b(vivobook\s+\d+)/i,
    /\b(poco\s+[a-z]\d+(?:\s+(?:pro|ultra))?)/i,
    /\b(iqoo\s+\d+(?:\s+(?:pro|ultra|neo))?)/i,
    /\b(nothing\s+phone\s*\(?[1-9]\)?)/i,
    /\b(moto\s+[a-z]\d+(?:\s+(?:plus|pro))?)/i,
    /\b(galaxy\s+[a-z0-9]+(?:\s+(?:ultra|pro|plus|fe|lite|max))?)/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].replace(/\s+/g, " ").trim()
  }
  return null
}

// ── Device type detection ─────────────────────────────────────────────────────

const DEVICE_TYPE_PATTERNS: [RegExp, string][] = [
  [/\b(mobile|phone|smartphone|handset|android|iphone)\b/i,    "MOBILE_PHONE"],
  [/\b(laptop|notebook|macbook|chromebook|ultrabook)\b/i,      "LAPTOP"],
  [/\b(tablet|ipad)\b/i,                                       "TABLET"],
  [/\b(television|tv|smart\s*tv|oled|qled|led\s*tv)\b/i,      "TELEVISION"],
  [/\b(refrigerator|fridge|freezer)\b/i,                       "REFRIGERATOR"],
  [/\b(washing\s*machine|washer|dryer)\b/i,                    "WASHING_MACHINE"],
  [/\b(air\s*conditioner|a\.?c\.?|split\s*ac|window\s*ac)\b/i,"AIR_CONDITIONER"],
  [/\b(charger|power\s*bank|powerbank|adapter)\b/i,            "CHARGER_POWER_BANK"],
  [/\b(smart\s*watch|smartwatch|fitness\s*band|wearable)\b/i,  "SMART_DEVICE"],
  [/\b(earphone|earbuds|headphone|speaker|soundbar)\b/i,       "AUDIO_DEVICE"],
  [/\b(camera|dslr|mirrorless|webcam)\b/i,                     "CAMERA"],
  [/\b(printer|scanner)\b/i,                                   "PRINTER"],
  [/\b(microwave|oven)\b/i,                                    "MICROWAVE"],
]

function detectDeviceType(text: string): string | null {
  for (const [re, type] of DEVICE_TYPE_PATTERNS) {
    if (re.test(text)) return type
  }
  return null
}

// ── Platform / seller detection ───────────────────────────────────────────────

const PLATFORM_LIST: [string, string][] = [
  ["amazon",           "Amazon"],
  ["flipkart",         "Flipkart"],
  ["meesho",           "Meesho"],
  ["snapdeal",         "Snapdeal"],
  ["croma",            "Croma"],
  ["reliance digital", "Reliance Digital"],
  ["vijay sales",      "Vijay Sales"],
  ["myntra",           "Myntra"],
  ["jiomart",          "JioMart"],
  ["tatacliq",         "Tata CLiQ"],
  ["paytm mall",       "Paytm Mall"],
  ["nykaa",            "Nykaa"],
  ["ajio",             "Ajio"],
  ["shopclues",        "ShopClues"],
]

function extractPlatform(text: string): string | null {
  const t = text.toLowerCase()
  for (const [kw, label] of PLATFORM_LIST) {
    if (t.includes(kw)) return label
  }
  return null
}

// ── Price extraction ──────────────────────────────────────────────────────────

function extractPrice(text: string): string | null {
  const m = text.match(
    /(?:₹|rs\.?\s*|inr\s*|rupees?\s*)([0-9][0-9,]*(?:\.[0-9]+)?)|([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:rupees?|rs\.?|inr)/i
  )
  if (!m) return null
  const raw = (m[1] || m[2]).replace(/,/g, "")
  return `₹${raw}`
}

// ── Problem timing extraction ─────────────────────────────────────────────────
// Extracts relative timing such as "after 10 days", "2 weeks later", "immediately"
// from the problem description. Stored separately from problem_description.

function extractProblemTiming(text: string): string | null {
  const t = text.toLowerCase()

  // "after N days/weeks/months"
  const rel = t.match(
    /after\s+(\d+\s+(?:days?|weeks?|months?)|a\s+(?:day|week|month)|an?\s+(?:hours?))/
  )
  if (rel) return rel[0]

  // "N days after purchase/buying"
  const rel2 = t.match(/(\d+)\s+(days?|weeks?|months?)\s+after\s+(?:purchase|buying|getting|receiving)/i)
  if (rel2) return `${rel2[1]} ${rel2[2]} after purchase`

  // "worked/used normally for N days, then..."
  // e.g. "worked normally for 10 days, but then the screen stopped"
  const rel3 = t.match(/(?:worked|used|functioned|ran|operated)\s+(?:\w+\s+){0,3}for\s+(\d+)\s+(days?|weeks?|months?)\s*[,.]?\s*(?:but\s+)?then/i)
  if (rel3) return `after ${rel3[1]} ${rel3[2]}`

  // "for N days then" / "for N days before"
  const rel4 = t.match(/for\s+(\d+)\s+(days?|weeks?|months?)\s*[,.]?\s*(?:but\s+)?(?:then|before|after\s+which)/i)
  if (rel4) return `after ${rel4[1]} ${rel4[2]}`

  // "immediately", "right away", "on the same day", "within a week"
  const immediate = t.match(
    /\b(immediately|right\s+away|same\s+day|within\s+\d+\s+\w+|within\s+a\s+(?:day|week|month))\b/
  )
  if (immediate) return immediate[0]

  // "from the beginning", "from day one"
  if (/from\s+(the\s+)?(?:beginning|start|day\s+one|day\s+1)/i.test(t)) {
    return "from the beginning"
  }

  return null
}

// ── Evidence extraction ───────────────────────────────────────────────────────
// Returns a partial record of evidence sub-fact keys → "Yes" | "No"

type EvidenceFact =
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

function extractEvidence(text: string): Partial<Record<EvidenceFact, string>> {
  const t = text.toLowerCase()
  const found: Partial<Record<EvidenceFact, string>> = {}

  const has = (pattern: RegExp) => pattern.test(t)

  // Invoice / receipt / bill
  if (has(/\b(invoice|receipt|bill)\b/)) {
    if (has(/\bno\s+(?:invoice|receipt|bill)\b|\bdon'?t\s+have.*(?:invoice|receipt|bill)\b/)) {
      found.evidence_invoice = "No"
    } else if (has(/\b(?:have|got|have\s+the|have\s+my)\b.*\b(?:invoice|receipt|bill)\b/)) {
      found.evidence_invoice = "Yes"
    } else {
      found.evidence_invoice = "Yes" // mentioned = likely available
    }
  }

  // Order confirmation
  if (has(/\border\s+confirm|confirmation\s+email|order\s+email\b/)) {
    found.evidence_order_confirmation = "Yes"
  }

  // Warranty card / document
  if (has(/\bwarranty\s+(?:card|document|paper|cert)/)) {
    found.evidence_warranty_card = "Yes"
  }

  // Photos / screenshots
  if (has(/\b(photos?|photographs?|pictures?|screenshots?|images?)\b/)) {
    found.evidence_photos = "Yes"
  }

  // Videos
  if (has(/\bvideo\b/)) {
    found.evidence_videos = "Yes"
  }

  // Chat records (WhatsApp, SMS, iMessage)
  if (has(/\b(whatsapp|chat|sms|text\s+message|message)\b/)) {
    found.evidence_chat_records = "Yes"
  }

  // Emails
  if (has(/\b(email|e-mail|gmail|mail)\b/)) {
    found.evidence_emails = "Yes"
  }

  // Service / job sheet
  if (has(/\b(job\s+sheet|service\s+report|job\s+card|service\s+card)\b/)) {
    found.evidence_service_job_sheet = "Yes"
  }

  // Repair receipt
  if (has(/\b(repair\s+receipt|repair\s+bill|service\s+receipt)\b/)) {
    found.evidence_repair_receipt = "Yes"
  }

  return found
}

// ── Full text scan ────────────────────────────────────────────────────────────

interface ScanResult {
  facts:      Partial<Record<FactKey, string>>
  deviceType: string | null
}

function scanText(text: string): ScanResult {
  const found: Partial<Record<FactKey, string>> = {}

  const deviceType = detectDeviceType(text)
  const brand = extractBrand(text)
  if (brand) found.brand = brand

  const model = extractModel(text)
  if (model) found.model = model

  const platform = extractPlatform(text)
  if (platform) {
    found.seller = platform
    found.purchase_platform = platform
  }

  const date = extractDate(text)
  if (date) found.purchase_date = date

  const price = extractPrice(text)
  if (price) found.purchase_price = price

  if (text.trim().length > 10) found.problem_description = text.trim()

  const timing = extractProblemTiming(text)
  if (timing) found.problem_timing = timing

  // Evidence sub-facts
  const evidence = extractEvidence(text)
  for (const [k, v] of Object.entries(evidence) as [EvidenceFact, string][]) {
    found[k] = v
  }

  // Seller contacted
  if (/\b(contacted|called|emailed|complained|raised|wrote\s+to|messaged|whatsapp'?ed?|reached\s+out)\b/i.test(text)) {
    found.seller_contacted = "Yes"
  }

  // Refund / replacement
  if (/\brefund\b/i.test(text)) found.refund_requested = "Yes"
  if (/\b(replacement|replace)\b/i.test(text)) found.replacement_requested = "Yes"

  // Seller response / refusal
  if (/\b(refused|rejected|denied|no\s+response|ignored|not\s+responding|no\s+reply)\b/i.test(text)) {
    found.seller_response = text.trim()
    if (!found.seller_contacted) found.seller_contacted = "Yes"
  }

  // Warranty status
  if (/\bunder\s+warranty\b|\bwarranty\s+period\b|\bstill\s+in\s+warranty\b/i.test(text)) {
    found.warranty_status = "Under warranty"
  } else if (/\bwarranty\s+expired\b|\bout\s+of\s+warranty\b|\bno\s+warranty\b/i.test(text)) {
    found.warranty_status = "Warranty expired"
  }

  // Repair signals
  if (/\b(service\s+cent(?:re|er)|repair(?:ed)?|technician|serviced)\b/i.test(text)) {
    found.repair_attempted = "Yes"
  }

  // Physical damage
  if (/\b(drop(?:ped)?|fell|liquid|water\s+damage|cracked|broken\s+screen|physically\s+damage)\b/i.test(text)) {
    found.physical_damage = "Yes"
  } else if (/\bno\s+(?:physical\s+)?damage\b|\bnot\s+drop(?:ped)?\b/i.test(text)) {
    found.physical_damage = "No"
  }

  // Problem still occurring
  if (/\bstill\s+(?:not\s+working|broken|problem|issue|occurring)\b/i.test(text)) {
    found.problem_still_occurring = "Yes"
  }

  return { facts: found, deviceType }
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildInitialFactState(caseData: CaseData): InterviewFactState {
  const deviceCategory: string =
    (caseData.case_specific_data?.detected_device as string) ||
    caseData.sub_category ||
    "OTHER_ELECTRONICS"

  let state = emptyFactState()
  state = applyDeviceScope(state, deviceCategory)

  // Set device_type from classification
  const deviceLabel: string =
    (caseData.case_specific_data?.user_selected_device as string) || deviceCategory
  if (deviceLabel) state = setKnown(state, "device_type", deviceLabel, "MODULE2_CLASSIFICATION")

  // Use original Module 2 text (highest fidelity)
  const problemText: string =
    (caseData.case_specific_data?.user_original_text as string) ||
    caseData.raw_problem_description ||
    ""

  if (problemText) {
    const { facts: scanned, deviceType: detectedType } = scanText(problemText)

    if (detectedType && state.device_type?.status !== "KNOWN") {
      state = setKnown(state, "device_type", detectedType, "MODULE2_TEXT")
    }

    for (const [k, v] of Object.entries(scanned) as [FactKey, string][]) {
      // Only write MISSING slots — never overwrite KNOWN facts
      state = setIfMissing(state, k, v, "MODULE2_TEXT")
    }

    // Apply yes/no normalisation for boolean facts extracted from text:
    // seller_contacted / repair_attempted are signals, not validated — keep as-is.
    // They will be asked for confirmation in Module 3 if not KNOWN from text.
  }

  // Platform from electronics classification (lower priority)
  const platform = caseData.case_specific_data?.platform_detected as string | null
  if (platform) {
    state = setIfMissing(state, "purchase_platform", platform, "MODULE2_CLASSIFICATION")
    state = setIfMissing(state, "seller", platform, "MODULE2_CLASSIFICATION")
  }

  // Structured CaseData fields (lowest priority — only fill MISSING slots)
  if (caseData.product_service)
    state = setIfMissing(state, "model", caseData.product_service, "MODULE2_FIELD")
  if (caseData.opposite_party_name)
    state = setIfMissing(state, "seller", caseData.opposite_party_name, "MODULE2_FIELD")
  if (caseData.purchase_date)
    state = setIfMissing(state, "purchase_date", caseData.purchase_date, "MODULE2_FIELD")
  if (caseData.transaction_amount > 0)
    state = setIfMissing(state, "purchase_price", `₹${caseData.transaction_amount}`, "MODULE2_FIELD")
  if (caseData.defect_description)
    state = setIfMissing(state, "problem_description", caseData.defect_description, "MODULE2_FIELD")
  if (caseData.company_response) {
    state = setIfMissing(state, "seller_response", caseData.company_response, "MODULE2_FIELD")
    state = setIfMissing(state, "seller_contacted", "Yes", "MODULE2_FIELD")
  }
  if (caseData.relief_sought)
    state = setIfMissing(state, "relief_sought", caseData.relief_sought, "MODULE2_FIELD")

  // Derive seller_contacted = "Yes" if a seller_response is already KNOWN
  if (
    state.seller_response?.status === "KNOWN" &&
    state.seller_contacted?.status === "MISSING"
  ) {
    state = setKnown(state, "seller_contacted", "Yes", "MODULE2_TEXT")
  }

  // Derive replacement/refund requested from relief_sought if present
  const relief = state.relief_sought?.value?.toLowerCase() ?? ""
  if (relief) {
    if (/replacement|replace/i.test(relief))
      state = setIfMissing(state, "replacement_requested", "Yes", "MODULE2_FIELD")
    if (/refund/i.test(relief))
      state = setIfMissing(state, "refund_requested", "Yes", "MODULE2_FIELD")
  }

  return state
}

// ── Conflict detection helper (used in interview-form) ───────────────────────
// Returns true when a new user-provided value meaningfully contradicts an
// existing MODULE2-sourced value for time-sensitive fields.

const CONFLICT_CANDIDATE_KEYS = new Set<FactKey>([
  "problem_timing", "purchase_date", "purchase_price",
  "seller", "model", "brand", "repair_attempted", "seller_contacted",
])

function normaliseForConflict(v: string): string {
  return v.toLowerCase().replace(/[₹,\s]/g, "").trim()
}

export function detectConflict(
  key: FactKey,
  existingValue: string,
  existingSource: FactSource | null,
  newValue: string
): boolean {
  if (!CONFLICT_CANDIDATE_KEYS.has(key)) return false
  // Only flag conflicts when the existing fact came from Module 2
  if (
    existingSource !== "MODULE2_TEXT" &&
    existingSource !== "MODULE2_FIELD" &&
    existingSource !== "MODULE2_CLASSIFICATION"
  ) return false

  const existing = normaliseForConflict(existingValue)
  const incoming = normaliseForConflict(newValue)
  if (existing === incoming) return false

  // YES/NO flip is always a conflict
  if (
    (isYes(existingValue) && isNo(newValue)) ||
    (isNo(existingValue) && isYes(newValue))
  ) return true

  // For free-text facts, only flag when both are non-trivial and differ
  if (existing.length > 2 && incoming.length > 2 && existing !== incoming) return true

  return false
}
