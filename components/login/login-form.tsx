"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, AlertCircle, KeyRound } from "lucide-react"
import { useCaseContext, type CourtOrder, type Hearing, type Task, type Notification, type TimelineEvent, type ScrapeRecord } from "@/lib/case-context"

const inp = "w-full rounded-md border border-softborder bg-card px-3 py-2.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-muted-foreground focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10"

export function LoginForm() {
  const router = useRouter()
  const {
    setUser, setAuthenticated, setCaseData,
    setHearings, setOrders, setTasks, setNotifications,
    setTimeline, setScrapeRecords, setChangeLog,
  } = useCaseContext()

  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{10}$/.test(mobile) || password.length < 8) {
      setError("Enter a valid 10-digit mobile number and your password.")
      return
    }
    setError("")
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))

    // ── User ──────────────────────────────────────────────────────────────────
    setUser({
      user_id: "b7f3c1a2-9d4e-4c6a-8f21-3e5a7c9d1b0e",
      full_name: "Ravi Kumar",
      mobile_number: mobile,
      email: "ravi@example.com",
      state: "Tamil Nadu",
      district: "Chennai",
      pincode: "600001",
      preferred_language: "ENGLISH",
      is_nri: false,
      nri_country: "",
      google_connected: true,
      fcm_enabled: true,
      notifications: { whatsapp: true, sms: true, push: true },
    })
    setAuthenticated(true)

    // ── Case data ─────────────────────────────────────────────────────────────
    setCaseData({
      case_id: "3f9a2c7e-1b84-4d52-9a6f-77c0e2d81a45",
      case_number: "CC/TN/CHN/2024/00142",
      status: "HEARING_SCHEDULED",
      progress_percentage: 75,
      raw_problem_description: "The electronics store sold me a Samsung phone that stopped working after two weeks and refuses to repair or refund it.",
      input_language: "ENGLISH",
      input_mode: "TEXT",
      primary_case_type: "DEFECTIVE_GOODS",
      primary_case_type_label: "Defective Goods",
      confidence_score: 0.94,
      sub_category: "ELECTRONICS",
      sector: "ELECTRONICS",
      opposite_party_type: "SELLER",
      is_consumer_case: true,
      product_service: "Samsung Galaxy S23 smartphone",
      opposite_party_name: "QuickMart Electronics Pvt. Ltd.",
      opposite_party_city: "Chennai",
      opposite_party_state: "Tamil Nadu",
      purchase_date: "15/09/2024",
      transaction_amount: 45000,
      compensation_sought: 5000,
      incident_date: "25/09/2024",
      defect_description: "Screen stopped working completely within 10 days of purchase",
      legal_notice_sent: true,
      company_response: "They refused to repair or refund via WhatsApp on 25 Sep 2024",
      purchase_purpose: "PERSONAL_USE",
      is_resale: false,
      relief_sought: "Full refund of ₹45,000 with 9% interest, ₹5,000 compensation for mental agony, ₹2,000 litigation costs",
      evidence_available: "Purchase invoice, WhatsApp chat screenshots, warranty card",
      case_specific_data: {},
      is_eligible: true,
      eligibility_status: "ELIGIBLE",
      filing_deadline: "14 September 2026",
      days_remaining: 650,
      limitation_status: "SAFE",
      condonation_required: false,
      overall_recommendation: "Proceed to jurisdiction routing.",
      ombudsman_applicable: false,
      ombudsman_type: null,
      recommended_commission: "DCDRC",
      commission_full_name: "District Consumer Disputes Redressal Commission, Chennai",
      commission_address: "Singaravelar Maligai, Rajaji Salai, Chennai – 600 001",
      commission_city: "Chennai",
      commission_phone: "+91 44 2534 0000",
      commission_hours: "Mon–Fri  10:30 AM – 5:00 PM",
      commission_scrape_url: "https://consumeraffairs.nic.in/dcdrc-chennai",
      court_fee_amount: 200,
      court_fee_free: false,
      territorial_basis: "Complainant's residence in Chennai + purchase value ₹45,000 ≤ ₹50L (Section 34, CPA 2019)",
      pecuniary_section: "Section 34, CPA 2019",
      evidence_strength_score: 82,
      risk_level: "LOW",
      can_proceed_to_filing: true,
      ejagriti_case_number: "ACK/CHN/2024/00142",
      acknowledgement_number: "ACK/CHN/2024/00142",
      filing_date: "2024-11-01T09:25:00Z",
      tracking_activated: true,
      current_stage: "HEARING_SCHEDULED",
      next_hearing_date: "2025-01-15",
      next_hearing_time: "10:30 AM",
      next_hearing_venue: "District Consumer Disputes Redressal Commission, Chennai — Courtroom 2",
      last_synced_at: "2025-01-14T08:30:00Z",
      complaint_text_en: "The complainant purchased Samsung Galaxy S23 smartphone from QuickMart Electronics Pvt. Ltd. on 15/09/2024 for ₹45,000. Screen stopped working completely within 10 days of purchase. The opposite party's response: They refused to repair or refund via WhatsApp on 25 Sep 2024. Relief sought: Full refund of ₹45,000 with 9% interest, ₹5,000 compensation for mental agony, ₹2,000 litigation costs.",
      complaint_text_ta: "",
      sections_cited: ["Section 2(7)", "Section 34", "Section 35", "Section 69"],
      total_claim_amount: 52000,
    })

    // ── Hearings ──────────────────────────────────────────────────────────────
    const hearings: Hearing[] = [
      {
        hearing_id: "h1",
        date: "2025-01-15",
        time: "10:30 AM",
        label: "First hearing",
        status: "SCHEDULED",
        notes: "Both parties to appear. Complainant to bring original documents.",
        source: "EDAAKHIL",
        scraped_at: "2025-01-10T09:00:00Z",
      },
      {
        hearing_id: "h2",
        date: "2025-02-12",
        time: "11:00 AM",
        label: "Evidence hearing",
        status: "PENDING",
        notes: "Evidence to be submitted. Opposite party to file written version.",
        source: "EDAAKHIL",
        scraped_at: "2025-01-14T08:30:00Z",
      },
    ]
    setHearings(hearings)

    // ── Orders ────────────────────────────────────────────────────────────────
    const orders: CourtOrder[] = [
      {
        order_id: "o1",
        order_date: "2025-01-15",
        order_type: "NOTICE",
        order_number: "ORD/CHN/2024/00142/01",
        title: "Notice to Opposite Party",
        plain_summary_en: "Commission issued notice to QuickMart Electronics Pvt. Ltd. to file written version within 30 days.",
        plain_summary_ta: "",
        outcome: "NEUTRAL",
        outcome_explanation: "Notice issued — awaiting opposite party response.",
        deadlines: [{ action: "File written version", calculated_deadline: "2025-02-14", responsible_party: "Opposite Party" }],
        amounts_ordered: [],
        next_hearing_date: "2025-02-12",
        audio_available: false,
        source: "COMMISSION_SITE",
        scraped_at: "2025-01-15T18:45:00Z",
        source_url: "https://consumeraffairs.nic.in/dcdrc-chennai/orders/00142",
        pdf_url: "https://consumeraffairs.nic.in/dcdrc-chennai/orders/00142/01.pdf",
        is_new: false,
      },
      {
        order_id: "o2",
        order_date: "2025-02-12",
        order_type: "INTERIM",
        order_number: "ORD/CHN/2024/00142/02",
        title: "Interim Order — Status Quo",
        plain_summary_en: "Opposite party directed not to dispose of the defective product pending final hearing.",
        plain_summary_ta: "",
        outcome: "FAVORABLE",
        outcome_explanation: "Order in favour of complainant.",
        deadlines: [],
        amounts_ordered: [],
        next_hearing_date: "2025-03-20",
        audio_available: false,
        source: "COMMISSION_SITE",
        scraped_at: "2025-02-12T20:10:00Z",
        source_url: "https://consumeraffairs.nic.in/dcdrc-chennai/orders/00142",
        pdf_url: "https://consumeraffairs.nic.in/dcdrc-chennai/orders/00142/02.pdf",
        is_new: true,
      },
    ]
    setOrders(orders)

    // ── Tasks ─────────────────────────────────────────────────────────────────
    const tasks: Task[] = [
      {
        task_id: "t1",
        title: "Sign and file Rejoinder Affidavit",
        description: "Respond to opposite party's written version",
        deadline: "2025-01-15",
        task_type: "DOCUMENT",
        priority: "HIGH",
        status: "PENDING",
        source: "AUTO_ORDER",
        days_until_deadline: 0,
        reminder_active: true,
      },
      {
        task_id: "t2",
        title: "Attend hearing at DCDRC Chennai",
        description: "First hearing — bring all original documents",
        deadline: "2025-01-15",
        task_type: "HEARING",
        priority: "HIGH",
        status: "PENDING",
        source: "AUTO_HEARING",
        days_until_deadline: 4,
        reminder_active: true,
      },
      {
        task_id: "t3",
        title: "Upload bank transaction statement",
        description: "Required as additional evidence",
        deadline: "2025-01-10",
        task_type: "DOCUMENT",
        priority: "HIGH",
        status: "OVERDUE",
        source: "MANUAL",
        days_until_deadline: -2,
        reminder_active: false,
      },
      {
        task_id: "t4",
        title: "Pay court fee of ₹200 via eDaakhil",
        description: "Filing fee payment",
        deadline: "2025-01-20",
        task_type: "PAYMENT",
        priority: "MEDIUM",
        status: "COMPLETED",
        source: "MANUAL",
        days_until_deadline: 9,
        reminder_active: false,
      },
    ]
    setTasks(tasks)

    // ── Notifications ─────────────────────────────────────────────────────────
    const notifications: Notification[] = [
      {
        notification_id: "n1",
        notification_type: "HEARING_REMINDER_7D",
        channel: "WHATSAPP",
        message: "Hearing reminder: Case CC/TN/CHN/2024/00142 on 15 Jan 2025 at 10:30 AM at DCDRC Chennai",
        delivery_status: "DELIVERED",
        sent_at: "2025-01-08T08:00:00Z",
      },
      {
        notification_id: "n2",
        notification_type: "LIMITATION_WARNING",
        channel: "SMS",
        message: "Limitation warning: 60 days remaining to file under Section 69 CPA 2019",
        delivery_status: "SENT",
        sent_at: "2024-12-01T09:00:00Z",
      },
      {
        notification_id: "n3",
        notification_type: "ORDER_RECEIVED",
        channel: "PUSH",
        message: "New court order uploaded — Interim Order issued on 12 Feb 2025",
        delivery_status: "DELIVERED",
        sent_at: "2025-02-12T14:30:00Z",
      },
      {
        notification_id: "n4",
        notification_type: "TASK_DEADLINE",
        channel: "WHATSAPP",
        message: "Task deadline: Sign and file Rejoinder Affidavit due in 3 days",
        delivery_status: "DELIVERED",
        sent_at: "2025-01-12T08:00:00Z",
      },
    ]
    setNotifications(notifications)

    // ── Timeline ──────────────────────────────────────────────────────────────
    const timeline: TimelineEvent[] = [
      { event_id: "e1", timestamp: "2024-11-01T09:12:00Z", label: "Problem described", actor: "USER", note: "Defective phone — seller refuses repair or refund." },
      { event_id: "e2", timestamp: "2024-11-01T09:12:45Z", label: "AI classified complaint", actor: "SYSTEM", note: "Category: DEFECTIVE_GOODS · Confidence: 0.94" },
      { event_id: "e3", timestamp: "2024-11-01T09:18:00Z", label: "AI interview completed", actor: "USER", note: "8 questions answered. Relief sought: ₹45,000." },
      { event_id: "e4", timestamp: "2024-11-01T09:19:10Z", label: "Eligibility confirmed", actor: "SYSTEM", note: "Within 2-year limitation. Complaint value ≤ ₹50L → District Forum." },
      { event_id: "e5", timestamp: "2024-11-01T09:19:30Z", label: "Jurisdiction assigned", actor: "SYSTEM", note: "District Consumer Disputes Redressal Commission, Chennai." },
      { event_id: "e6", timestamp: "2024-11-01T09:22:00Z", label: "Documents generated", actor: "SYSTEM", note: "Complaint petition, affidavit, and evidence index ready." },
      { event_id: "e7", timestamp: "2024-11-01T09:25:00Z", label: "Complaint filed", actor: "USER", note: "Acknowledgement: ACK/CHN/2024/00142. Next hearing: 15 January 2025." },
      { event_id: "e8", timestamp: "2025-01-10T09:00:00Z", label: "Hearing date scraped", actor: "SYSTEM", note: "First hearing: 15 Jan 2025 at 10:30 AM — detected via eDaakhil scraper." },
      { event_id: "e9", timestamp: "2025-01-15T18:45:00Z", label: "New order detected", actor: "COURT", note: "Notice to Opposite Party — scraped from DCDRC Chennai website." },
      { event_id: "e10", timestamp: "2025-02-12T20:10:00Z", label: "New order detected", actor: "COURT", note: "Interim Order — Status Quo — scraped from DCDRC Chennai website." },
    ]
    setTimeline(timeline)

    // ── Scrape records ────────────────────────────────────────────────────────
    const scrapeRecords: ScrapeRecord[] = [
      { field: "Case status", value: "Hearing Scheduled", source: "EDAAKHIL", scraped_at: "2025-01-14T08:30:00Z", source_url: "https://edaakhil.nic.in/case/CC-TN-CHN-2024-00142" },
      { field: "Next hearing date", value: "15 January 2025 · 10:30 AM", source: "EDAAKHIL", scraped_at: "2025-01-14T08:30:00Z", source_url: "https://edaakhil.nic.in/case/CC-TN-CHN-2024-00142" },
      { field: "Acknowledgement number", value: "ACK/CHN/2024/00142", source: "EDAAKHIL", scraped_at: "2025-01-14T08:30:00Z", source_url: "https://edaakhil.nic.in/case/CC-TN-CHN-2024-00142" },
      { field: "Opposite party response", value: "Written version not yet filed", source: "COMMISSION_SITE", scraped_at: "2025-01-13T14:15:00Z", source_url: "https://consumeraffairs.nic.in/dcdrc-chennai/cases" },
      { field: "Orders uploaded", value: "2 orders (Notice + Interim Order)", source: "COMMISSION_SITE", scraped_at: "2025-02-12T20:10:00Z", source_url: "https://consumeraffairs.nic.in/dcdrc-chennai/orders/00142" },
    ]
    setScrapeRecords(scrapeRecords)

    // ── Change log ────────────────────────────────────────────────────────────
    setChangeLog([
      { id: "cl1", field: "Next hearing date", old_value: "Not scheduled", new_value: "15 January 2025 · 10:30 AM", detected_at: "2025-01-10T09:00:00Z", source: "EDAAKHIL" },
      { id: "cl2", field: "Case status", old_value: "Filed", new_value: "Hearing Scheduled", detected_at: "2025-01-10T09:00:00Z", source: "EDAAKHIL" },
      { id: "cl3", field: "Orders uploaded", old_value: "No orders", new_value: "2 orders (Notice + Interim Order)", detected_at: "2025-02-12T20:10:00Z", source: "COMMISSION_SITE" },
    ])

    router.push("/dashboard")
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="login-mobile" className="mb-1.5 block text-sm font-semibold text-ink-900">
          Mobile number
        </label>
        <div className="flex items-center rounded-md border border-softborder bg-card focus-within:border-ink-800 focus-within:ring-2 focus-within:ring-ink-900/10">
          <span className="border-r border-softborder px-3 py-2.5 text-sm font-semibold text-ink-700">+91</span>
          <input
            id="login-mobile" inputMode="numeric" autoComplete="tel-national"
            placeholder="9876543210" value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="w-full bg-transparent px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-ink-900">Password</label>
        <input id="login-password" type="password" autoComplete="current-password"
          placeholder="Your password" value={password}
          onChange={(e) => setPassword(e.target.value)} className={inp} />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-danger-ink">
          <AlertCircle className="h-3 w-3 shrink-0" />{error}
        </p>
      )}
      <button type="submit" disabled={submitting}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60">
        {submitting
          ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
          : <><KeyRound className="h-4 w-4" />Sign in<ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Session secured via httpOnly JWT cookies (15 min access / 7 day refresh)
      </p>
    </form>
  )
}
