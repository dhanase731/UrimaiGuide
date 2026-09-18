"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Mic, Square, Type, Loader2, ArrowRight, AlertCircle, Brain,
  FileText, Image as ImageIcon, Video, MessageSquare, X, CheckCircle2,
  Smartphone, Laptop, Tv, Refrigerator, Zap, Sparkles, RotateCcw,
} from "lucide-react"
import { LANGUAGES, type PreferredLanguage } from "@/lib/registration"
import { useCaseContext } from "@/lib/case-context"
import { classifyElectronics } from "@/lib/electronics"
import { useIntakeT, DEVICE_LABELS, ISSUE_LABELS } from "@/lib/i18n/intake"

const MIN_CHARS = 20
const MAX_CHARS = 2000

const SPEECH_LANG: Record<PreferredLanguage, string> = {
  ENGLISH: "en-IN",
  TAMIL: "ta-IN",
  HINDI: "hi-IN",
}

type SpeechState = "idle" | "listening" | "error" | "unsupported"

type UploadedFile = {
  id: string; name: string
  type: "invoice" | "chat" | "photo" | "video" | "email" | "other"
  size: string
}

const DEVICE_SEED: {
  icon: React.ElementType
  labelKey: "deviceMobile"|"deviceLaptop"|"deviceTV"|"deviceFridge"|"deviceCharger"
  devKey: string
  seed: Record<PreferredLanguage, string>
}[] = [
  { icon: Smartphone, labelKey: "deviceMobile", devKey: "MOBILE_PHONE",
    seed: { ENGLISH: "I have a problem with my mobile phone.",
            TAMIL: "என் மொபைல் போனில் பிரச்சனை உள்ளது.",
            HINDI: "मेरे मोबाइल फोन में समस्या है।" } },
  { icon: Laptop, labelKey: "deviceLaptop", devKey: "LAPTOP",
    seed: { ENGLISH: "I have a problem with my laptop.",
            TAMIL: "என் லேப்டாப்பில் பிரச்சனை உள்ளது.",
            HINDI: "मेरे लैपटॉप में समस्या है।" } },
  { icon: Tv, labelKey: "deviceTV", devKey: "TELEVISION",
    seed: { ENGLISH: "I have a problem with my TV.",
            TAMIL: "என் TVயில் பிரச்சனை உள்ளது.",
            HINDI: "मेरे TV में समस्या है।" } },
  { icon: Refrigerator, labelKey: "deviceFridge", devKey: "REFRIGERATOR",
    seed: { ENGLISH: "I have a problem with my refrigerator.",
            TAMIL: "என் குளிர்சாதனத்தில் பிரச்சனை உள்ளது.",
            HINDI: "मेरे फ्रिज में समस्या है।" } },
  { icon: Zap, labelKey: "deviceCharger", devKey: "CHARGER_POWER_BANK",
    seed: { ENGLISH: "I have a problem with my charger.",
            TAMIL: "என் சார்ஜரில் பிரச்சனை உள்ளது.",
            HINDI: "मेरे चार्जर में समस्या है।" } },
]

