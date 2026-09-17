"use client"

import { useState } from "react"
import { Download, CheckSquare, Square, BookOpen, HelpCircle, Shield, Clock, MapPin } from "lucide-react"
import { useCaseContext } from "@/lib/case-context"

type Tab = "documents" | "statement" | "questions" | "rebuttals"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "documents", label: "Documents to carry", icon: CheckSquare },
  { id: "statement", label: "Opening statement", icon: BookOpen },
  { id: "questions", label: "Judge's questions", icon: HelpCircle },
  { id: "rebuttals", label: "Opposing counsel", icon: Shield },
]

export function HearingPrepView() {
  const { caseData, user, hearings } = useCaseContext()
  const [activeTab, setActiveTab] = useState<Tab>("documents")
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const nextHearing = hearings.find((h) => h.status === "SCHEDULED") ?? hearings[0]
  const hearingDateLabel = nextHearing
    ? new Date(nextHearing.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : caseData.next_hearing_date
      ? new Date(caseData.next_hearing_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : "Date to be confirmed"
  const hearingTime = nextHearing?.time ?? caseData.next_hearing_time ?? "10:30 AM"
  const hearingVenue = caseData.next_hearing_venue || caseData.commission_full_name || "Consumer Commission"

  const complainantName = user.full_name || "the complainant"
  const opName = caseData.opposite_party_name || "the opposite party"
  const product = caseData.product_service || "the product/service"
  const amount = caseData.transaction_amount > 0 ? `₹${caseData.transaction_amount.toLocaleString("en-IN")}` : "the purchase amount"
  const purchaseDate = caseData.purchase_date || "the purchase date"
  const defect = caseData.defect_description || "the defect described in the complaint"
  const relief = caseData.relief_sought || `refund of ${amount} with interest and compensation`

  const DOCUMENTS = [
    { id: "d1", label: `Purchase invoice for ${product} (original + 3 copies)`, verified: true },
    { id: "d2", label: "Notarised affidavit (signed before Notary Public)", verified: true },
    { id: "d3", label: "Manufacturer warranty card / service record", verified: true },
    { id: "d4", label: "Legal notice sent to company + acknowledgement", verified: true },
    { id: "d5", label: "WhatsApp / email screenshots of seller's refusal", verified: !!(caseData.company_response) },
  ]

  const JUDGE_QA = [
    {
      q: "When exactly did the defect appear?",
      a: `${defect}. The invoice confirms the purchase date as ${purchaseDate}.`,
    },
    {
      q: "Did you give the seller a chance to repair or replace?",
      a: `Yes. I contacted ${opName}. Their response: "${caseData.company_response || "They refused to act"}". I have documentary proof.`,
    },
    {
      q: "What specific relief are you seeking?",
      a: `${relief}.`,
    },
  ]

  const REBUTTALS = [
    {
      argument: "Customer misused the product after delivery.",
      rebuttal: `Invoice proves the defect was reported shortly after purchase. Under Section 2(10) CPA 2019, the burden of proving misuse lies with the seller.`,
    },
    {
      argument: "The warranty covers only manufacturing defects, not user damage.",
      rebuttal: `The defect — ${defect} — is a manufacturing defect. The seller has not produced any inspection report to prove otherwise.`,
    },
    {
      argument: "The complaint is time-barred.",
      rebuttal: `Cause of action arose on ${purchaseDate}. This complaint is filed well within the 2-year limitation under Section 69 CPA 2019.${caseData.filing_deadline ? ` Filing deadline: ${caseData.filing_deadline}.` : ""}`,
    },
  ]

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hearing notice */}
      <div className="rounded-xl border border-amber-ink/30 bg-amber-soft p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-ink" />
            <div>
              <p className="font-serif text-base font-bold text-ink-900">
                {nextHearing ? "Upcoming hearing" : "Hearing date pending"}
              </p>
              <p className="mt-0.5 text-sm text-ink-800">{hearingDateLabel} · {hearingTime}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm text-ink-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
            <span>{hearingVenue}</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-softborder bg-card p-1" role="tablist">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              activeTab === tab.id ? "bg-ink-900 text-parchment" : "text-ink-700 hover:bg-bluesoft"
            }`}>
            <tab.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Documents */}
      {activeTab === "documents" && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <h2 className="mb-1 font-serif text-lg font-bold text-ink-900">Documents to carry</h2>
          <p className="mb-5 text-sm text-ink-700">Print and bring all verified documents. Tick each as you pack.</p>
          <div className="flex flex-col gap-3">
            {DOCUMENTS.map((doc) => (
              <button key={doc.id} type="button" onClick={() => toggle(doc.id)}
                className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                  checked[doc.id] ? "border-forest/30 bg-forest-soft" : "border-softborder bg-card hover:bg-bluesoft/40"
                }`}>
                {checked[doc.id]
                  ? <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                  : <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className={`text-sm font-medium ${checked[doc.id] ? "text-forest line-through" : "text-ink-900"}`}>
                  {doc.label}
                </span>
                {!doc.verified && (
                  <span className="ml-auto shrink-0 rounded-md border border-amber-ink/30 bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-amber-ink">
                    PENDING
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Opening statement */}
      {activeTab === "statement" && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <h2 className="mb-1 font-serif text-lg font-bold text-ink-900">Opening statement</h2>
          <p className="mb-5 text-sm text-ink-700">Read this aloud when the President asks you to introduce your case.</p>
          <div className="rounded-lg border border-ink-900/10 bg-bluesoft p-5">
            <p className="font-serif text-sm leading-loose text-ink-900">
              &ldquo;Honourable President and Members of this Commission, I am {complainantName}, the complainant
              in this matter. I appear in person as a self-represented litigant.
            </p>
            <p className="mt-3 font-serif text-sm leading-loose text-ink-900">
              On {purchaseDate}, I purchased {product} from {opName} for {amount}.
              {caseData.defect_description ? ` ${caseData.defect_description}.` : ""}
              {caseData.company_response
                ? ` Despite my request for remedy, ${opName} responded: &ldquo;${caseData.company_response}&rdquo;.`
                : ""}
            </p>
            <p className="mt-3 font-serif text-sm leading-loose text-ink-900">
              I respectfully pray that this Commission direct the opposite party to: {relief}.&rdquo;
            </p>
          </div>
          {user.preferred_language === "TAMIL" && (
            <p className="mt-3 text-xs text-muted-foreground">
              தமிழ் மொழி பதிப்பு: உரிமை ஆப்பில் தமிழ் மொழி தேர்வு செய்யவும்.
            </p>
          )}
        </section>
      )}

      {/* Tab: Judge's questions */}
      {activeTab === "questions" && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <h2 className="mb-1 font-serif text-lg font-bold text-ink-900">Likely questions from the bench</h2>
          <p className="mb-5 text-sm text-ink-700">Practise your answers before the hearing.</p>
          <div className="flex flex-col gap-4">
            {JUDGE_QA.map((item, i) => (
              <div key={i} className="rounded-lg border border-softborder p-4">
                <p className="text-sm font-semibold text-ink-900">
                  <span className="mr-2 font-mono text-xs text-amber-ink">Q{i + 1}</span>{item.q}
                </p>
                <p className="mt-2 rounded-md bg-forest-soft px-3 py-2 text-sm text-ink-800">
                  <span className="mr-1 font-semibold text-forest">A:</span>{item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Rebuttals */}
      {activeTab === "rebuttals" && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <h2 className="mb-1 font-serif text-lg font-bold text-ink-900">Opposing counsel counters</h2>
          <p className="mb-5 text-sm text-ink-700">
            The opposite party&apos;s lawyer may raise these arguments. Here is your statutory rebuttal for each.
          </p>
          <div className="flex flex-col gap-4">
            {REBUTTALS.map((item, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-softborder">
                <div className="border-b border-softborder bg-red-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-danger-ink">Lawyer&apos;s argument</p>
                  <p className="mt-1 text-sm text-ink-900">{item.argument}</p>
                </div>
                <div className="bg-forest-soft px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest">Your rebuttal</p>
                  <p className="mt-1 text-sm text-ink-800">{item.rebuttal}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <button type="button"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-ink-900 px-6 py-3 text-sm font-bold text-ink-900 transition-colors hover:bg-ink-900 hover:text-parchment">
        <Download className="h-4 w-4" />
        Download offline hearing cheat-sheet (.PDF)
      </button>
    </div>
  )
}
