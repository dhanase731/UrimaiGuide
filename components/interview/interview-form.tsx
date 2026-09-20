"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight, Loader2, CheckCircle2, MessageSquare,
  AlertCircle, Mic, Square, Info, AlertTriangle,
} from "lucide-react"
import { useCaseContext } from "@/lib/case-context"
import { buildInitialFactState, detectConflict } from "@/lib/interview/extractor"
import {
  getMissingFacts,
  isInterviewComplete,
  isStructurallyValid,
  countKnownFacts,
  countApplicableFacts,
  ALL_FACT_KEYS,
  FACT_LABELS,
  SOURCE_LABELS,
  type InterviewFactState,
  type FactKey,
  type FactSource,
  type Fact,
} from "@/lib/interview/facts"
import type {
  InterviewTurnResponse,
  InterviewTurnRequest,
} from "@/app/api/interview/turn/route"

// ── Speech language codes ─────────────────────────────────────────────────────

const SPEECH_LANG: Record<string, string> = {
  ENGLISH: "en-IN",
  TAMIL:   "ta-IN",
  HINDI:   "hi-IN",
}

// ── Fallback questions (Gemini unavailable) ───────────────────────────────────
// A partial map — only the most-used keys need explicit translations.

const FALLBACK_Q: Partial<Record<FactKey, Record<string, string>>> = {
  purchase_date:              { ENGLISH: "When did you purchase the device?", TAMIL: "சாதனத்தை எப்போது வாங்கினீர்கள்?", HINDI: "डिवाइस कब खरीदा?" },
  purchase_price:             { ENGLISH: "How much did you pay? (₹)", TAMIL: "எவ்வளவு பணம் செலுத்தினீர்கள்? (₹)", HINDI: "कितना भुगतान किया? (₹)" },
  seller:                     { ENGLISH: "From which seller or company did you buy it?", TAMIL: "எந்த விற்பனையாளரிடம் வாங்கினீர்கள்?", HINDI: "किस विक्रेता से खरीदा?" },
  purchase_platform:          { ENGLISH: "Did you buy online (Amazon, Flipkart, etc.) or from a store?", TAMIL: "ஆன்லைனில் வாங்கினீர்களா அல்லது கடையில்?", HINDI: "ऑनलाइन खरीदा या दुकान से?" },
  model:                      { ENGLISH: "What is the exact model name or number?", TAMIL: "சரியான மாடல் பெயர் என்ன?", HINDI: "सटीक मॉडल नाम क्या है?" },
  order_id:                   { ENGLISH: "Do you have an order ID or invoice number?", TAMIL: "ஆர்டர் ஐடி அல்லது விலைப்பட்டியல் எண் உள்ளதா?", HINDI: "क्या आपके पास ऑर्डर ID है?" },
  problem_timing:             { ENGLISH: "When did the problem first appear? (e.g. 10 days after purchase)", TAMIL: "பிரச்சனை முதலில் எப்போது தோன்றியது?", HINDI: "समस्या पहली बार कब आई?" },
  problem_still_occurring:    { ENGLISH: "Is the problem still occurring now?", TAMIL: "பிரச்சனை இப்போதும் நடக்கிறதா?", HINDI: "क्या समस्या अभी भी हो रही है?" },
  physical_damage:            { ENGLISH: "Is there any physical damage — drop, crack, or liquid exposure?", TAMIL: "கைவிட்டு விழுந்ததா, விரிசல் அல்லது நீர் தொடர்பா?", HINDI: "क्या कोई शारीरिक क्षति है?" },
  warranty_status:            { ENGLISH: "Is the device still under warranty?", TAMIL: "சாதனம் உத்தரவாத காலத்தில் உள்ளதா?", HINDI: "क्या डिवाइस वारंटी में है?" },
  repair_attempted:           { ENGLISH: "Did you visit a service center or attempt any repair?", TAMIL: "சேவை மையத்திற்கு சென்றீர்களா?", HINDI: "क्या सर्विस सेंटर गए?" },
  repair_details:             { ENGLISH: "Please describe what repair was attempted, where, and what they found.", TAMIL: "என்ன பழுதுபார்ப்பு முயற்சிக்கப்பட்டது என்று கூறவும்.", HINDI: "मरम्मत का विवरण दें — कहाँ और क्या हुआ?" },
  seller_contacted:           { ENGLISH: "Did you contact the seller or manufacturer about this problem?", TAMIL: "விற்பனையாளரை தொடர்பு கொண்டீர்களா?", HINDI: "क्या विक्रेता से संपर्क किया?" },
  seller_contact_date:        { ENGLISH: "When did you contact them, and how (call, email, chat)?", TAMIL: "எப்போது தொடர்பு கொண்டீர்கள்?", HINDI: "कब और कैसे संपर्क किया?" },
  seller_response:            { ENGLISH: "What was the seller's or manufacturer's response?", TAMIL: "விற்பனையாளர் என்ன பதில் சொன்னது?", HINDI: "विक्रेता का क्या जवाब था?" },
  complaint_ref_number:       { ENGLISH: "Do you have a complaint, ticket, or reference number from the seller?", TAMIL: "புகார் குறிப்பு எண் உள்ளதா?", HINDI: "क्या कोई शिकायत संदर्भ संख्या है?" },
  replacement_requested:      { ENGLISH: "Did you ask for a replacement?", TAMIL: "மாற்று சாதனம் கேட்டீர்களா?", HINDI: "क्या बदलाव मांगा?" },
  refund_requested:           { ENGLISH: "Did you ask for a refund?", TAMIL: "பணம் திரும்ப கேட்டீர்களா?", HINDI: "क्या वापसी मांगी?" },
  relief_sought:              { ENGLISH: "What outcome are you looking for — refund, replacement, or repair?", TAMIL: "நீங்கள் என்ன விரும்புகிறீர்கள்?", HINDI: "आप क्या चाहते हैं?" },
  evidence_invoice:           { ENGLISH: "Do you have the purchase invoice or receipt?", TAMIL: "விலைப்பட்டியல் உள்ளதா?", HINDI: "क्या चालान है?" },
  evidence_photos:            { ENGLISH: "Do you have photos of the defect or damage?", TAMIL: "குறைபாட்டின் புகைப்படங்கள் உள்ளனவா?", HINDI: "क्या दोष की फ़ोटो है?" },
  evidence_chat_records:      { ENGLISH: "Do you have WhatsApp, SMS, or chat records with the seller?", TAMIL: "விற்பனையாளருடன் சாட் பதிவுகள் உள்ளனவா?", HINDI: "क्या विक्रेता के साथ चैट रिकॉर्ड हैं?" },
  evidence_emails:            { ENGLISH: "Do you have any emails related to this complaint?", TAMIL: "இந்த புகாருக்கு தொடர்பான மின்னஞ்சல்கள் உள்ளனவா?", HINDI: "क्या इस शिकायत से संबंधित ईमेल हैं?" },
  evidence_service_job_sheet: { ENGLISH: "Do you have a service job sheet or repair report?", TAMIL: "சேவை ஜாப் ஷீட் உள்ளதா?", HINDI: "क्या सर्विस जॉब शीट है?" },
  evidence_other:             { ENGLISH: "Do you have any other relevant documents or evidence?", TAMIL: "வேறு ஆவணங்கள் உள்ளனவா?", HINDI: "कोई अन्य दस्तावेज़ हैं?" },
}

