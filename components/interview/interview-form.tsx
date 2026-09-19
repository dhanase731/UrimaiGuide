"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, CheckCircle2, MessageSquare, AlertCircle, Mic, Square } from "lucide-react"
import { useCaseContext } from "@/lib/case-context"
import { buildInitialFactState } from "@/lib/interview/extractor"
import { getMissingFacts, isInterviewComplete, FACT_LABELS, type InterviewFactState, type FactKey } from "@/lib/interview/facts"
import type { InterviewTurnResponse } from "@/app/api/interview/turn/route"

const SPEECH_LANG: Record<string, string> = { ENGLISH: "en-IN", TAMIL: "ta-IN", HINDI: "hi-IN" }

const FALLBACK_Q: Partial<Record<FactKey, Record<string, string>>> = {
  purchase_date: { ENGLISH: "When did you purchase the device?", TAMIL: "சாதனத்தை எப்போது வாங்கினீர்கள்?", HINDI: "डिवाइस कब खरीदा?" },
  purchase_price: { ENGLISH: "How much did you pay? (₹)", TAMIL: "எவ்வளவு பணம் செலுத்தினீர்கள்? (₹)", HINDI: "कितना भुगतान किया? (₹)" },
  seller: { ENGLISH: "From which seller or company did you buy it?", TAMIL: "எந்த விற்பனையாளரிடம் வாங்கினீர்கள்?", HINDI: "किस विक्रेता से खरीदा?" },
  purchase_platform: { ENGLISH: "Did you buy online (Amazon, Flipkart etc.) or from a store?", TAMIL: "ஆன்லைனில் வாங்கினீர்களா அல்லது கடையில்?", HINDI: "ऑनलाइन खरीदा या दुकान से?" },
  model: { ENGLISH: "What is the exact model name or number?", TAMIL: "சரியான மாடல் பெயர் என்ன?", HINDI: "सटीक मॉडल नाम क्या है?" },
  invoice_available: { ENGLISH: "Do you have the purchase invoice or receipt?", TAMIL: "வாங்கிய விலைப்பட்டியல் உள்ளதா?", HINDI: "क्या खरीद का चालान है?" },
  problem_started: { ENGLISH: "When did the problem first appear?", TAMIL: "பிரச்சனை முதலில் எப்போது தோன்றியது?", HINDI: "समस्या पहली बार कब आई?" },
  warranty_status: { ENGLISH: "Is the device still under warranty?", TAMIL: "சாதனம் உத்தரவாத காலத்தில் உள்ளதா?", HINDI: "क्या डिवाइस वारंटी में है?" },
  repair_attempted: { ENGLISH: "Did you visit a service center or attempt any repair?", TAMIL: "சேவை மையத்திற்கு சென்றீர்களா?", HINDI: "क्या सर्विस सेंटर गए?" },
  seller_contacted: { ENGLISH: "Did you contact the seller about this problem?", TAMIL: "விற்பனையாளரை தொடர்பு கொண்டீர்களா?", HINDI: "क्या विक्रेता से संपर्क किया?" },
  seller_response: { ENGLISH: "What was the seller's response?", TAMIL: "விற்பனையாளர் என்ன பதில் சொன்னது?", HINDI: "विक्रेता का क्या जवाब था?" },
  replacement_requested: { ENGLISH: "Did you ask for a replacement?", TAMIL: "மாற்று சாதனம் கேட்டீர்களா?", HINDI: "क्या बदलाव मांगा?" },
  refund_requested: { ENGLISH: "Did you ask for a refund?", TAMIL: "பணம் திரும்ப கேட்டீர்களா?", HINDI: "क्या वापसी मांगी?" },
  relief_sought: { ENGLISH: "What outcome are you looking for — refund, replacement, or compensation?", TAMIL: "நீங்கள் என்ன விரும்புகிறீர்கள் — பணம் திரும்ப, மாற்று, அல்லது இழப்பீடு?", HINDI: "आप क्या चाहते हैं — वापसी, बदलाव, या मुआवजा?" },
  evidence_available: { ENGLISH: "What documents or evidence do you have? (invoice, photos, chat screenshots)", TAMIL: "என்ன ஆவணங்கள் உள்ளன? (விலைப்பட்டியல், புகைப்படங்கள்)", HINDI: "कौन से दस्तावेज़ हैं? (चालान, फ़ोटो, स्क्रीनशॉट)" },
}

