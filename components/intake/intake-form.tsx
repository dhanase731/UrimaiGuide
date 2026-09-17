"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, Square, Type, Loader2, ArrowRight, AlertCircle, Brain } from "lucide-react"
import { LANGUAGES, type PreferredLanguage } from "@/lib/registration"
import { useCaseContext } from "@/lib/case-context"

const MIN_CHARS = 20
const MAX_CHARS = 2000

// NLP classification simulation — mirrors Module 3 DistilBERT output
function classifyIntent(text: string): { type: string; label: string; confidence: number; sub_category: string; sector: string; opposite_party_type: string } {
  const t = text.toLowerCase()
  if (t.includes("phone") || t.includes("laptop") || t.includes("tv") || t.includes("electronics") || t.includes("defect") || t.includes("broken"))
    return { type: "DEFECTIVE_GOODS", label: "Defective Goods", confidence: 0.94, sub_category: "ELECTRONICS", sector: "ELECTRONICS", opposite_party_type: "SELLER" }
  if (t.includes("builder") || t.includes("flat") || t.includes("apartment") || t.includes("possession") || t.includes("rera"))
    return { type: "REAL_ESTATE", label: "Real Estate / Builder Delay", confidence: 0.91, sub_category: "BUILDER_DELAY", sector: "REAL_ESTATE", opposite_party_type: "BUILDER_DEVELOPER" }
  if (t.includes("hospital") || t.includes("doctor") || t.includes("surgery") || t.includes("medical") || t.includes("treatment"))
    return { type: "MEDICAL_NEGLIGENCE", label: "Medical Negligence", confidence: 0.89, sub_category: "WRONG_TREATMENT", sector: "HEALTHCARE", opposite_party_type: "HOSPITAL" }
  if (t.includes("bank") || t.includes("atm") || t.includes("upi") || t.includes("fraud") || t.includes("debit") || t.includes("credit"))
    return { type: "BANKING", label: "Banking / Financial Fraud", confidence: 0.92, sub_category: "UPI_FRAUD", sector: "BANKING", opposite_party_type: "BANK" }
  if (t.includes("insurance") || t.includes("claim") || t.includes("policy") || t.includes("premium"))
    return { type: "INSURANCE", label: "Insurance Claim Rejection", confidence: 0.88, sub_category: "CLAIM_REJECTION", sector: "INSURANCE", opposite_party_type: "INSURANCE_COMPANY" }
  if (t.includes("airtel") || t.includes("jio") || t.includes("bsnl") || t.includes("telecom") || t.includes("network") || t.includes("broadband"))
    return { type: "TELECOM", label: "Telecom Service Deficiency", confidence: 0.87, sub_category: "BILLING_FRAUD", sector: "TELECOM", opposite_party_type: "TELECOM_COMPANY" }
  if (t.includes("amazon") || t.includes("flipkart") || t.includes("online") || t.includes("order") || t.includes("delivery") || t.includes("refund"))
    return { type: "ECOMMERCE", label: "E-Commerce Deficiency", confidence: 0.93, sub_category: "ONLINE_PURCHASE", sector: "ECOMMERCE", opposite_party_type: "ECOMMERCE_PLATFORM" }
  if (t.includes("college") || t.includes("school") || t.includes("university") || t.includes("fees") || t.includes("admission"))
    return { type: "EDUCATION", label: "Education Service Deficiency", confidence: 0.85, sub_category: "FEE_REFUND", sector: "EDUCATION", opposite_party_type: "EDUCATIONAL_INSTITUTION" }
  return { type: "DEFICIENCY_SERVICE", label: "Deficiency in Service", confidence: 0.72, sub_category: "GENERAL", sector: "SERVICES", opposite_party_type: "SERVICE_PROVIDER" }
}

