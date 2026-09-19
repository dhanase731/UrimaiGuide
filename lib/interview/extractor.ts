// lib/interview/extractor.ts
// Reads Module 2 output from CaseData and pre-populates the InterviewFactState.
// Only marks a fact KNOWN when the value is genuinely present in the user's text.
// Never invents values.

import type { CaseData } from "@/lib/case-context"
import {
  emptyFactState,
  applyDeviceScope,
  type InterviewFactState,
  type FactKey,
} from "./facts"

function setKnown(
  state: InterviewFactState,
  key: FactKey,
  value: string
): InterviewFactState {
  return { ...state, [key]: { key, status: "KNOWN", value } }
}

// Simple keyword scan on the raw problem text to extract obvious facts.
// Gemini will do the deeper extraction during the interview turns.
function scanText(text: string): Partial<Record<FactKey, string>> {
  const t = text.toLowerCase()
  const found: Partial<Record<FactKey, string>> = {}

  // Brand detection
  const brands: [string, string][] = [
    ["samsung", "Samsung"], ["apple", "Apple"], ["oneplus", "OnePlus"],
    ["redmi", "Redmi"], ["realme", "Realme"], ["oppo", "OPPO"],
    ["vivo", "Vivo"], ["nokia", "Nokia"], ["motorola", "Motorola"],
    ["dell", "Dell"], ["hp", "HP"], ["lenovo", "Lenovo"],
    ["asus", "Asus"], ["acer", "Acer"], ["lg", "LG"],
    ["sony", "Sony"], ["whirlpool", "Whirlpool"], ["godrej", "Godrej"],
    ["daikin", "Daikin"], ["voltas", "Voltas"], ["bosch", "Bosch"],
    ["ifb", "IFB"], ["haier", "Haier"], ["panasonic", "Panasonic"],
  ]
  for (const [kw, label] of brands) {
    if (t.includes(kw)) { found.brand = label; break }
  }

  // Platform detection
  const platforms: [string, string][] = [
    ["amazon", "Amazon"], ["flipkart", "Flipkart"], ["meesho", "Meesho"],
    ["snapdeal", "Snapdeal"], ["croma", "Croma"],
    ["reliance digital", "Reliance Digital"], ["vijay sales", "Vijay Sales"],
  ]
  for (const [kw, label] of platforms) {
    if (t.includes(kw)) {
      found.seller = label
      found.purchase_platform = label
      break
    }
  }

  // Problem description — use the full text as a starting point
  if (text.trim().length > 10) {
    found.problem_description = text.trim()
  }

  // Seller contacted signals
  if (
    t.includes("contacted") || t.includes("called") || t.includes("emailed") ||
    t.includes("complained") || t.includes("raised") || t.includes("wrote to")
  ) {
    found.seller_contacted = "Yes"
  }

  // Refund/replacement signals
  if (t.includes("refund")) found.refund_requested = "Yes"
  if (t.includes("replacement") || t.includes("replace")) found.replacement_requested = "Yes"

  // Seller response signals
  if (
    t.includes("refused") || t.includes("rejected") || t.includes("denied") ||
    t.includes("no response") || t.includes("ignored")
  ) {
    found.seller_response = text.trim()
  }

  return found
}

export function buildInitialFactState(
  caseData: CaseData
): InterviewFactState {
  const deviceCategory =
    (caseData.case_specific_data?.detected_device as string) ||
    caseData.sub_category ||
    "OTHER_ELECTRONICS"

  let state = emptyFactState()

  // Apply device scope first (marks irrelevant facts NOT_APPLICABLE)
  state = applyDeviceScope(state, deviceCategory)

  // Set device_type from classification
  const deviceLabel =
    (caseData.case_specific_data?.user_selected_device as string) ||
    deviceCategory
  if (deviceLabel) {
    state = setKnown(state, "device_type", deviceLabel)
  }

  // Use the best available problem text
  const problemText =
    (caseData.case_specific_data?.user_original_text as string) ||
    caseData.raw_problem_description ||
    ""

  // Scan text for obvious facts
  const scanned = scanText(problemText)
  for (const [k, v] of Object.entries(scanned) as [FactKey, string][]) {
    if (state[k]?.status === "MISSING" && v) {
      state = setKnown(state, k, v)
    }
  }

  // Apply platform from electronics classification if available
  const platform = caseData.case_specific_data?.platform_detected as string | null
  if (platform && state.purchase_platform.status === "MISSING") {
    state = setKnown(state, "purchase_platform", platform)
    if (state.seller.status === "MISSING") {
      state = setKnown(state, "seller", platform)
    }
  }

  // Apply existing case fields if already populated from a previous session
  if (caseData.product_service && state.model.status === "MISSING") {
    state = setKnown(state, "model", caseData.product_service)
  }
  if (caseData.opposite_party_name && state.seller.status === "MISSING") {
    state = setKnown(state, "seller", caseData.opposite_party_name)
  }
  if (caseData.purchase_date && state.purchase_date.status === "MISSING") {
    state = setKnown(state, "purchase_date", caseData.purchase_date)
  }
  if (caseData.transaction_amount > 0 && state.purchase_price.status === "MISSING") {
    state = setKnown(state, "purchase_price", `₹${caseData.transaction_amount}`)
  }
  if (caseData.defect_description && state.problem_description.status === "MISSING") {
    state = setKnown(state, "problem_description", caseData.defect_description)
  }
  if (caseData.company_response && state.seller_response.status === "MISSING") {
    state = setKnown(state, "seller_response", caseData.company_response)
  }
  if (caseData.relief_sought && state.relief_sought.status === "MISSING") {
    state = setKnown(state, "relief_sought", caseData.relief_sought)
  }
  if (caseData.evidence_available && state.evidence_available.status === "MISSING") {
    state = setKnown(state, "evidence_available", caseData.evidence_available)
  }

  return state
}
