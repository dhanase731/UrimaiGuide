// Shared case domain model — mirrors backend CaseResponse contract.

export type CaseStatus =
  | "INTAKE"
  | "NLP_CLASSIFICATION"
  | "AI_INTERVIEW"
  | "ELIGIBILITY_CHECK"
  | "JURISDICTION_ROUTING"
  | "DOCUMENT_GENERATION"
  | "FILING_READY"
  | "FILED"
  | "HEARING_SCHEDULED"
  | "ORDER_ISSUED"
  | "COMPLIANCE_PENDING"
  | "CLOSED"

export type ForumType = "DISTRICT" | "STATE" | "NATIONAL" | "ONLINE_MEDIATION"

export interface CaseSummary {
  case_id: string
  case_number: string
  status: CaseStatus
  forum: ForumType
  respondent_name: string
  complaint_category: string
  relief_sought_inr: number
  filed_date: string | null
  next_hearing_date: string | null
  next_step: string
}

export interface TimelineEvent {
  event_id: string
  timestamp: string
  status: CaseStatus
  label: string
  actor: "SYSTEM" | "USER" | "COURT"
  note: string | null
}

export const MOCK_CASE: CaseSummary = {
  case_id: "3f9a2c7e-1b84-4d52-9a6f-77c0e2d81a45",
  case_number: "CC/TN/CHN/2024/00142",
  status: "FILING_READY",
  forum: "DISTRICT",
  respondent_name: "QuickMart Electronics Pvt. Ltd.",
  complaint_category: "DEFECTIVE_GOODS",
  relief_sought_inr: 45000,
  filed_date: null,
  next_hearing_date: null,
  next_step: "REVIEW_AND_FILE",
}

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    event_id: "e1",
    timestamp: "2024-11-01T09:12:00Z",
    status: "INTAKE",
    label: "Problem described",
    actor: "USER",
    note: "Defective phone — seller refuses repair or refund.",
  },
  {
    event_id: "e2",
    timestamp: "2024-11-01T09:12:45Z",
    status: "NLP_CLASSIFICATION",
    label: "AI classified complaint",
    actor: "SYSTEM",
    note: "Category: DEFECTIVE_GOODS · Confidence: 0.97",
  },
  {
    event_id: "e3",
    timestamp: "2024-11-01T09:18:00Z",
    status: "AI_INTERVIEW",
    label: "AI interview completed",
    actor: "USER",
    note: "12 questions answered. Relief sought: ₹45,000.",
  },
  {
    event_id: "e4",
    timestamp: "2024-11-01T09:19:10Z",
    status: "ELIGIBILITY_CHECK",
    label: "Eligibility confirmed",
    actor: "SYSTEM",
    note: "Within 2-year limitation. Complaint value ≤ ₹50L → District Forum.",
  },
  {
    event_id: "e5",
    timestamp: "2024-11-01T09:19:30Z",
    status: "JURISDICTION_ROUTING",
    label: "Jurisdiction assigned",
    actor: "SYSTEM",
    note: "District Consumer Disputes Redressal Commission, Chennai.",
  },
  {
    event_id: "e6",
    timestamp: "2024-11-01T09:22:00Z",
    status: "DOCUMENT_GENERATION",
    label: "Documents generated",
    actor: "SYSTEM",
    note: "Complaint petition, affidavit, and evidence index ready.",
  },
  {
    event_id: "e7",
    timestamp: "2024-11-01T09:25:00Z",
    status: "FILING_READY",
    label: "Ready to file",
    actor: "SYSTEM",
    note: "All documents verified. Awaiting citizen e-filing confirmation.",
  },
]

export const STATUS_LABELS: Record<CaseStatus, string> = {
  INTAKE: "Intake",
  NLP_CLASSIFICATION: "AI Classification",
  AI_INTERVIEW: "AI Interview",
  ELIGIBILITY_CHECK: "Eligibility Check",
  JURISDICTION_ROUTING: "Jurisdiction",
  DOCUMENT_GENERATION: "Documents",
  FILING_READY: "Ready to File",
  FILED: "Filed",
  HEARING_SCHEDULED: "Hearing Scheduled",
  ORDER_ISSUED: "Order Issued",
  COMPLIANCE_PENDING: "Compliance Pending",
  CLOSED: "Closed",
}
