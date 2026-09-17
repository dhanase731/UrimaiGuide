"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, CheckCircle2, MessageSquare } from "lucide-react"
import { useCaseContext } from "@/lib/case-context"

interface Question {
  id: string
  text: string
  field: string
  placeholder: string
  inputType?: "text" | "number" | "date"
}

const QUESTIONS: Question[] = [
  { id: "q1", text: "What product or service did you purchase?", field: "product_service", placeholder: "e.g. Samsung Galaxy S23 smartphone" },
  { id: "q2", text: "From which seller or company did you buy it?", field: "opposite_party_name", placeholder: "e.g. QuickMart Electronics Pvt. Ltd." },
  { id: "q3", text: "When did you make the purchase? (DD/MM/YYYY)", field: "purchase_date", placeholder: "e.g. 15/09/2024" },
  { id: "q4", text: "How much did you pay? (in ₹)", field: "transaction_amount", placeholder: "e.g. 45000", inputType: "number" },
  { id: "q5", text: "What exactly went wrong?", field: "defect_description", placeholder: "e.g. Screen stopped working after 10 days" },
  { id: "q6", text: "Did you contact the seller or company? What was their response?", field: "company_response", placeholder: "e.g. They refused to repair or refund" },
  { id: "q7", text: "What relief are you seeking? (refund, replacement, compensation)", field: "relief_sought", placeholder: "e.g. Full refund of ₹45,000 and ₹5,000 compensation" },
  { id: "q8", text: "Do you have any supporting documents? (bills, emails, photos)", field: "evidence_available", placeholder: "e.g. Purchase invoice, WhatsApp chat screenshots" },
]

export function InterviewForm() {
  const router = useRouter()
  const { caseData, setCaseData, addTimelineEvent } = useCaseContext()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const q = QUESTIONS[current]
  const answered = Object.keys(answers).length
  const progress = Math.round((answered / QUESTIONS.length) * 100)

  function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    const val = answers[q.field]?.trim()
    if (!val) return
    if (current < QUESTIONS.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      setDone(true)
    }
  }

  async function handleFinish() {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))

    // Parse numeric fields
    const txAmount = parseFloat(answers["transaction_amount"] || "0") || 0
    const legalNoticeSent = (answers["company_response"] || "").toLowerCase().includes("notice") ||
      (answers["company_response"] || "").toLowerCase().includes("sent")

    // Derive compensation from relief_sought text
    const reliefText = answers["relief_sought"] || ""
    const reliefMatch = reliefText.match(/[\d,]+/)
    const compensationSought = reliefMatch ? parseFloat(reliefMatch[0].replace(/,/g, "")) : txAmount

    // Build complaint text from answers
    const complaintText = `The complainant purchased ${answers["product_service"] || "the product/service"} from ${answers["opposite_party_name"] || "the opposite party"} on ${answers["purchase_date"] || "the relevant date"} for ₹${txAmount.toLocaleString("en-IN")}. ${answers["defect_description"] || ""}. The opposite party's response: ${answers["company_response"] || "No response"}. Relief sought: ${reliefText}.`

    setCaseData({
      status: "ELIGIBILITY_CHECK",
      progress_percentage: 40,
      product_service: answers["product_service"] || "",
      opposite_party_name: answers["opposite_party_name"] || "",
      purchase_date: answers["purchase_date"] || "",
      transaction_amount: txAmount,
      compensation_sought: compensationSought,
      total_claim_amount: txAmount + compensationSought,
      defect_description: answers["defect_description"] || "",
      company_response: answers["company_response"] || "",
      legal_notice_sent: legalNoticeSent,
      relief_sought: reliefText,
      evidence_available: answers["evidence_available"] || "",
      complaint_text_en: complaintText,
      case_specific_data: answers,
    })

    addTimelineEvent({
      event_id: `e-interview-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "AI interview completed",
      actor: "USER",
      note: `${QUESTIONS.length} questions answered. Relief sought: ₹${compensationSought.toLocaleString("en-IN")}.`,
    })

    router.push("/eligibility")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="rounded-xl border border-softborder bg-card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-900">Interview progress</span>
          <span className="text-muted-foreground">{answered}/{QUESTIONS.length} answered</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bluesoft">
          <div className="h-full rounded-full bg-ink-900 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Answered questions */}
      {answered > 0 && (
        <section className="rounded-xl border border-softborder bg-card p-5">
          <h2 className="mb-4 font-serif text-base font-bold text-ink-900">Recorded answers</h2>
          <div className="flex flex-col gap-3">
            {QUESTIONS.slice(0, done ? QUESTIONS.length : current).map((q) => (
              <div key={q.id} className="flex items-start gap-3 rounded-lg border border-forest/20 bg-forest-soft px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                <div>
                  <p className="text-xs text-muted-foreground">{q.text}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-900">{answers[q.field]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Current question */}
      {!done ? (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-ink" />
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-ink">
              Question {current + 1} of {QUESTIONS.length}
            </span>
          </div>
          <h2 className="mb-5 font-serif text-xl font-bold text-ink-900">{q.text}</h2>
          <form onSubmit={handleAnswer} className="flex flex-col gap-4">
            <textarea
              rows={3}
              placeholder={q.placeholder}
              value={answers[q.field] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.field]: e.target.value }))}
              className="w-full resize-none rounded-md border border-softborder bg-card px-3 py-3 text-sm text-ink-900 outline-none focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10"
            />
            <button
              type="submit"
              disabled={!answers[q.field]?.trim()}
              className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50"
            >
              {current < QUESTIONS.length - 1 ? "Next question" : "Finish interview"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-forest/30 bg-forest-soft p-5 md:p-6">
          <p className="font-serif text-lg font-bold text-forest">Interview complete</p>
          <p className="mt-1 text-sm text-ink-800">
            All {QUESTIONS.length} questions answered. The AI has extracted the key facts for your complaint petition.
          </p>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</>
              : <>Continue to eligibility <ArrowRight className="h-4 w-4" /></>}
          </button>
        </section>
      )}
    </div>
  )
}
