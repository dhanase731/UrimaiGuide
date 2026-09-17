"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { PreferredLanguage } from "@/lib/registration"

// ─── Types ────────────────────────────────────────────────────────────────────

export type CaseStatus =
  | "INTAKE" | "NLP_CLASSIFICATION" | "AI_INTERVIEW" | "ELIGIBILITY_CHECK"
  | "JURISDICTION_ROUTING" | "DOCUMENT_GENERATION" | "FILING_READY"
  | "FILED" | "HEARING_SCHEDULED" | "ORDER_ISSUED" | "COMPLIANCE_PENDING" | "CLOSED"

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE"
export type TaskType = "DOCUMENT" | "HEARING" | "PAYMENT" | "FILING" | "COMPLIANCE" | "CUSTOM"
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW"
export type TaskSource = "MANUAL" | "AUTO_ORDER" | "AUTO_HEARING" | "AUTO_COMPLIANCE" | "AUTO_FILING"
export type ScrapeSource = "EDAAKHIL" | "COMMISSION_SITE" | "MANUAL"

export interface UserProfile {
  user_id: string
  full_name: string
  mobile_number: string
  email: string
  state: string
  district: string
  pincode: string
  preferred_language: PreferredLanguage
  is_nri: boolean
  nri_country: string
  google_connected: boolean
  fcm_enabled: boolean
  notifications: { whatsapp: boolean; sms: boolean; push: boolean }
}

export interface CaseData {
  case_id: string
  case_number: string
  status: CaseStatus
  progress_percentage: number
  // Intake
  raw_problem_description: string
  input_language: PreferredLanguage
  input_mode: "TEXT" | "VOICE"
  // NLP
  primary_case_type: string
  primary_case_type_label: string
  confidence_score: number
  sub_category: string
  sector: string
  opposite_party_type: string
  is_consumer_case: boolean
  // Interview
  product_service: string
  opposite_party_name: string
  opposite_party_city: string
  opposite_party_state: string
  purchase_date: string
  transaction_amount: number
  compensation_sought: number
  incident_date: string
  defect_description: string
  legal_notice_sent: boolean
  company_response: string
  purchase_purpose: string
  is_resale: boolean
  relief_sought: string
  evidence_available: string
  case_specific_data: Record<string, unknown>
  // Eligibility
  is_eligible: boolean
  eligibility_status: string
  filing_deadline: string
  days_remaining: number
  limitation_status: "SAFE" | "WARNING" | "CRITICAL" | "EXPIRED"
  condonation_required: boolean
  overall_recommendation: string
  ombudsman_applicable: boolean
  ombudsman_type: string | null
  // Jurisdiction
  recommended_commission: "DCDRC" | "SCDRC" | "NCDRC"
  commission_full_name: string
  commission_address: string
  commission_city: string
  commission_phone: string
  commission_hours: string
  commission_scrape_url: string
  court_fee_amount: number
  court_fee_free: boolean
  territorial_basis: string
  pecuniary_section: string
  // Documents
  evidence_strength_score: number
  risk_level: "LOW" | "MEDIUM" | "HIGH"
  can_proceed_to_filing: boolean
  // Filing
  ejagriti_case_number: string
  filing_date: string
  tracking_activated: boolean
  acknowledgement_number: string
  // Post-filing
  current_stage: string
  next_hearing_date: string
  next_hearing_time: string
  next_hearing_venue: string
  last_synced_at: string
  // Complaint
  complaint_text_en: string
  complaint_text_ta: string
  sections_cited: string[]
  total_claim_amount: number
}

export interface DocumentSlot {
  doc_id: string
  document_key: string
  document_name: string
  is_mandatory: boolean
  upload_status: "PENDING" | "UPLOADING" | "VERIFIED" | "BLURRY" | "MISMATCH" | "UNREADABLE"
  ocr_confidence: number | null
  detected_type: string | null
  how_to_obtain: string
  office_type_needed: string
  quality_issues: string[]
  file_name: string | null
}

export interface Task {
  task_id: string
  title: string
  description: string
  deadline: string
  task_type: TaskType
  priority: TaskPriority
  status: TaskStatus
  source: TaskSource
  days_until_deadline: number
  reminder_active: boolean
}

export interface Hearing {
  hearing_id: string
  date: string
  time: string
  label: string
  status: "SCHEDULED" | "PENDING" | "COMPLETED" | "ADJOURNED"
  notes: string
  source: ScrapeSource
  scraped_at: string
}