function fileTypeFromName(name: string): UploadedFile["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg","jpeg","png","webp","heic"].includes(ext)) return "photo"
  if (["mp4","mov","avi","mkv","webm"].includes(ext)) return "video"
  if (ext === "pdf") return "invoice"
  return "other"
}
export function IntakeForm() {
  const router = useRouter()
  const { user, setCaseData, addTimelineEvent } = useCaseContext()
  const [language, setLanguage] = useState<PreferredLanguage>(
    user.preferred_language || "ENGLISH"
  )
  const [mode, setMode] = useState<"text" | "voice">("text")
  const [text, setText] = useState("")
  const [speechState, setSpeechState] = useState<SpeechState>("idle")
  const [partial, setPartial] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [error, setError] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [electronicsResult, setElectronicsResult] = useState<ReturnType<typeof classifyElectronics> | null>(null)
  const [userSelectedDevice, setUserSelectedDevice] = useState<string | null>(null)
  const [corrState, setCorrState] = useState<"idle"|"loading"|"shown"|"error">("idle")
  const [corrError, setCorrError] = useState("")
  const [origText, setOrigText] = useState("")
  const [corrText, setCorrText] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null)
  const t = useIntakeT(language)

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

  useEffect(() => {
    recRef.current?.stop()
    recRef.current = null
    setSpeechState("idle")
    setPartial("")
  }, [language, mode])

  function runClassifier(val: string) {
    if (val.trim().length > 30) {
      setElectronicsResult(classifyElectronics(val))
    } else {
      setElectronicsResult(null)
    }
  }

  function handleTextChange(val: string) {
    const s = val.slice(0, MAX_CHARS)
    setText(s)
    runClassifier(s)
    if (corrState === "shown") setCorrState("idle")
  }

  function handleDeviceSeed(seed: Record<PreferredLanguage, string>, devKey: string) {
    if (!text) handleTextChange(seed[language])
    setUserSelectedDevice(devKey)
  }

  function startSpeech() {
    if (!speechSupported) { setSpeechState("unsupported"); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Win = window as any
    const SR: any = Win.SpeechRecognition || Win.webkitSpeechRecognition
    if (!SR) { setSpeechState("unsupported"); return }
    const rec = new SR()
    rec.lang = SPEECH_LANG[language]
    rec.continuous = true
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
      if (final) {
        setText(prev => {
          const tr = prev.trimEnd()
          if (!tr) return final.trim()
          const sep = /[.!?]$/.test(tr) ? " " : ". "
          return (tr + sep + final.trim()).slice(0, MAX_CHARS)
        })
        setPartial("")
      }
    }
    rec.onerror = (e: any) => {
      setSpeechState("error")
      setError(e.error === "not-allowed" ? t.speechPermissionDenied : t.speechError)
      recRef.current = null
    }
    rec.onend = () => { setSpeechState("idle"); setPartial(""); recRef.current = null }
    try { rec.start() } catch { setSpeechState("error"); setError(t.speechError) }
  }

  function stopSpeech() {
    recRef.current?.stop()
    setSpeechState("idle")
    setPartial("")
  }

  function toggleSpeech() {
    if (speechState === "listening") stopSpeech()
    else startSpeech()
  }
  async function handleAICorrection() {
    if (text.trim().length < MIN_CHARS) return
    setCorrState("loading"); setCorrError("")
    try {
      const res = await fetch("/api/intake/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), language }),
      })
      if (res.status === 503) {
        setCorrState("error"); setCorrError(t.correctionNotConfigured); return
      }
      if (!res.ok) {
        setCorrState("error"); setCorrError(t.correctionNetworkError); return
      }
      const data = await res.json()
      if (!data.changed) {
        setCorrState("error"); setCorrError(t.correctionNoChange); return
      }
      setOrigText(data.originalText)
      setCorrText(data.correctedText)
      setCorrState("shown")
    } catch {
      setCorrState("error"); setCorrError(t.correctionNetworkError)
    }
  }

  function applyCorrection() {
    setText(corrText); runClassifier(corrText); setCorrState("idle")
  }

  function discardCorrection() {
    setText(origText); runClassifier(origText); setCorrState("idle")
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setUploadedFiles(prev => [...prev, ...files.map(f => ({
      id: `f-${Date.now()}-${Math.random()}`,
      name: f.name,
      type: fileTypeFromName(f.name),
      size: f.size > 1048576 ? `${(f.size/1048576).toFixed(1)} MB` : `${Math.round(f.size/1024)} KB`,
    }))])
    e.target.value = ""
  }

  function removeFile(id: string) {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (text.trim().length < MIN_CHARS) { setError(t.errorMinChars(MIN_CHARS)); return }
    setError(""); setSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    const caseId = `3f9a2c7e-1b84-4d52-9a6f-${Date.now()}`
    const electronics = classifyElectronics(text)
    setCaseData({
      case_id: caseId, case_number: "", status: "NLP_CLASSIFICATION",
      progress_percentage: 10, raw_problem_description: text.trim(),
      input_language: language, input_mode: mode === "voice" ? "VOICE" : "TEXT",
    })
    addTimelineEvent({
      event_id: `e-intake-${Date.now()}`, timestamp: new Date().toISOString(),
      label: "Problem described", actor: "USER",
      note: text.trim().slice(0, 100) + (text.length > 100 ? "…" : ""),
    })
    setClassifying(true)
    await new Promise(r => setTimeout(r, 1200))
    setCaseData({
      status: "AI_INTERVIEW", progress_percentage: 20,
      primary_case_type: "DEFECTIVE_GOODS",
      primary_case_type_label: "Defective Electronic Goods",
      confidence_score: electronics.confidence,
      sub_category: electronics.device_category,
      sector: "ELECTRONICS", opposite_party_type: "SELLER", is_consumer_case: true,
      case_specific_data: {
        electronics_classification: electronics,
        uploaded_files: uploadedFiles,
        platform_detected: electronics.platform_detected,
        input_language: language,
        user_original_text: corrState === "shown" ? origText : text.trim(),
        ai_corrected_text: corrState === "shown" ? corrText : null,
        user_selected_device: userSelectedDevice,
        detected_device: electronics.device_category,
        detected_issues: electronics.issue_types,
        classification_confidence: electronics.confidence,
      },
    })
    addTimelineEvent({
      event_id: `e-nlp-${Date.now()}`, timestamp: new Date().toISOString(),
      label: "AI classified complaint", actor: "SYSTEM",
      note: `Device: ${electronics.device_label} · Confidence: ${electronics.confidence}`,
    })
    router.push("/interview")
  }

  const count = text.trim().length
  const effectiveDevice = userSelectedDevice ?? electronicsResult?.device_category ?? null
  const deviceLabelLocalized = effectiveDevice ? (DEVICE_LABELS[language][effectiveDevice] ?? effectiveDevice) : null
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <div className="mb-4 rounded-md border border-amber-ink/20 bg-amber-soft px-3 py-2">
          <p className="text-xs text-ink-800">{t.scopeNotice}</p>
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex overflow-hidden rounded-md border border-softborder"
            role="group" aria-label={t.langGroupLabel}>
            {LANGUAGES.map(lang => (
              <button key={lang.value} type="button"
                onClick={() => setLanguage(lang.value)}
                aria-pressed={language === lang.value}
                className={`px-3 py-2 text-sm font-semibold transition-colors ${language === lang.value ? "bg-ink-900 text-parchment" : "bg-card text-ink-700 hover:bg-bluesoft"}`}>
                {lang.native}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden rounded-md border border-softborder"
            role="group" aria-label={t.modeGroupLabel}>
            <button type="button" onClick={() => setMode("text")}
              aria-pressed={mode === "text"}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${mode === "text" ? "bg-ink-900 text-parchment" : "bg-card text-ink-700 hover:bg-bluesoft"}`}>
              <Type className="h-4 w-4" />{t.modeType}
            </button>
            <button type="button" onClick={() => setMode("voice")}
              aria-pressed={mode === "voice"}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors ${mode === "voice" ? "bg-ink-900 text-parchment" : "bg-card text-ink-700 hover:bg-bluesoft"}`}>
              <Mic className="h-4 w-4" />{t.modeSpeak}
            </button>
          </div>
        </div>
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.deviceHeading}
          </p>
          <div className="flex flex-wrap gap-2">
            {DEVICE_SEED.map(({ icon: Icon, labelKey, devKey, seed }) => (
              <button key={devKey} type="button"
                onClick={() => handleDeviceSeed(seed, devKey)}
                aria-pressed={userSelectedDevice === devKey}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${userSelectedDevice === devKey ? "border-ink-900 bg-ink-900 text-parchment" : "border-softborder bg-card text-ink-700 hover:bg-bluesoft hover:border-ink-900"}`}>
                <Icon className="h-3.5 w-3.5" />{t[labelKey]}
              </button>
            ))}
          </div>
        </div>
        {mode === "voice" && (
          <div className="mb-4 flex flex-col items-center gap-3 rounded-lg border border-amber-ink/30 bg-amber-soft p-6 text-center">
            {!speechSupported || speechState === "unsupported" ? (
              <p className="text-sm font-medium text-danger-ink">{t.speechUnsupported}</p>
            ) : (
              <>
                <button type="button" onClick={toggleSpeech}
                  aria-label={speechState === "listening" ? t.speechStop : t.speechStart}
                  aria-pressed={speechState === "listening"}
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-parchment transition-colors ${speechState === "listening" ? "animate-pulse bg-danger-ink" : "bg-ink-900 hover:bg-ink-800"}`}>
                  {speechState === "listening" ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}
                </button>
                <p className="text-sm font-medium text-ink-900">
                  {speechState === "listening" ? t.speechListening : t.speechTap}
                </p>
                {partial && (
                  <p className="text-xs italic text-ink-700">{t.speechPartial} {partial}</p>
                )}
              </>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label htmlFor="problem" className="mb-1.5 block text-sm font-semibold text-ink-900">
            {t.problemLabel}
          </label>
          <textarea id="problem" value={text}
            onChange={e => handleTextChange(e.target.value)}
            rows={7} placeholder={t.problemPlaceholder}
            aria-describedby="char-status char-count"
            className="w-full resize-y rounded-md border border-softborder bg-card px-3 py-3 text-sm leading-relaxed text-ink-900 outline-none focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span id="char-status" className={count < MIN_CHARS ? "text-muted-foreground" : "text-forest"}>
              {count < MIN_CHARS ? t.charCountNeeded(MIN_CHARS - count) : t.charCountOk}
            </span>
            <span id="char-count" className="text-muted-foreground">
              {t.charCountOf(count, MAX_CHARS)}
            </span>
          </div>          {count >= MIN_CHARS && corrState !== "shown" && (
            <div className="mt-3">
              <button type="button" onClick={handleAICorrection}
                disabled={corrState === "loading"}
                className="inline-flex items-center gap-1.5 rounded-md border border-softborder bg-card px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-bluesoft disabled:opacity-60">
                {corrState === "loading"
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t.correcting}</>
                  : <><Sparkles className="h-3.5 w-3.5" />{t.btnCorrect}</>}
              </button>
              {corrState === "error" && corrError && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 shrink-0" />{corrError}
                </p>
              )}
            </div>
          )}
          {corrState === "shown" && (
            <div className="mt-3 rounded-lg border border-bluesoft bg-bluesoft/30 p-4">
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {t.correctionOriginalLabel}
                  </p>
                  <p className="text-xs leading-relaxed text-ink-700">{origText}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-forest">
                    {t.correctionCorrectedLabel}
                  </p>
                  <p className="text-xs leading-relaxed text-ink-900">{corrText}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={applyCorrection}
                  className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3 py-1.5 text-xs font-bold text-parchment hover:bg-ink-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />{t.btnUseCorrection}
                </button>
                <button type="button" onClick={discardCorrection}
                  className="inline-flex items-center gap-1.5 rounded-md border border-softborder bg-card px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-bluesoft">
                  <RotateCcw className="h-3.5 w-3.5" />{t.btnKeepOriginal}
                </button>
              </div>
            </div>
          )}
          {electronicsResult && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-forest/20 bg-forest-soft px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-forest" />
              <span className="text-xs font-semibold text-forest">{t.deviceDetected}:</span>
              <span className="rounded-md bg-forest px-2 py-0.5 text-[10px] font-bold text-parchment">
                {deviceLabelLocalized ?? electronicsResult.device_label}
              </span>
              {electronicsResult.issue_types.slice(0, 2).map(issue => (
                <span key={issue} className="rounded-md border border-forest/20 bg-card px-2 py-0.5 text-[10px] font-semibold text-forest">
                  {ISSUE_LABELS[language][issue] ?? issue}
                </span>
              ))}
              {electronicsResult.platform_detected && (
                <span className="rounded-md border border-amber-ink/20 bg-amber-soft px-2 py-0.5 text-[10px] font-semibold text-amber-ink">
                  {t.platformDetected}: {electronicsResult.platform_detected}
                </span>
              )}
              {electronicsResult.confidence < 0.7 && (
                <span className="text-[10px] text-muted-foreground">{t.lowConfidence}</span>
              )}
            </div>
          )}
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
                  <p className="text-sm font-semibold text-ink-900">{t.classifyingTitle}</p>
                  <p className="text-xs text-ink-700">{t.classifyingBody}</p>
                </div>
              </div>
            ) : (
              <button type="submit" disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink-900 px-6 py-3.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-60">
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" />{t.btnCreating}</>
                  : <>{t.btnAnalyze} <ArrowRight className="h-4 w-4" /></>}
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-1 font-serif text-base font-bold text-ink-900">{t.evidenceTitle}</h2>
        <p className="mb-4 text-xs text-muted-foreground">{t.evidenceDescription}</p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([
            { icon: FileText, labelKey: "evidenceInvoice" as const, accept: ".pdf,.doc,.docx" },
            { icon: MessageSquare, labelKey: "evidenceChat" as const, accept: ".pdf,.txt,.png,.jpg" },
            { icon: ImageIcon, labelKey: "evidencePhotos" as const, accept: "image/*" },
            { icon: Video, labelKey: "evidenceVideo" as const, accept: "video/*" },
          ] as const).map(({ icon: Icon, labelKey, accept }) => (
            <button key={labelKey} type="button" aria-label={t[labelKey]}
              onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = accept; fileInputRef.current.click() } }}
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-softborder bg-parchment p-4 text-center transition-colors hover:border-ink-900 hover:bg-bluesoft">
              <Icon className="h-5 w-5 text-amber-ink" />
              <span className="text-xs font-semibold text-ink-700">{t[labelKey]}</span>
            </button>
          ))}
        </div>
        <input ref={fileInputRef} type="file" multiple className="sr-only"
          onChange={handleFileUpload} aria-label="Upload evidence files" />
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            {uploadedFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-forest/20 bg-forest-soft px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-forest" />
                  <div>
                    <p className="text-xs font-semibold text-ink-900">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{f.size} · {f.type}</p>
                  </div>
                </div>
                <button type="button" onClick={() => removeFile(f.id)}
                  aria-label={`${t.btnRemove} ${f.name}`}
                  className="rounded p-1 text-muted-foreground hover:text-danger-ink">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <p className="mt-1 text-xs font-semibold text-forest">
              {t.evidenceFilesUploaded(uploadedFiles.length)}
            </p>
          </div>
        )}
        <div className="mt-3 rounded-md border border-amber-ink/20 bg-amber-soft px-3 py-2.5">
          <p className="text-xs text-ink-800">
            <span className="font-semibold">{t.evidenceAINote}: </span>
            {t.evidenceSupported}
          </p>
        </div>
      </section>
    </div>
  )
}