// ── Localised strings ─────────────────────────────────────────────────────────

const T = {
  complete: {
    ENGLISH: "Thank you. All necessary information has been collected for your complaint.",
    TAMIL:   "நன்றி. உங்கள் புகாருக்கு தேவையான அனைத்து தகவல்களும் சேகரிக்கப்பட்டன.",
    HINDI:   "धन्यवाद। आपकी शिकायत के लिए सभी आवश्यक जानकारी एकत्र की गई है।",
  },
  aiNotConfigured: {
    ENGLISH: "AI interview not configured (GEMINI_API_KEY missing). Using guided questions instead.",
    TAMIL:   "AI நேர்காணல் கட்டமைக்கப்படவில்லை. வழிகாட்டும் கேள்விகளை பயன்படுத்துகிறோம்.",
    HINDI:   "AI साक्षात्कार कॉन्फ़िगर नहीं है। निर्देशित प्रश्नों का उपयोग किया जा रहा है।",
  },
  aiError: {
    ENGLISH: "AI service temporarily unavailable — using guided questions instead.",
    TAMIL:   "AI சேவை தற்காலிகமாக கிடைக்கவில்லை — வழிகாட்டும் கேள்விகளை பயன்படுத்துகிறோம்.",
    HINDI:   "AI सेवा अस्थायी रूप से अनुपलब्ध — निर्देशित प्रश्नों का उपयोग किया जा रहा है।",
  },
  fallbackMode:  { ENGLISH: "Guided interview", TAMIL: "வழிகாட்டப்பட்ட நேர்காணல்", HINDI: "निर्देशित साक्षात्कार" },
  geminiMode:    { ENGLISH: "AI interview", TAMIL: "AI நேர்காணல்", HINDI: "AI साक्षात्कार" },
  question:      { ENGLISH: "Question", TAMIL: "கேள்வி", HINDI: "प्रश्न" },
  conflict:      { ENGLISH: "Conflicting information", TAMIL: "முரண்பாடான தகவல்", HINDI: "विरोधाभासी जानकारी" },
  junkError: {
    ENGLISH: "Please type a clear answer.",
    TAMIL:   "தயவுசெய்து உங்கள் பதிலை தெளிவாக தட்டச்சு செய்யவும்.",
    HINDI:   "कृपया अपना उत्तर स्पष्ट रूप से टाइप करें।",
  },
  invalidAnswer: {
    ENGLISH: "That answer doesn't match what's expected here. Please try again.",
    TAMIL:   "அந்த பதில் இங்கே எதிர்பார்க்கப்படுவதுடன் பொருந்தவில்லை.",
    HINDI:   "वह उत्तर यहाँ अपेक्षित से मेल नहीं खाता। कृपया पुनः प्रयास करें।",
  },
  processing:  { ENGLISH: "Processing…", TAMIL: "செயலாக்குகிறோம்…", HINDI: "प्रसंस्करण…" },
  next:        { ENGLISH: "Next", TAMIL: "அடுத்து", HINDI: "अगला" },
  speak:       { ENGLISH: "Speak", TAMIL: "பேசு", HINDI: "बोलें" },
  stop:        { ENGLISH: "Stop", TAMIL: "நிறுத்து", HINDI: "रोकें" },
  recordedAnswers: {
    ENGLISH: "Recorded answers",
    TAMIL:   "பதிவு செய்யப்பட்ட பதில்கள்",
    HINDI:   "दर्ज उत्तर",
  },
  conflictsSection: {
    ENGLISH: "Conflicting answers — please clarify",
    TAMIL:   "முரண்பாடான பதில்கள் — தெளிவுபடுத்தவும்",
    HINDI:   "विरोधाभासी उत्तर — कृपया स्पष्ट करें",
  },
  progress: {
    ENGLISH: "Interview progress",
    TAMIL:   "நேர்காணல் முன்னேற்றம்",
    HINDI:   "साक्षात்कार प्रगति",
  },
  continueBtn: {
    ENGLISH: "Continue to eligibility",
    TAMIL:   "தகுதி சரிபார்க்கவும்",
    HINDI:   "पात्रता जांचें",
  },
  typeHere: {
    ENGLISH: "Type your answer here…",
    TAMIL:   "உங்கள் பதிலை இங்கே தட்டச்சு செய்யவும்…",
    HINDI:   "यहाँ अपना उत्तर टाइप करें…",
  },
  previousAnswer:  { ENGLISH: "Previous answer", TAMIL: "முந்தைய பதில்", HINDI: "पिछला उत्तर" },
  updatedAnswer:   { ENGLISH: "Updated answer", TAMIL: "புதுப்பிக்கப்பட்ட பதில்", HINDI: "अपडेट किया गया उत्तर" },
  progressLabel: (known: number, total: number, lang: string): string => {
    if (lang === "TAMIL") return `தகவல் சேகரிக்கப்பட்டது: ${known} / ${total} பொருள்கள்`
    if (lang === "HINDI") return `जानकारी एकत्रित: ${known} / ${total} आइटम`
    return `Information collected: ${known} of ${total} relevant items`
  },
  factsCounted: (n: number, lang: string): string => {
    if (lang === "TAMIL") return `${n} உண்மைகள் சேகரிக்கப்பட்டன.`
    if (lang === "HINDI") return `${n} तथ्य एकत्र किए गए।`
    return `${n} facts collected.`
  },
} as const