const COMPLETE_MSG: Record<string, string> = {
  ENGLISH: "Thank you. All necessary information has been collected for your complaint.",
  TAMIL: "நன்றி. உங்கள் புகாருக்கு தேவையான அனைத்து தகவல்களும் சேகரிக்கப்பட்டன.",
  HINDI: "धन्यवाद। आपकी शिकायत के लिए सभी आवश्यक जानकारी एकत्र की गई है।",
}

const AI_ERR_MSG: Record<string, string> = {
  ENGLISH: "AI service unavailable — using guided questions.",
  TAMIL: "AI சேவை கிடைக்கவில்லை — வழிகாட்டும் கேள்விகளை பயன்படுத்துகிறோம்.",
  HINDI: "AI सेवा उपलब्ध नहीं — निर्देशित प्रश्नों का उपयोग किया जा रहा है।",
}

const PROGRESS_LABELS: Record<string, string[]> = {
  ENGLISH: ["Register", "Describe problem", "AI interview", "File complaint"],
  TAMIL: ["பதிவு", "பிரச்சனை விவரி", "AI நேர்காணல்", "புகார் தாக்கல்"],
  HINDI: ["पंजीकरण", "समस्या बताएं", "AI साक्षात्कार", "शिकायत दर्ज करें"],
}
export function InterviewForm() {
  const router = useRouter()
  const { caseData, setCaseData, addTimelineEvent } = useCaseContext()
  const language = (caseData.input_language as string) || "ENGLISH"

  const [factState, setFactState] = useState<InterviewFactState>(() =>
    buildInitialFactState(caseData)
  )
  const [currentTopic, setCurrentTopic] = useState<FactKey | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [complete, setComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [speechState, setSpeechState] = useState<"idle"|"listening"|"unsupported">("idle")
  const [partial, setPartial] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  const speechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  // On mount: set first question
  useEffect(() => {
    const missing = getMissingFacts(factState)
    if (missing.length === 0) {
      setComplete(true)
      setCurrentQuestion(COMPLETE_MSG[language] ?? COMPLETE_MSG.ENGLISH)
    } else {
      const firstTopic = missing[0]
      setCurrentTopic(firstTopic)
      setCurrentQuestion(getFallbackQuestion(firstTopic, language))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getFallbackQuestion(topic: FactKey, lang: string): string {
    return FALLBACK_Q[topic]?.[lang] ?? FALLBACK_Q[topic]?.ENGLISH ?? `Please tell us about: ${FACT_LABELS[topic]}`
  }

  function startSpeech() {
    if (!speechSupported) { setSpeechState("unsupported"); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Win = window as any
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition
    if (!SR) { setSpeechState("unsupported"); return }
    const rec = new SR()
    rec.lang = SPEECH_LANG[language] ?? "en-IN"
    rec.continuous = false
    rec.interimResults = true
    recRef.current = rec
    rec.onstart = () => { setSpeechState("listening"); setPartial("") }
    rec.onresult = (e: any) => {
      let interim = ""; let final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      setPartial(interim)
      if (final) { setAnswer(prev => (prev.trimEnd() ? prev.trimEnd() + " " + final.trim() : final.trim()).slice(0, 1000)); setPartial("") }
    }
    rec.onerror = () => { setSpeechState("idle"); recRef.current = null }
    rec.onend = () => { setSpeechState("idle"); setPartial(""); recRef.current = null }
    try { rec.start() } catch { setSpeechState("idle") }
  }

  function stopSpeech() { recRef.current?.stop(); setSpeechState("idle"); setPartial("") }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setAiError("")

    const missing = getMissingFacts(factState)
    const nextMissing = missing.filter(k => k !== currentTopic)

    try {
      const res = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factState,
          userAnswer: trimmed,
          currentQuestionTopic: currentTopic,
          problemContext: (caseData.case_specific_data?.user_original_text as string) || caseData.raw_problem_description || "",
          language,
          nextMissingFacts: nextMissing,
        }),
      })

      if (res.status === 503) {
        setAiError(AI_ERR_MSG[language] ?? AI_ERR_MSG.ENGLISH)
        applyFallback(trimmed, nextMissing)
        return
      }

      if (!res.ok) {
        setAiError(AI_ERR_MSG[language] ?? AI_ERR_MSG.ENGLISH)
        applyFallback(trimmed, nextMissing)
        return
      }

      const data: InterviewTurnResponse = await res.json()
      applyGeminiResponse(trimmed, data)
    } catch {
      setAiError(AI_ERR_MSG[language] ?? AI_ERR_MSG.ENGLISH)
      applyFallback(trimmed, nextMissing)
    } finally {
      setLoading(false)
      setAnswer("")
    }
  }

  function applyGeminiResponse(userAnswer: string, data: InterviewTurnResponse) {
    let next = { ...factState }

    // Apply current topic answer
    if (currentTopic) {
      next = { ...next, [currentTopic]: { key: currentTopic, status: "KNOWN", value: userAnswer } }
    }

    // Apply extracted facts from Gemini (only if they are still MISSING/UNCERTAIN)
    for (const [k, v] of Object.entries(data.extracted_facts) as [FactKey, string][]) {
      if (next[k]?.status === "MISSING" || next[k]?.status === "UNCERTAIN") {
        next = { ...next, [k]: { key: k, status: "KNOWN", value: v } }
      }
    }

    // Mark uncertain facts
    for (const k of data.uncertain_facts as FactKey[]) {
      if (next[k]?.status === "KNOWN") {
        next = { ...next, [k]: { ...next[k], status: "UNCERTAIN" } }
      }
    }

    setFactState(next)

    if (data.interview_complete || isInterviewComplete(next)) {
      setComplete(true)
      setCurrentQuestion(COMPLETE_MSG[language] ?? COMPLETE_MSG.ENGLISH)
      setCurrentTopic(null)
    } else {
      const nextTopic = (data.next_question_topic as FactKey | null) ?? getMissingFacts(next)[0] ?? null
      setCurrentTopic(nextTopic)
      setCurrentQuestion(data.next_question || (nextTopic ? getFallbackQuestion(nextTopic, language) : ""))
    }
  }

  function applyFallback(userAnswer: string, remaining: FactKey[]) {
    let next = { ...factState }
    if (currentTopic) {
      next = { ...next, [currentTopic]: { key: currentTopic, status: "KNOWN", value: userAnswer } }
    }
    setFactState(next)
    if (remaining.length === 0 || isInterviewComplete(next)) {
      setComplete(true)
      setCurrentQuestion(COMPLETE_MSG[language] ?? COMPLETE_MSG.ENGLISH)
      setCurrentTopic(null)
    } else {
      const nextTopic = remaining[0]
      setCurrentTopic(nextTopic)
      setCurrentQuestion(getFallbackQuestion(nextTopic, language))
    }
  }
  async function handleFinish() {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const f = factState
    const txAmount = parseFloat((f.purchase_price?.value ?? "0").replace(/[^0-9.]/g, "")) || 0

    setCaseData({
      status: "ELIGIBILITY_CHECK",
      progress_percentage: 40,
      product_service: [f.brand?.value, f.model?.value].filter(Boolean).join(" ") || "",
      opposite_party_name: f.seller?.value || "",
      purchase_date: f.purchase_date?.value || "",
      transaction_amount: txAmount,
      compensation_sought: txAmount,
      total_claim_amount: txAmount,
      defect_description: f.problem_description?.value || "",
      company_response: f.seller_response?.value || "",
      relief_sought: f.relief_sought?.value || "",
      evidence_available: f.evidence_available?.value || "",
      case_specific_data: {
        ...caseData.case_specific_data,
        interview_fact_state: factState,
        interview_language: language,
      },
    })

    addTimelineEvent({
      event_id: `e-interview-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: "AI interview completed",
      actor: "USER",
      note: `Facts collected: ${Object.values(factState).filter(f => f.status === "KNOWN").length}`,
    })

    router.push("/eligibility")
  }

  const knownFacts = Object.values(factState).filter(f => f.status === "KNOWN")
  const totalRequired = Object.values(factState).filter(f => f.status !== "NOT_APPLICABLE").length
  const progress = totalRequired > 0 ? Math.round((knownFacts.length / totalRequired) * 100) : 0
  const labels = PROGRESS_LABELS[language] ?? PROGRESS_LABELS.ENGLISH

  return (
    <div className="flex flex-col gap-6">

      {/* Progress bar */}
      <div className="rounded-xl border border-softborder bg-card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-900">
            {language === "TAMIL" ? "நேர்காணல் முன்னேற்றம்" : language === "HINDI" ? "साक्षात्कार प्रगति" : "Interview progress"}
          </span>
          <span className="text-muted-foreground">{knownFacts.length}/{totalRequired}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bluesoft">
          <div className="h-full rounded-full bg-ink-900 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Recorded answers */}
      {knownFacts.length > 0 && (
        <section className="rounded-xl border border-softborder bg-card p-5">
          <h2 className="mb-4 font-serif text-base font-bold text-ink-900">
            {language === "TAMIL" ? "பதிவு செய்யப்பட்ட பதில்கள்" : language === "HINDI" ? "दर्ज उत्तर" : "Recorded answers"}
          </h2>
          <div className="flex flex-col gap-2">
            {(Object.entries(factState) as [FactKey, typeof factState[FactKey]][]).filter(([,f]) => f.status === "KNOWN").map(([k, f]) => (
              <div key={k} className="flex items-start gap-3 rounded-lg border border-forest/20 bg-forest-soft px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                <div>
                  <p className="text-xs text-muted-foreground">{FACT_LABELS[k]}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-900">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Current question or completion */}
      {!complete ? (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-ink" />
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-ink">
              {language === "TAMIL" ? "கேள்வி" : language === "HINDI" ? "प्रश्न" : "Question"}
            </span>
          </div>
          {aiError && (
            <p className="mb-3 flex items-center gap-1.5 rounded-md border border-amber-ink/20 bg-amber-soft px-3 py-2 text-xs text-ink-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-ink" />{aiError}
            </p>
          )}
          <h2 className="mb-5 font-serif text-xl font-bold text-ink-900">{currentQuestion}</h2>
          <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-4">
            <div className="relative">
              <textarea rows={3} value={answer}
                onChange={e => setAnswer(e.target.value.slice(0, 1000))}
                placeholder={language === "TAMIL" ? "உங்கள் பதிலை இங்கே தட்டச்சு செய்யவும்…" : language === "HINDI" ? "यहाँ अपना उत्तर टाइप करें…" : "Type your answer here…"}
                className="w-full resize-none rounded-md border border-softborder bg-card px-3 py-3 text-sm text-ink-900 outline-none focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10"
              />
              {partial && <p className="mt-1 text-xs italic text-ink-700">{partial}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={!answer.trim() || loading}
                className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{language === "HINDI" ? "प्रसंस्करण…" : language === "TAMIL" ? "செயலாக்குகிறோம்…" : "Processing…"}</>
                  : <>{language === "HINDI" ? "अगला" : language === "TAMIL" ? "அடுத்து" : "Next"} <ArrowRight className="h-4 w-4" /></>}
              </button>
              {speechSupported && speechState !== "unsupported" && (
                <button type="button"
                  onClick={speechState === "listening" ? stopSpeech : startSpeech}
                  aria-label={speechState === "listening" ? "Stop recording" : "Start recording"}
                  aria-pressed={speechState === "listening"}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors ${speechState === "listening" ? "animate-pulse border-danger-ink bg-danger-ink/10 text-danger-ink" : "border-softborder bg-card text-ink-700 hover:bg-bluesoft"}`}>
                  {speechState === "listening" ? <><Square className="h-4 w-4" />{language === "HINDI" ? "रोकें" : language === "TAMIL" ? "நிறுத்து" : "Stop"}</> : <><Mic className="h-4 w-4" />{language === "HINDI" ? "बोलें" : language === "TAMIL" ? "பேசு" : "Speak"}</>}
                </button>
              )}
            </div>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-forest/30 bg-forest-soft p-5 md:p-6">
          <p className="font-serif text-lg font-bold text-forest">{currentQuestion}</p>
          <p className="mt-2 text-sm text-ink-800">
            {language === "TAMIL"
              ? `${knownFacts.length} உண்மைகள் சேகரிக்கப்பட்டன.`
              : language === "HINDI"
              ? `${knownFacts.length} तथ्य एकत्र किए गए।`
              : `${knownFacts.length} facts collected.`}
          </p>
          <button onClick={handleFinish} disabled={submitting}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60">
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" />{language === "HINDI" ? "प्रसंस्करण…" : language === "TAMIL" ? "செயலாக்குகிறோம்…" : "Processing…"}</>
              : <>{language === "HINDI" ? "पात्रता जांचें" : language === "TAMIL" ? "தகுதி சரிபார்க்கவும்" : "Continue to eligibility"} <ArrowRight className="h-4 w-4" /></>}
          </button>
        </section>
      )}
    </div>
  )
}
