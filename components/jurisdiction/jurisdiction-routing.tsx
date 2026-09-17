"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, ArrowRight, Loader2, Building2, Scale, Info, ExternalLink } from "lucide-react"
import { useCaseContext } from "@/lib/case-context"

// ── Commission database keyed by state ────────────────────────────────────────
// In production this comes from the backend /api/v1/jurisdiction/route endpoint.

interface CommissionRecord {
  full_name: string
  address: string
  city: string
  phone: string
  hours: string
  scrape_url: string
  edaakhil_url: string
}

const DCDRC_BY_STATE: Record<string, CommissionRecord> = {
  "Tamil Nadu": {
    full_name: "District Consumer Disputes Redressal Commission, Chennai",
    address: "Singaravelar Maligai, Rajaji Salai, Chennai – 600 001",
    city: "Chennai",
    phone: "+91 44 2534 0000",
    hours: "Mon–Fri  10:30 AM – 5:00 PM",
    scrape_url: "https://consumeraffairs.nic.in/dcdrc-chennai",
    edaakhil_url: "https://edaakhil.nic.in",
  },
  "Maharashtra": {
    full_name: "District Consumer Disputes Redressal Commission, Mumbai",
    address: "Bandra Kurla Complex, Mumbai – 400 051",
    city: "Mumbai",
    phone: "+91 22 2659 0000",
    hours: "Mon–Fri  10:30 AM – 5:00 PM",
    scrape_url: "https://consumeraffairs.nic.in/dcdrc-mumbai",
    edaakhil_url: "https://edaakhil.nic.in",
  },
  "Karnataka": {
    full_name: "District Consumer Disputes Redressal Commission, Bengaluru",
    address: "Cauvery Bhavan, K.G. Road, Bengaluru – 560 009",
    city: "Bengaluru",
    phone: "+91 80 2235 0000",
    hours: "Mon–Fri  10:30 AM – 5:00 PM",
    scrape_url: "https://consumeraffairs.nic.in/dcdrc-bengaluru",
    edaakhil_url: "https://edaakhil.nic.in",
  },
  "Delhi": {
    full_name: "District Consumer Disputes Redressal Commission, New Delhi",
    address: "Kasturba Gandhi Marg, New Delhi – 110 001",
    city: "New Delhi",
    phone: "+91 11 2338 0000",
    hours: "Mon–Fri  10:30 AM – 5:00 PM",
    scrape_url: "https://consumeraffairs.nic.in/dcdrc-delhi",
    edaakhil_url: "https://edaakhil.nic.in",
  },
}

const SCDRC_BY_STATE: Record<string, CommissionRecord> = {
  "Tamil Nadu": {
    full_name: "Tamil Nadu State Consumer Disputes Redressal Commission",
    address: "High Court Buildings, Chennai – 600 104",
    city: "Chennai",
    phone: "+91 44 2534 1111",
    hours: "Mon–Fri  10:30 AM – 5:00 PM",
    scrape_url: "https://consumeraffairs.nic.in/scdrc-tamilnadu",
    edaakhil_url: "https://edaakhil.nic.in",
  },
  "Maharashtra": {
    full_name: "Maharashtra State Consumer Disputes Redressal Commission",
    address: "New Administrative Building, Mumbai – 400 032",
    city: "Mumbai",
    phone: "+91 22 2202 0000",
    hours: "Mon–Fri  10:30 AM – 5:00 PM",
    scrape_url: "https://consumeraffairs.nic.in/scdrc-maharashtra",
    edaakhil_url: "https://edaakhil.nic.in",
  },
}

const NCDRC: CommissionRecord = {
  full_name: "National Consumer Disputes Redressal Commission",
  address: "Upbhokta Nyay Bhawan, F-Block, GPO Complex, INA, New Delhi – 110 023",
  city: "New Delhi",
  phone: "+91 11 2465 0000",
  hours: "Mon–Fri  10:30 AM – 5:00 PM",
  scrape_url: "https://ncdrc.nic.in",
  edaakhil_url: "https://edaakhil.nic.in",
}

function getFallback(state: string, db: Record<string, CommissionRecord>, fallback: CommissionRecord): CommissionRecord {
  return db[state] ?? fallback
}

// ── Court fee table (Section 62, CPA 2019) ────────────────────────────────────
function computeCourtFee(amount: number): { fee: number; free: boolean } {
  if (amount <= 500000) return { fee: 200, free: false }
  if (amount <= 1000000) return { fee: 400, free: false }
  if (amount <= 2000000) return { fee: 500, free: false }
  if (amount <= 5000000) return { fee: 2000, free: false }
  return { fee: 4000, free: false }
}