export interface CourtOrder {
  order_id: string
  order_date: string
  order_type: "INTERIM" | "FINAL" | "NOTICE" | "ADMISSION" | "EX_PARTE"
  order_number: string
  title: string
  plain_summary_en: string
  plain_summary_ta: string
  outcome: "FAVORABLE" | "UNFAVORABLE" | "NEUTRAL" | "REQUIRES_ACTION"
  outcome_explanation: string
  deadlines: Array<{ action: string; calculated_deadline: string; responsible_party: string }>
  amounts_ordered: Array<{ type: string; amount: number; compliance_days: number }>
  next_hearing_date: string | null
  audio_available: boolean
  source: ScrapeSource
  scraped_at: string
  source_url: string
  pdf_url: string | null
  is_new: boolean
}

export interface ComplianceRecord {
  compliance_id: string
  amount_ordered: number
  compliance_deadline: string
  amount_received: number
  status: "PENDING" | "PARTIAL" | "COMPLIED" | "DEFAULTED"
  days_remaining: number
  op_appeal_deadline: string
  directions: Array<{ id: string; direction: string; deadline: string; status: "PENDING" | "COMPLIED" | "DEFAULTED" }>
}

export interface Notification {
  notification_id: string
  notification_type: string
  channel: "WHATSAPP" | "SMS" | "PUSH"
  message: string
  delivery_status: "SENT" | "DELIVERED" | "FAILED" | "PENDING"
  sent_at: string
}

export interface TimelineEvent {
  event_id: string
  timestamp: string
  label: string
  actor: "SYSTEM" | "USER" | "COURT"
  note: string | null
}

export interface ScrapeRecord {
  field: string
  value: string
  source: ScrapeSource
  scraped_at: string
  source_url: string
}

export interface ChangeLogEntry {
  id: string
  field: string
  old_value: string
  new_value: string
  detected_at: string
  source: ScrapeSource
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_USER: UserProfile = {
  user_id: "", full_name: "", mobile_number: "", email: "",
  state: "", district: "", pincode: "", preferred_language: "ENGLISH",
  is_nri: false, nri_country: "", google_connected: false, fcm_enabled: false,
  notifications: { whatsapp: true, sms: true, push: true },
}

const DEFAULT_CASE: CaseData = {
  case_id: "", case_number: "", status: "INTAKE", progress_percentage: 0,
  raw_problem_description: "", input_language: "ENGLISH", input_mode: "TEXT",
  primary_case_type: "", primary_case_type_label: "", confidence_score: 0,
  sub_category: "", sector: "", opposite_party_type: "", is_consumer_case: true,
  product_service: "", opposite_party_name: "", opposite_party_city: "", opposite_party_state: "",
  purchase_date: "", transaction_amount: 0, compensation_sought: 0, incident_date: "",
  defect_description: "", legal_notice_sent: false, company_response: "",
  purchase_purpose: "PERSONAL_USE", is_resale: false, relief_sought: "", evidence_available: "",
  case_specific_data: {},
  is_eligible: false, eligibility_status: "", filing_deadline: "",
  days_remaining: 730, limitation_status: "SAFE", condonation_required: false,
  overall_recommendation: "", ombudsman_applicable: false, ombudsman_type: null,
  recommended_commission: "DCDRC", commission_full_name: "", commission_address: "",
  commission_city: "", commission_phone: "", commission_hours: "", commission_scrape_url: "",
  court_fee_amount: 0, court_fee_free: true, territorial_basis: "", pecuniary_section: "",
  evidence_strength_score: 0, risk_level: "HIGH", can_proceed_to_filing: false,
  ejagriti_case_number: "", filing_date: "", tracking_activated: false, acknowledgement_number: "",
  current_stage: "", next_hearing_date: "", next_hearing_time: "", next_hearing_venue: "",
  last_synced_at: "",
  complaint_text_en: "", complaint_text_ta: "", sections_cited: [], total_claim_amount: 0,
}

// ─── Context interface ─────────────────────────────────────────────────────────

interface CaseContextValue {
  user: UserProfile
  setUser: (u: Partial<UserProfile>) => void
  isAuthenticated: boolean
  setAuthenticated: (v: boolean) => void

  caseData: CaseData
  setCaseData: (d: Partial<CaseData>) => void

  documents: DocumentSlot[]
  setDocuments: (docs: DocumentSlot[]) => void
  updateDocument: (doc_id: string, updates: Partial<DocumentSlot>) => void

  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (task_id: string, updates: Partial<Task>) => void

  hearings: Hearing[]
  setHearings: (h: Hearing[]) => void
  addHearing: (h: Hearing) => void

  orders: CourtOrder[]
  setOrders: (orders: CourtOrder[]) => void
  addOrder: (order: CourtOrder) => void
  updateOrder: (order_id: string, updates: Partial<CourtOrder>) => void

