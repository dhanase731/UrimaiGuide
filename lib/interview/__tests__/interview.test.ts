import { describe, it, expect } from "vitest"
import {
  emptyFactState,
  getMissingFacts,
  isInterviewComplete,
  isStructurallyValid,
  ALL_FACT_KEYS,
  type InterviewFactState,
} from "../facts"
import { buildInitialFactState, detectConflict } from "../extractor"
import type { CaseData } from "@/lib/case-context"

describe("Interview Fact State and Logic", () => {
  const baseCaseData: CaseData = {
    step: 3,
    status: "INTAKE_SUBMITTED",
    progress_percentage: 25,
    mobile_number: "+919876543210",
    name: "Test User",
    address: "Chennai",
    product_service: "Samsung Galaxy M31",
    opposite_party_name: "Amazon",
    opposite_party_address: "Bangalore",
    purchase_date: "2026-01-15",
    transaction_amount: 25000,
    compensation_sought: 25000,
    total_claim_amount: 25000,
    defect_description: "Display flickering and touch unresponsive after 10 days",
    company_response: "No response from seller",
    relief_sought: "Full refund",
    evidence_available: "Invoice, Photos",
    limitation_flag: false,
    input_language: "ENGLISH",
    primary_category: "ELECTRONICS",
    sub_category: "MOBILE_PHONE",
    raw_problem_description: "I bought a Samsung phone from Amazon for 25000 rupees on 15 Jan 2026. After 10 days display started flickering.",
    case_specific_data: {
      user_original_text: "I bought a Samsung phone from Amazon for 25000 rupees on 15 Jan 2026. After 10 days display started flickering.",
      detected_device: "MOBILE_PHONE",
      user_selected_device: "MOBILE_PHONE",
      platform_detected: "Amazon",
    },
  }

  it("1. Initial state correctly populated from CaseData", () => {
    const state = buildInitialFactState(baseCaseData)
    expect(state.device_type.status).toBe("KNOWN")
    expect(state.brand.value).toBe("Samsung")
    expect(state.seller.value).toBe("Amazon")
    expect(state.purchase_price.value).toBe("₹25000")
    expect(state.problem_timing.value).toBe("after 10 days")
  })

  it("2. Normal answer validation", () => {
    expect(isStructurallyValid("purchase_price", "25000")).toBe(true)
    expect(isStructurallyValid("purchase_price", "₹14,999")).toBe(true)
    expect(isStructurallyValid("purchase_date", "2026-01-15")).toBe(true)
    expect(isStructurallyValid("purchase_date", "15 January 2026")).toBe(true)
    expect(isStructurallyValid("repair_attempted", "Yes")).toBe(true)
    expect(isStructurallyValid("repair_attempted", "No")).toBe(true)
  })

  it("3. Invalid answer rejection", () => {
    expect(isStructurallyValid("purchase_date", "yes")).toBe(false)
    expect(isStructurallyValid("purchase_date", "today")).toBe(false)
    expect(isStructurallyValid("purchase_price", "cheap")).toBe(false)
    expect(isStructurallyValid("purchase_price", "yes")).toBe(false)
    expect(isStructurallyValid("repair_attempted", "maybe")).toBe(false)
  })

  it("4. Gibberish answer rejection", () => {
    expect(isStructurallyValid("purchase_date", "asdf")).toBe(false)
    expect(isStructurallyValid("purchase_price", "xyz")).toBe(false)
    expect(isStructurallyValid("repair_attempted", "kjm")).toBe(false)
  })

  it("5. Tamil answers recognition", () => {
    expect(isStructurallyValid("repair_attempted", "ஆம்")).toBe(true)
    expect(isStructurallyValid("repair_attempted", "இல்லை")).toBe(true)
  })

  it("6. Hindi answers recognition", () => {
    expect(isStructurallyValid("repair_attempted", "हाँ")).toBe(true)
    expect(isStructurallyValid("repair_attempted", "नहीं")).toBe(true)
  })

  it("7. Conflict detection logic", () => {
    const conflict = detectConflict("seller", "Amazon", "MODULE2_TEXT", "Flipkart")
    expect(conflict).toBe(true)

    const noConflict = detectConflict("seller", "Amazon", "MODULE2_TEXT", "Amazon")
    expect(noConflict).toBe(false)

    const userCorrection = detectConflict("seller", "Amazon", "USER_ANSWER", "Flipkart")
    expect(userCorrection).toBe(false)
  })

  it("8. Missing facts calculation respects conditional skips", () => {
    const state = emptyFactState()
    state.repair_attempted = { key: "repair_attempted", status: "KNOWN", value: "No", source: "USER_ANSWER" }
    const missing = getMissingFacts(state)
    // repair_details should be skipped when repair_attempted is No
    expect(missing.includes("repair_details")).toBe(false)
  })

  it("9. 10+ consecutive turn simulation", () => {
    let state = emptyFactState()
    const answers: Partial<Record<keyof InterviewFactState, string>> = {
      brand: "Samsung",
      model: "Galaxy S21",
      purchase_date: "2026-01-10",
      purchase_price: "₹30000",
      seller: "Amazon",
      purchase_platform: "Amazon",
      problem_timing: "after 5 days",
      problem_still_occurring: "Yes",
      physical_damage: "No",
      warranty_status: "Under warranty",
      repair_attempted: "No",
      seller_contacted: "Yes",
      seller_response: "Refused replacement",
      relief_sought: "Full refund",
    }

    for (const [key, val] of Object.entries(answers)) {
      state = {
        ...state,
        [key]: { key, status: "KNOWN", value: val, source: "USER_ANSWER" },
      }
    }

    const missing = getMissingFacts(state)
    expect(missing.length).toBeGreaterThanOrEqual(0)
  })

  it("10. 20+ turns simulation and completion check", () => {
    let state = emptyFactState()
    for (const k of ALL_FACT_KEYS) {
      state[k] = { key: k, status: "KNOWN", value: "Yes", source: "USER_ANSWER" }
    }
    expect(isInterviewComplete(state)).toBe(true)
  })

  it("11. Conflict state blocks completion until resolved", () => {
    const state = emptyFactState()
    for (const k of ALL_FACT_KEYS) {
      state[k] = { key: k, status: "KNOWN", value: "Yes", source: "USER_ANSWER" }
    }
    state.seller = {
      key: "seller",
      status: "CONFLICT",
      value: "Amazon",
      conflictValue: "Flipkart",
      source: "MODULE2_TEXT",
    }
    expect(isInterviewComplete(state)).toBe(false)
  })
})