export function IntakeForm() {
  const router = useRouter()
  const { user, setCaseData, addTimelineEvent } = useCaseContext()
  const [language, setLanguage] = useState<PreferredLanguage>(user.preferred_language || "ENGLISH")
  const [mode, setMode] = useState<"text" | "voice">("text")
  const [text, setText] = useState("")
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [error, setError] = useState("")

  function toggleRecording() {
    if (recording) {
      setRecording(false)
      setText((t) => t || "The electronics store sold me a Samsung phone that stopped working after two weeks and refuses to repair or refund it.")
    } else {
      setRecording(true)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (text.trim().length < MIN_CHARS) {
      setError(`Please describe your problem in at least ${MIN_CHARS} characters.`)
      return
    }
    setError("")
    setSubmitting(true)

    // Simulate intake API call
    await new Promise((r) => setTimeout(r, 600))
    const caseId = `3f9a2c7e-1b84-4d52-9a6f-${Date.now()}`

    setCaseData({
      case_id: caseId,
      case_number: "",
      status: "NLP_CLASSIFICATION",
      progress_percentage: 10,
      raw_problem_description: text.trim(),
      input_language: language,
      input_mode: mode === "voice" ? "VOICE" : "TEXT",
    })

    addTimelineEvent({
      event_id: `e-intake-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "Problem described",
      actor: "USER",
      note: text.trim().slice(0, 100) + (text.length > 100 ? "…" : ""),
    })

    // Simulate NLP classification (Module 3)
    setClassifying(true)
    await new Promise((r) => setTimeout(r, 1200))

    const nlp = classifyIntent(text)
    setCaseData({
      status: "AI_INTERVIEW",
      progress_percentage: 20,
      primary_case_type: nlp.type,
      primary_case_type_label: nlp.label,
      confidence_score: nlp.confidence,
      sub_category: nlp.sub_category,
      sector: nlp.sector,
      opposite_party_type: nlp.opposite_party_type,
      is_consumer_case: true,
    })

    addTimelineEvent({
      event_id: `e-nlp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "AI classified complaint",
      actor: "SYSTEM",
      note: `Category: ${nlp.type} · Confidence: ${nlp.confidence}`,
    })

    router.push("/interview")
  }

  const count = text.trim().length

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        {/* Language + mode toggles */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex overflow-hidden rounded-md border border-softborder" role="group" aria-label="Language">
            {LANGUAGES.map((lang) => (
              <button key={lang.value} type="button" onClick={() => setLanguage(lang.value)}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${language === lang.value ? "bg-ink-900 text-parchment" : "bg-card text-ink-700 hover:bg-bluesoft"}`}>
                {lang.native}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-md border border-softborder" role="group" aria-label="Input mode">
            <button type="button" onClick={() => setMode("text")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${mode === "text" ? "bg-ink-900 text-parchment" : "bg-card text-ink-700 hover:bg-bluesoft"}`}>
              <Type className="h-4 w-4" />Type
            </button>
            <button type="button" onClick={() => setMode("voice")}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${mode === "voice" ? "bg-ink-900 text-parchment" : "bg-card text-ink-700 hover:bg-bluesoft"}`}>
              <Mic className="h-4 w-4" />Speak
            </button>
          </div>
        </div>

        {mode === "voice" && (
          <div className="mb-4 flex flex-col items-center gap-3 rounded-lg border border-amber-ink/30 bg-amber-soft p-6 text-center">
            <button type="button" onClick={toggleRecording}
              className={`flex h-16 w-16 items-center justify-center rounded-full text-parchment transition-colors ${recording ? "animate-pulse bg-danger-ink" : "bg-ink-900 hover:bg-ink-800"}`}
              aria-label={recording ? "Stop recording" : "Start recording"}>
              {recording ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}
            </button>
            <p className="text-sm font-medium text-ink-900">{recording ? "Listening… tap to stop" : "Tap and describe your problem aloud"}</p>
            <p className="text-xs text-ink-700">Powered by Bhashini ASR. You can edit the transcript below before submitting.</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="problem" className="mb-1.5 block text-sm font-semibold text-ink-900">Describe what happened</label>
          <textarea id="problem" value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))} rows={8}
            placeholder="e.g. I ordered a refrigerator online. It arrived damaged and the seller refuses to replace it or return my money…"
            className="w-full resize-y rounded-md border border-softborder bg-card px-3 py-3 text-sm leading-relaxed text-ink-900 outline-none focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className={count < MIN_CHARS ? "text-muted-foreground" : "text-forest"}>
              {count < MIN_CHARS ? `${MIN_CHARS - count} more characters needed` : "Looks good"}
            </span>
            <span className="text-muted-foreground">{count}/{MAX_CHARS}</span>
          </div>
          {error && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-danger-ink">
              <AlertCircle className="h-3 w-3 shrink-0" />{error}
            </p>
          )}

          <div className="mt-5">
            {classifying ? (
              <div className="flex items-center gap-3 rounded-lg border border-bluesoft bg-bluesoft p-4">
                <Brain className="h-5 w-5 animate-pulse text-ink-900" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">Understanding your problem…</p>
                  <p className="text-xs text-ink-700">DistilBERT NLP classifying your complaint under CPA 2019</p>
                </div>
              </div>
            ) : (
              <button type="submit" disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60">
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Creating case…</>
                  : <>Analyze legal claim <ArrowRight className="h-4 w-4" /></>}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