  compliance: ComplianceRecord | null
  setCompliance: (c: ComplianceRecord | null) => void

  notifications: Notification[]
  setNotifications: (n: Notification[]) => void
  addNotification: (n: Notification) => void

  timeline: TimelineEvent[]
  setTimeline: (t: TimelineEvent[]) => void
  addTimelineEvent: (e: TimelineEvent) => void

  scrapeRecords: ScrapeRecord[]
  setScrapeRecords: (r: ScrapeRecord[]) => void

  changeLog: ChangeLogEntry[]
  setChangeLog: (c: ChangeLogEntry[]) => void
  addChangeLogEntry: (e: ChangeLogEntry) => void

  reset: () => void
}

const CaseContext = createContext<CaseContextValue | null>(null)

export function CaseProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile>(DEFAULT_USER)
  const [isAuthenticated, setAuthenticated] = useState(false)
  const [caseData, setCaseState] = useState<CaseData>(DEFAULT_CASE)
  const [documents, setDocuments] = useState<DocumentSlot[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [hearings, setHearings] = useState<Hearing[]>([])
  const [orders, setOrdersState] = useState<CourtOrder[]>([])
  const [compliance, setCompliance] = useState<ComplianceRecord | null>(null)
  const [notifications, setNotificationsState] = useState<Notification[]>([])
  const [timeline, setTimelineState] = useState<TimelineEvent[]>([])
  const [scrapeRecords, setScrapeRecords] = useState<ScrapeRecord[]>([])
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([])

  const setUser = useCallback((u: Partial<UserProfile>) =>
    setUserState((prev) => ({ ...prev, ...u })), [])

  const setCaseData = useCallback((d: Partial<CaseData>) =>
    setCaseState((prev) => ({ ...prev, ...d })), [])

  const updateDocument = useCallback((doc_id: string, updates: Partial<DocumentSlot>) =>
    setDocuments((prev) => prev.map((d) => d.doc_id === doc_id ? { ...d, ...updates } : d)), [])

  const addTask = useCallback((task: Task) =>
    setTasks((prev) => [...prev, task]), [])

  const updateTask = useCallback((task_id: string, updates: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => t.task_id === task_id ? { ...t, ...updates } : t)), [])

  const addHearing = useCallback((h: Hearing) =>
    setHearings((prev) => [...prev, h]), [])

  const setOrders = useCallback((orders: CourtOrder[]) =>
    setOrdersState(orders), [])

  const addOrder = useCallback((order: CourtOrder) =>
    setOrdersState((prev) => [...prev, order]), [])

  const updateOrder = useCallback((order_id: string, updates: Partial<CourtOrder>) =>
    setOrdersState((prev) => prev.map((o) => o.order_id === order_id ? { ...o, ...updates } : o)), [])

  const setNotifications = useCallback((n: Notification[]) =>
    setNotificationsState(n), [])

  const addNotification = useCallback((n: Notification) =>
    setNotificationsState((prev) => [n, ...prev]), [])

  const setTimeline = useCallback((t: TimelineEvent[]) =>
    setTimelineState(t), [])

  const addTimelineEvent = useCallback((e: TimelineEvent) =>
    setTimelineState((prev) => [...prev, e]), [])

  const addChangeLogEntry = useCallback((e: ChangeLogEntry) =>
    setChangeLog((prev) => [e, ...prev]), [])

  const reset = useCallback(() => {
    setUserState(DEFAULT_USER)
    setAuthenticated(false)
    setCaseState(DEFAULT_CASE)
    setDocuments([])
    setTasks([])
    setHearings([])
    setOrdersState([])
    setCompliance(null)
    setNotificationsState([])
    setTimelineState([])
    setScrapeRecords([])
    setChangeLog([])
  }, [])

  return (
    <CaseContext.Provider value={{
      user, setUser, isAuthenticated, setAuthenticated,
      caseData, setCaseData,
      documents, setDocuments, updateDocument,
      tasks, setTasks, addTask, updateTask,
      hearings, setHearings, addHearing,
      orders, setOrders, addOrder, updateOrder,
      compliance, setCompliance,
      notifications, setNotifications, addNotification,
      timeline, setTimeline, addTimelineEvent,
      scrapeRecords, setScrapeRecords,
      changeLog, setChangeLog, addChangeLogEntry,
      reset,
    }}>
      {children}
    </CaseContext.Provider>
  )
}

export function useCaseContext() {
  const ctx = useContext(CaseContext)
  if (!ctx) throw new Error("useCaseContext must be used inside CaseProvider")
  return ctx
}