type TStringKey = {
  [K in keyof typeof T]: (typeof T)[K] extends (...args: never[]) => string ? never : K
}[keyof typeof T]

function t(key: TStringKey, lang: string): string {
  const entry = T[key] as Record<string, string>
  return entry[lang] ?? entry.ENGLISH
}

// ── Junk input detector ───────────────────────────────────────────────────────

function isJunkInput(s: string): boolean {
  const trimmed = s.trim()
  if (trimmed.length < 2) return true
  const letters = (trimmed.match(/[a-zA-Z]/g) ?? []).length
  const vowels  = (trimmed.match(/[aeiouAEIOU]/g) ?? []).length
  if (letters > 3 && vowels === 0) return true
  return false
}

// ── Evidence fact keys (for grouped display) ──────────────────────────────────

const EVIDENCE_KEYS: FactKey[] = [
  "evidence_invoice", "evidence_order_confirmation", "evidence_warranty_card",
  "evidence_photos", "evidence_videos", "evidence_chat_records",
  "evidence_emails", "evidence_service_job_sheet", "evidence_repair_receipt",
  "evidence_other",
]

// ── Component ─────────────────────────────────────────────────────────────────

export function InterviewForm() {
  const router = useRouter()
  const { caseData, setCaseData, addTimelineEvent } = useCaseContext()
  const language = (caseData.input_language as string) || "ENGLISH"

  // ── State ─────────────────────────────────────────────────────────────────
  const [factState, setFactState]       = useState<InterviewFactState>(() => buildInitialFactState(caseData))
  const [currentTopic, setCurrentTopic] = useState<FactKey | null>(null)
  const [conflictTopic, setConflictTopic] = useState<FactKey | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [answer, setAnswer]             = useState("")
  const [loading, setLoading]           = useState(false)
  const [aiError, setAiError]           = useState("")
  const [aiMode, setAiMode]             = useState<"gemini" | "fallback" | "unknown">("unknown")
  const [complete, setComplete]         = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [speechState, setSpeechState]   = useState<"idle" | "listening" | "unsupported">("idle")
  const [partial, setPartial]           = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)

  // Speech support detection (post-mount only — avoids SSR mismatch)
  useEffect(() => {
    setSpeechSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  }, [])

  // First question on mount
  useEffect(() => {
    const missing = getMissingFacts(factState)
    if (missing.length === 0) {
      setComplete(true)
      setCurrentQuestion(t("complete", language))
    } else {
      setCurrentTopic(missing[0])
      setCurrentQuestion(getFallbackQuestion(missing[0], language))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getFallbackQuestion(topic: FactKey, lang: string): string {
    return FALLBACK_Q[topic]?.[lang] ?? FALLBACK_Q[topic]?.ENGLISH ?? `Please tell us about: ${FACT_LABELS[topic]}`
  }

  // ── Speech ────────────────────────────────────────────────────────────────

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
    rec.onstart  = () => { setSpeechState("listening"); setPartial("") }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = ""; let final = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      setPartial(interim)
      if (final) {
        setAnswer(prev => (prev.trimEnd() ? `${prev.trimEnd()} ${final.trim()}` : final.trim()).slice(0, 1000))
        setPartial("")
      }
    }
    rec.onerror = () => { setSpeechState("idle"); recRef.current = null }
    rec.onend   = () => { setSpeechState("idle"); setPartial(""); recRef.current = null }
    try { rec.start() } catch { setSpeechState("idle") }
  }

  function stopSpeech() { recRef.current?.stop(); setSpeechState("idle"); setPartial("") }

  // ── Local validation gate ─────────────────────────────────────────────────
  // Client-side structural check before sending to the API.
  // Catches obviously wrong values (e.g. "yes" for a date field) immediately
  // so we don't waste an API call.

  function validateAnswerLocally(topic: FactKey | null, value: string): boolean {
    if (!topic) return true // no specific topic → let the API decide
    return isStructurallyValid(topic, value)
  }

  // ── Answer submission ─────────────────────────────────────────────────────

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = answer.trim()
    if (!trimmed || loading) return

    // 1. Reject obvious junk immediately
    if (isJunkInput(trimmed)) {
      setAiError(t("junkError", language))
      return
    }

    // 2. Client-side structural validation for well-defined field types
    //    (skip for conflict-clarification turns — any clear answer is acceptable)
    if (!conflictTopic && currentTopic) {
      if (!validateAnswerLocally(currentTopic, trimmed)) {
        setAiError(t("invalidAnswer", language))
        return
      }
    }

    setLoading(true)
    setAiError("")

    const missing     = getMissingFacts(factState)
    const nextMissing = missing.filter(k => k !== currentTopic)

    try {
      const res = await fetch("/api/interview/turn", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factState,
          userAnswer:           trimmed,
          currentQuestionTopic: currentTopic,
          conflictTopic:        conflictTopic ?? null,
          problemContext:
            (caseData.case_specific_data?.user_original_text as string) ||
            caseData.raw_problem_description || "",
          language,
          nextMissingFacts: nextMissing,
        } satisfies InterviewTurnRequest),
      })

      if (res.status === 503) {
        setAiMode("fallback")
        setAiError(t("aiNotConfigured", language))
        applyFallback(trimmed, nextMissing)
        return
      }
      if (!res.ok) {
        setAiMode("fallback")
        setAiError(t("aiError", language))
        applyFallback(trimmed, nextMissing)
        return
      }

      const data: InterviewTurnResponse = await res.json()
      setAiMode("gemini")
      setAiError("")
      applyGeminiResponse(trimmed, data)
    } catch {
      setAiMode("fallback")
      setAiError(t("aiError", language))
      applyFallback(trimmed, nextMissing)
    } finally {
      setLoading(false)
      setAnswer("")
    }
  }

  // ── Apply Gemini response ─────────────────────────────────────────────────

  function applyGeminiResponse(userAnswer: string, data: InterviewTurnResponse) {
    let next = { ...factState }

    // ── Handle conflict clarification turn ──────────────────────────────
    if (conflictTopic) {
      // The user has just clarified a conflict — record their authoritative answer
      const existing = next[conflictTopic]
      next = {
        ...next,
        [conflictTopic]: {
          key:           conflictTopic,
          status:        "KNOWN",
          value:         userAnswer,
          source:        "USER_CORRECTION" as FactSource,
          originalValue: existing?.value ?? null,
          conflictValue: undefined,
          conflictSource: undefined,
        },
      }
      setConflictTopic(null)
    } else if (currentTopic) {
      // ── Normal turn — check for conflict then apply ──────────────────
      const existing = next[currentTopic]

      // Check whether the user's answer conflicts with an existing Module 2 value
      const hasConflict =
        existing?.status === "KNOWN" &&
        detectConflict(
          currentTopic,
          existing.value ?? "",
          existing.source,
          userAnswer
        )

      if (hasConflict) {
        // Mark CONFLICT — preserve both values, do not overwrite
        next = {
          ...next,
          [currentTopic]: {
            ...existing,
            status:        "CONFLICT",
            conflictValue: userAnswer,
            conflictSource: "USER_ANSWER" as FactSource,
          } as Fact,
        }
      } else {
        // Normal write — mark KNOWN
        const isCorrection =
          existing?.status === "KNOWN" &&
          (existing.source === "MODULE2_TEXT" || existing.source === "MODULE2_FIELD" ||
           existing.source === "MODULE2_CLASSIFICATION")

        next = {
          ...next,
          [currentTopic]: {
            key:           currentTopic,
            status:        "KNOWN",
            value:         userAnswer,
            source:        (isCorrection ? "USER_CORRECTION" : "USER_ANSWER") as FactSource,
            ...(isCorrection && existing?.value ? { originalValue: existing.value } : {}),
          },
        }
      }
    }

    // ── Apply additional facts extracted by Gemini ───────────────────────
    // Only fill MISSING or UNCERTAIN slots — never silently overwrite KNOWN or CONFLICT facts
    for (const [k, v] of Object.entries(data.extracted_facts) as [FactKey, string][]) {
      const existing = next[k]
      if (!existing) continue
      if (existing.status !== "MISSING" && existing.status !== "UNCERTAIN") continue
      // Run structural validation before accepting Gemini's extraction
      if (!isStructurallyValid(k, v)) continue
      next = { ...next, [k]: { key: k, status: "KNOWN", value: v, source: "USER_ANSWER" as FactSource } }
    }

    // ── Mark uncertain facts ─────────────────────────────────────────────
    for (const k of data.uncertain_facts as FactKey[]) {
      const existing = next[k]
      // Only downgrade USER_ANSWER facts to UNCERTAIN — never touch Module 2 facts
      if (existing?.status === "KNOWN" && existing.source === "USER_ANSWER") {
        next = { ...next, [k]: { ...existing, status: "UNCERTAIN" } }
      }
      // A MISSING fact that Gemini says is uncertain stays MISSING (will be re-asked)
    }

    // ── Handle server-side conflict detection ────────────────────────────
    if (data.conflict_detected && data.conflict_fact) {
      const cf = data.conflict_fact as FactKey
      const existing = next[cf]
      if (existing?.status === "KNOWN") {
        next = {
          ...next,
          [cf]: {
            ...existing,
            status:        "CONFLICT",
            conflictValue: userAnswer,
            conflictSource: "USER_ANSWER" as FactSource,
          } as Fact,
        }
        // Ask the conflict clarification question next
        setFactState(next)
        setConflictTopic(cf)
        setCurrentTopic(cf)
        setCurrentQuestion(data.conflict_question || getFallbackQuestion(cf, language))
        return
      }
    }

    setFactState(next)
    advanceToNextQuestion(next, data)
  }

  // ── Apply fallback (no Gemini) ────────────────────────────────────────────

  function applyFallback(userAnswer: string, remaining: FactKey[]) {
    let next = { ...factState }

    if (conflictTopic) {
      // Resolve conflict in fallback mode: user's latest answer wins
      const existing = next[conflictTopic]
      next = {
        ...next,
        [conflictTopic]: {
          key:           conflictTopic,
          status:        "KNOWN",
          value:         userAnswer,
          source:        "USER_CORRECTION" as FactSource,
          originalValue: existing?.value ?? null,
        },
      }
      setConflictTopic(null)
    } else if (currentTopic) {
      const existing = next[currentTopic]
      const hasConflict =
        existing?.status === "KNOWN" &&
        detectConflict(currentTopic, existing.value ?? "", existing.source, userAnswer)

      if (hasConflict) {
        next = {
          ...next,
          [currentTopic]: {
            ...existing,
            status:        "CONFLICT",
            conflictValue: userAnswer,
            conflictSource: "USER_ANSWER" as FactSource,
          } as Fact,
        }
      } else {
        const isCorrection =
          existing?.status === "KNOWN" &&
          (existing.source === "MODULE2_TEXT" || existing.source === "MODULE2_FIELD" ||
           existing.source === "MODULE2_CLASSIFICATION")
        next = {
          ...next,
          [currentTopic]: {
            key:    currentTopic,
            status: "KNOWN",
            value:  userAnswer,
            source: (isCorrection ? "USER_CORRECTION" : "USER_ANSWER") as FactSource,
            ...(isCorrection && existing?.value ? { originalValue: existing.value } : {}),
          },
        }
      }
    }

    setFactState(next)

    // In fallback, if there's a conflict, ask for clarification next
    const conflicts = ALL_FACT_KEYS.filter(k => next[k]?.status === "CONFLICT")
    if (conflicts.length > 0) {
      const cf = conflicts[0]
      const conflictQ = buildConflictQuestion(cf, next[cf], language)
      setConflictTopic(cf)
      setCurrentTopic(cf)
      setCurrentQuestion(conflictQ)
      return
    }

    if (remaining.length === 0 || isInterviewComplete(next)) {
      setComplete(true)
      setCurrentQuestion(t("complete", language))
      setCurrentTopic(null)
    } else {
      const nextTopic = remaining[0]
      setCurrentTopic(nextTopic)
      setCurrentQuestion(getFallbackQuestion(nextTopic, language))
    }
  }

  // ── Advance to next question after a Gemini turn ─────────────────────────

  function advanceToNextQuestion(next: InterviewFactState, data: InterviewTurnResponse) {
    // Resolve any pending conflicts first
    const conflicts = ALL_FACT_KEYS.filter(k => next[k]?.status === "CONFLICT")
    if (conflicts.length > 0) {
      const cf = conflicts[0]
      const conflictQ = buildConflictQuestion(cf, next[cf], language)
      setConflictTopic(cf)
      setCurrentTopic(cf)
      setCurrentQuestion(conflictQ)
      return
    }

    if (data.interview_complete || isInterviewComplete(next)) {
      setComplete(true)
      setCurrentQuestion(t("complete", language))
      setCurrentTopic(null)
      setConflictTopic(null)
      return
    }

    const nextTopic = (data.next_question_topic as FactKey | null) ?? getMissingFacts(next)[0] ?? null
    setCurrentTopic(nextTopic)
    setConflictTopic(null)
    setCurrentQuestion(data.next_question || (nextTopic ? getFallbackQuestion(nextTopic, language) : ""))
  }

  // ── Conflict question builder ─────────────────────────────────────────────

  function buildConflictQuestion(key: FactKey, fact: Fact, lang: string): string {
    const label  = FACT_LABELS[key] ?? key
    const orig   = fact.value ?? ""
    const newer  = fact.conflictValue ?? ""
    if (lang === "TAMIL") {
      return `நீங்கள் முன்பு "${orig}" என்று கூறினீர்கள், ஆனால் இப்போது "${newer}" என்று கூறுகிறீர்கள் (${label}). எது சரியானது?`
    }
    if (lang === "HINDI") {
      return `आपने पहले "${orig}" बताया था, लेकिन अब "${newer}" कह रहे हैं (${label})। कौन सा सही है?`
    }
    return `You previously mentioned "${orig}" but now said "${newer}" (${label}). Which is correct?`
  }

  // ── Finish: persist and navigate ──────────────────────────────────────────

  async function handleFinish() {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))

    const f = factState
    const txAmount = parseFloat((f.purchase_price?.value ?? "0").replace(/[^0-9.]/g, "")) || 0

    // Build an evidence summary string from the sub-facts
    const evidenceParts = EVIDENCE_KEYS
      .filter(k => f[k]?.status === "KNOWN" && f[k]?.value?.toLowerCase() === "yes")
      .map(k => FACT_LABELS[k])
    const evidenceSummary = evidenceParts.join(", ")

    setCaseData({
      status:              "ELIGIBILITY_CHECK",
      progress_percentage: 40,
      product_service:     [f.brand?.value, f.model?.value].filter(Boolean).join(" ") || "",
      opposite_party_name: f.seller?.value || "",
      purchase_date:       f.purchase_date?.value || "",
      transaction_amount:  txAmount,
      compensation_sought: txAmount,
      total_claim_amount:  txAmount,
      defect_description:  f.problem_description?.value || "",
      company_response:    f.seller_response?.value || "",
      relief_sought:       f.relief_sought?.value || "",
      evidence_available:  evidenceSummary || (f.evidence_invoice?.value ?? ""),
      case_specific_data: {
        ...caseData.case_specific_data,
        interview_fact_state: factState,
        interview_language:   language,
        interview_mode:       aiMode,
      },
    })

    addTimelineEvent({
      event_id:  `e-interview-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label:     "AI interview completed",
      actor:     "USER",
      note:      `Facts collected: ${countKnownFacts(factState)}. Mode: ${aiMode}.`,
    })

    router.push("/eligibility")
  }

  // ── Derived values for render ─────────────────────────────────────────────

  const totalApplicable = countApplicableFacts(factState)
  const knownCount      = countKnownFacts(factState)
  const progress        = totalApplicable > 0 ? Math.round((knownCount / totalApplicable) * 100) : 0

  const knownFacts = ALL_FACT_KEYS
    .filter(k => factState[k]?.status === "KNOWN")
    .map(k => [k, factState[k]] as [FactKey, Fact])

  const conflictFacts = ALL_FACT_KEYS
    .filter(k => factState[k]?.status === "CONFLICT")
    .map(k => [k, factState[k]] as [FactKey, Fact])

  // Group known evidence facts separately for display
  const evidenceFacts   = knownFacts.filter(([k]) => EVIDENCE_KEYS.includes(k))
  const nonEvidenceFacts = knownFacts.filter(([k]) => !EVIDENCE_KEYS.includes(k))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Mode badge */}
      {aiMode !== "unknown" && (
        <div className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold ${
          aiMode === "gemini"
            ? "bg-forest/10 text-forest"
            : "bg-amber-soft text-amber-ink border border-amber-ink/20"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${aiMode === "gemini" ? "bg-forest" : "bg-amber-ink"}`} />
          {aiMode === "gemini" ? t("geminiMode", language) : t("fallbackMode", language)}
        </div>
      )}

      {/* Progress bar */}
      <div className="rounded-xl border border-softborder bg-card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-900">{t("progress", language)}</span>
          <span className="text-muted-foreground">{knownCount}/{totalApplicable}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bluesoft">
          <div
            className="h-full rounded-full bg-ink-900 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {T.progressLabel(knownCount, totalApplicable, language)}
        </p>
      </div>

      {/* Conflict alerts */}
      {conflictFacts.length > 0 && (
        <section className="rounded-xl border border-amber-ink/30 bg-amber-soft p-5">
          <h2 className="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-amber-ink">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("conflictsSection", language)}
          </h2>
          <div className="flex flex-col gap-2">
            {conflictFacts.map(([k, f]) => (
              <div key={k} className="rounded-lg border border-amber-ink/20 bg-card px-4 py-3 text-sm">
                <p className="text-xs font-semibold text-amber-ink">{FACT_LABELS[k]}</p>
                <p className="mt-0.5 text-ink-700">
                  <span className="font-medium">{t("previousAnswer", language)}:</span>{" "}
                  <span className="line-through">{f.value}</span>
                </p>
                <p className="text-ink-900">
                  <span className="font-medium">{t("updatedAnswer", language)}:</span>{" "}
                  {f.conflictValue}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recorded answers — non-evidence facts */}
      {nonEvidenceFacts.length > 0 && (
        <section className="rounded-xl border border-softborder bg-card p-5">
          <h2 className="mb-4 font-serif text-base font-bold text-ink-900">
            {t("recordedAnswers", language)}
          </h2>
          <div className="flex flex-col gap-2">
            {nonEvidenceFacts.map(([k, f]) => (
              <div key={k} className="flex items-start gap-3 rounded-lg border border-forest/20 bg-forest-soft px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-muted-foreground">{FACT_LABELS[k]}</p>
                    {f.source && (
                      <span className="rounded bg-bluesoft px-1.5 py-0.5 text-[10px] text-ink-700">
                        {SOURCE_LABELS[f.source]}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-ink-900 break-words">{f.value}</p>
                  {f.source === "USER_CORRECTION" && f.originalValue && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-through">{f.originalValue}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evidence sub-facts (grouped) */}
      {evidenceFacts.length > 0 && (
        <section className="rounded-xl border border-softborder bg-card p-5">
          <h2 className="mb-3 font-serif text-base font-bold text-ink-900">
            {language === "TAMIL" ? "ஆவணங்கள் / சாட்சியங்கள்"
              : language === "HINDI" ? "दस्तावेज़ / साक्ष्य"
              : "Documents / evidence"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {evidenceFacts.map(([k, f]) => (
              <span
                key={k}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  f.value?.toLowerCase() === "yes"
                    ? "bg-forest/10 text-forest"
                    : "bg-bluesoft text-ink-700"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                {FACT_LABELS[k]}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Current question or completion */}
      {!complete ? (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <div className="mb-4 flex items-center gap-2">
            {conflictTopic ? (
              <AlertTriangle className="h-5 w-5 text-amber-ink" />
            ) : (
              <MessageSquare className="h-5 w-5 text-amber-ink" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-ink">
              {conflictTopic ? t("conflict", language) : t("question", language)}
            </span>
          </div>

          {aiError && (
            <p className="mb-3 flex items-center gap-1.5 rounded-md border border-amber-ink/20 bg-amber-soft px-3 py-2 text-xs text-ink-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-ink" />
              {aiError}
            </p>
          )}

          <h2 className="mb-5 font-serif text-xl font-bold text-ink-900">{currentQuestion}</h2>

          <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                rows={3}
                value={answer}
                onChange={e => setAnswer(e.target.value.slice(0, 1000))}
                placeholder={t("typeHere", language)}
                className="w-full resize-none rounded-md border border-softborder bg-card px-3 py-3 text-sm text-ink-900 outline-none focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10"
              />
              {partial && <p className="mt-1 text-xs italic text-ink-700">{partial}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!answer.trim() || loading}
                className="inline-flex items-center gap-2 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{t("processing", language)}</>
                  : <>{t("next", language)} <ArrowRight className="h-4 w-4" /></>}
              </button>

              {speechSupported && speechState !== "unsupported" && (
                <button
                  type="button"
                  onClick={speechState === "listening" ? stopSpeech : startSpeech}
                  aria-label={speechState === "listening" ? "Stop recording" : "Start recording"}
                  aria-pressed={speechState === "listening"}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    speechState === "listening"
                      ? "animate-pulse border-danger-ink bg-danger-ink/10 text-danger-ink"
                      : "border-softborder bg-card text-ink-700 hover:bg-bluesoft"
                  }`}
                >
                  {speechState === "listening"
                    ? <><Square className="h-4 w-4" />{t("stop", language)}</>
                    : <><Mic className="h-4 w-4" />{t("speak", language)}</>}
                </button>
              )}
            </div>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-forest/30 bg-forest-soft p-5 md:p-6">
          <div className="mb-1 flex items-center gap-2">
            <Info className="h-4 w-4 text-forest" />
            <span className="text-xs font-semibold uppercase tracking-wide text-forest">
              {language === "TAMIL" ? "முடிந்தது" : language === "HINDI" ? "पूर्ण" : "Complete"}
            </span>
          </div>
          <p className="font-serif text-lg font-bold text-forest">{currentQuestion}</p>
          <p className="mt-2 text-sm text-ink-800">{T.factsCounted(knownCount, language)}</p>
          <button
            onClick={handleFinish}
            disabled={submitting}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" />{t("processing", language)}</>
              : <>{t("continueBtn", language)} <ArrowRight className="h-4 w-4" /></>}
          </button>
        </section>
      )}
    </div>
  )
}