export function JurisdictionRouting() {
  const router = useRouter()
  const { caseData, user, setCaseData, addTimelineEvent } = useCaseContext()
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const txAmount = caseData.transaction_amount || 0
  const state = user.state || "Tamil Nadu"

  // Determine forum tier
  let tier: "DCDRC" | "SCDRC" | "NCDRC" = "DCDRC"
  let pecuniarySection = "Section 34, CPA 2019"
  let pecuniaryLimit = "Up to ₹50 lakh"
  if (txAmount > 20000000) {
    tier = "NCDRC"; pecuniarySection = "Section 58, CPA 2019"; pecuniaryLimit = "Above ₹2 crore"
  } else if (txAmount > 5000000) {
    tier = "SCDRC"; pecuniarySection = "Section 47, CPA 2019"; pecuniaryLimit = "₹50 lakh – ₹2 crore"
  }

  const assignedRecord: CommissionRecord =
    tier === "NCDRC" ? NCDRC
    : tier === "SCDRC" ? getFallback(state, SCDRC_BY_STATE, NCDRC)
    : getFallback(state, DCDRC_BY_STATE, {
        full_name: `District Consumer Disputes Redressal Commission, ${user.district || state}`,
        address: `${user.district || state} – ${user.pincode || ""}`,
        city: user.district || state,
        phone: "Contact local commission",
        hours: "Mon–Fri  10:30 AM – 5:00 PM",
        scrape_url: "https://consumeraffairs.nic.in",
        edaakhil_url: "https://edaakhil.nic.in",
      })

  const { fee, free } = computeCourtFee(txAmount)

  const territorialBasis = `Complainant's residence in ${user.district || state} + purchase value ₹${txAmount.toLocaleString("en-IN")} (${pecuniarySection})`

  const FORUMS = [
    {
      type: "DISTRICT",
      name: getFallback(state, DCDRC_BY_STATE, { ...assignedRecord, full_name: `DCDRC, ${state}` }).full_name,
      address: getFallback(state, DCDRC_BY_STATE, assignedRecord).address,
      pecuniary_limit: "Up to ₹50 lakh",
      assigned: tier === "DCDRC",
    },
    {
      type: "STATE",
      name: getFallback(state, SCDRC_BY_STATE, { ...NCDRC, full_name: `SCDRC, ${state}` }).full_name,
      address: getFallback(state, SCDRC_BY_STATE, NCDRC).address,
      pecuniary_limit: "₹50 lakh – ₹2 crore",
      assigned: tier === "SCDRC",
    },
    {
      type: "NATIONAL",
      name: NCDRC.full_name,
      address: NCDRC.address,
      pecuniary_limit: "Above ₹2 crore",
      assigned: tier === "NCDRC",
    },
  ]

  async function handleConfirm() {
    setConfirmed(true)
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))

    setCaseData({
      status: "DOCUMENT_GENERATION",
      progress_percentage: 60,
      recommended_commission: tier,
      commission_full_name: assignedRecord.full_name,
      commission_address: assignedRecord.address,
      commission_city: assignedRecord.city,
      commission_phone: assignedRecord.phone,
      commission_hours: assignedRecord.hours,
      commission_scrape_url: assignedRecord.scrape_url,
      court_fee_amount: fee,
      court_fee_free: free,
      territorial_basis: territorialBasis,
      pecuniary_section: pecuniarySection,
    })

    addTimelineEvent({
      event_id: `e-jurisdiction-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Jurisdiction assigned",
      actor: "SYSTEM",
      note: `${assignedRecord.full_name}. Court fee: ₹${fee}.`,
    })

    setSubmitting(false)
    router.push("/documents")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Assigned forum highlight */}
      <section className="rounded-xl border border-forest/30 bg-forest-soft p-5 md:p-6">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest">Assigned forum</p>
            <p className="mt-1 font-serif text-lg font-bold text-ink-900">{assignedRecord.full_name}</p>
            <p className="mt-1 text-sm text-ink-700">{assignedRecord.address}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-forest/20 bg-card px-2.5 py-1 text-xs font-semibold text-forest">
                Filing fee: ₹{fee}
              </span>
              <span className="rounded-md border border-forest/20 bg-card px-2.5 py-1 text-xs font-semibold text-forest">
                {assignedRecord.hours}
              </span>
              <a
                href={assignedRecord.edaakhil_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-forest/20 bg-card px-2.5 py-1 text-xs font-semibold text-forest hover:bg-forest-soft"
              >
                eDaakhil portal <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Jurisdiction basis */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-ink/30 bg-amber-soft p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
        <p className="text-xs leading-relaxed text-ink-800">
          <span className="font-semibold">Jurisdiction basis: </span>
          {territorialBasis}
        </p>
      </div>

      {/* All forums */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-5 font-serif text-lg font-bold text-ink-900">Consumer forum hierarchy</h2>
        <div className="flex flex-col gap-4">
          {FORUMS.map((forum) => (
            <div
              key={forum.type}
              className={`rounded-lg border p-4 ${forum.assigned ? "border-ink-900 bg-bluesoft" : "border-softborder bg-card opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {forum.type === "DISTRICT"
                    ? <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
                    : <Scale className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{forum.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{forum.address}</p>
                    <p className="mt-1 text-xs font-medium text-ink-700">{forum.pecuniary_limit}</p>
                  </div>
                </div>
                {forum.assigned && (
                  <span className="shrink-0 rounded-md bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-parchment">
                    ASSIGNED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={handleConfirm}
        disabled={confirmed || submitting}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
      >
        {submitting
          ? <><Loader2 className="h-4 w-4 animate-spin" />Generating documents…</>
          : <>Confirm jurisdiction & generate documents <ArrowRight className="h-4 w-4" /></>}
      </button>
    </div>
  )
}
