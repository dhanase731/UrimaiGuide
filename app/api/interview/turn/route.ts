// app/api/interview/turn/route.ts
// Module 3 — AI Interview turn endpoint.
// Uses @google/genai SDK (handles both AIza and AQ. key formats).
// GEMINI_API_KEY is server-side only — never sent to the browser.

import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Type, type ApiError } from "@google/genai"
import {
  ALL_FACT_KEYS,
  type InterviewFactState,
  type FactKey,
} from "@/lib/interview/facts"

export const runtime = "nodejs"

// ── Public types ─────────────────────────────────────────────────────────────

export interface InterviewTurnRequest {
  factState:            InterviewFactState
  userAnswer:           string
  currentQuestionTopic: FactKey | null
  /** Set when the current question is a CONFLICT clarification */
  conflictTopic?:       FactKey | null
  problemContext:       string
  language:             string
  nextMissingFacts:     FactKey[]
}

export interface InterviewTurnResponse {
  /**
   * Facts clearly extracted from the user's answer.
   * Keys are FactKey strings; values are the extracted string values.
   * An empty object means nothing was reliably extracted.
   */
  extracted_facts:    Partial<Record<FactKey, string>>
  /**
   * Facts the user mentioned but that could not be reliably structured
   * (ambiguous date, unclear yes/no, gibberish, etc.).
   */
  uncertain_facts:    FactKey[]
  /** The topic of the next question Gemini chose, or null if complete. */
  next_question_topic: FactKey | null
  /** The natural-language question to ask next, in the user's language. */
  next_question:      string
  /** True when Gemini determined clarification is needed. */
  needs_clarification: boolean
  interview_complete:  boolean
  /**
   * Set when the user's answer conflicts with an existing known fact.
   * The form uses this to set CONFLICT status rather than silently overwriting.
   */
  conflict_detected?:  boolean
  conflict_fact?:      FactKey | null
  conflict_question?:  string
  /** "gemini" or "fallback" — lets the UI show the correct mode badge. */
  mode?: "gemini" | "fallback"
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
  ENGLISH: "English",
  TAMIL:   "Tamil",
  HINDI:   "Hindi",
}

// Default Gemini Flash model supported by @google/genai
const DEFAULT_MODEL = "gemini-3.6-flash"

// ── Schema Definition for Structured Output ───────────────────────────────────

const extractedFactsProperties: Record<string, { type: Type; description: string }> = {}
for (const k of ALL_FACT_KEYS) {
  extractedFactsProperties[k] = {
    type: Type.STRING,
    description: `Extracted string value for ${k} if mentioned in user answer`,
  }
}

const interviewResponseSchema = {
  type: Type.OBJECT,
  properties: {
    extracted_facts: {
      type: Type.OBJECT,
      properties: extractedFactsProperties,
      description: "Any facts clearly extracted from the user's answer (keys must be valid FactKeys)",
    },
    uncertain_facts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of FactKey strings that were ambiguous or failed validation",
    },
    next_question_topic: {
      type: Type.STRING,
      description: "FactKey of the next question to ask, or null if complete",
      nullable: true,
    },
    next_question: {
      type: Type.STRING,
      description: "Natural language question in the requested language",
    },
    needs_clarification: {
      type: Type.BOOLEAN,
      description: "True if user answer was ambiguous or invalid",
    },
    interview_complete: {
      type: Type.BOOLEAN,
      description: "True ONLY when STILL REQUIRED FACTS is empty and there are no conflicts",
    },
    conflict_detected: {
      type: Type.BOOLEAN,
      description: "True if user answer contradicts an existing known fact",
    },
    conflict_fact: {
      type: Type.STRING,
      description: "FactKey of the conflicting fact",
      nullable: true,
    },
    conflict_question: {
      type: Type.STRING,
      description: "Clarification question asking user to resolve the conflict",
    },
  },
  required: [
    "extracted_facts",
    "uncertain_facts",
    "next_question",
    "needs_clarification",
    "interview_complete",
    "conflict_detected",
  ],
}

// ── System instruction ────────────────────────────────────────────────────────

function buildSystemInstruction(langName: string): string {
  return `You are a structured fact-extraction assistant for an Indian consumer electronics complaint system.

YOUR ONLY JOBS:
1. Extract explicitly stated facts from the user's answer into extracted_facts (e.g., brand, model, purchase_price, purchase_platform, purchase_date, etc.).
2. Identify whether the answer conflicts with an already-known fact.
3. Generate the single best next question.

ABSOLUTE RULES — never break these:
1. NEVER invent, assume, or infer any fact not explicitly stated by the user.
2. NEVER fabricate dates, prices, warranty status, documents, seller responses, or any detail.
3. NEVER provide legal advice, legal conclusions, or predict outcomes.
4. NEVER decide that the interview is complete on your own — only set interview_complete:true when the STILL REQUIRED FACTS list is empty.
5. Ask exactly ONE focused question at a time.
6. Write every question in ${langName}.
7. Preserve the user's exact words when extracting facts — do not paraphrase.

VALIDATION RULES:
- YES/NO fields (repair_attempted, seller_contacted, replacement_requested, refund_requested, physical_damage, problem_still_occurring, evidence_*):
  Accept only clear yes/no answers. Anything vague or unclear → add to uncertain_facts, do NOT put in extracted_facts.
- DATE fields (purchase_date):
  Accept a recognisable date expression. Normalise to YYYY-MM-DD where possible.
  Bare words like "yes", "today", "nj", "nm" are NOT valid dates → uncertain_facts.
- PRICE fields (purchase_price):
  Accept only answers that contain an explicit number. "yes", "cheap", "expensive" are not prices → uncertain_facts.
- TIMING fields (problem_timing):
  Accept relative expressions such as "after 10 days", "2 weeks later", "immediately".
  A bare "yes" or gibberish → uncertain_facts.
- REPAIR/SERVICE details (repair_details):
  Must describe an actual repair event. A bare "yes" is NOT repair_details → uncertain_facts.
- Random or gibberish input (e.g. "nj", "nm", "kjm", "jkm", "abc", "xyz"):
  Always → uncertain_facts, never extracted_facts.

CONFLICT DETECTION:
- If the ALREADY KNOWN FACTS section shows a value for the current topic, and the user's answer clearly contradicts it, set conflict_detected:true, conflict_fact to that key, and write a conflict_question asking the user to confirm which value is correct. Do NOT silently overwrite.
- Example: known problem_timing = "10 days after purchase", user now says "today" → conflict.
- Example: known seller = "Amazon", user now says "Flipkart" → conflict.

CONDITIONAL LOGIC (apply when choosing the next question):
- repair_attempted = "No"  →  skip repair_details, evidence_service_job_sheet, evidence_repair_receipt
- seller_contacted = "No"  →  skip seller_response, seller_contact_date, complaint_ref_number, replacement_requested, refund_requested
- physical_damage  = "Yes" →  note this; it affects warranty/repair context

EVIDENCE QUESTIONS:
- Ask about evidence as a group: "What documents or evidence do you have?"
- Then extract each mentioned type into its own evidence_* key (evidence_invoice, evidence_photos, etc.)
- Do NOT ask about evidence types the user already mentioned.
- Do NOT invent evidence.`
}

// ── User prompt ───────────────────────────────────────────────────────────────

function buildUserPrompt(req: InterviewTurnRequest, langName: string): string {
  // Known facts — always shown so Gemini does not re-ask them
  const knownLines = Object.entries(req.factState || {})
    .filter(([, f]) => f.status === "KNOWN")
    .map(([k, f]) => `  ${k}: ${f.value} [source:${f.source ?? "unknown"}]`)
    .join("\n")

  // Conflict facts — shown so Gemini knows about pending disputes
  const conflictLines = Object.entries(req.factState || {})
    .filter(([, f]) => f.status === "CONFLICT")
    .map(([k, f]) =>
      `  ${k}: existing="${f.value}" vs new="${f.conflictValue ?? "?"}" [UNRESOLVED CONFLICT]`
    )
    .join("\n")

  const missingList = (req.nextMissingFacts || []).slice(0, 8).join(", ")
  const isConflictTurn = !!req.conflictTopic
  const trimmedContext = (req.problemContext || "").slice(0, 500)

  return `ORIGINAL PROBLEM DESCRIPTION:
"${trimmedContext}"

ALREADY KNOWN FACTS (do NOT ask about these):
${knownLines || "  (none yet)"}

${conflictLines ? `UNRESOLVED CONFLICTS (must be clarified before completion):\n${conflictLines}\n` : ""}\
CURRENT QUESTION TOPIC: ${req.currentQuestionTopic ?? "initial"}${isConflictTurn ? " [CONFLICT CLARIFICATION]" : ""}
USER'S ANSWER: "${req.userAnswer}"

STILL REQUIRED FACTS (priority order, ask the first applicable one): ${missingList || "none — interview may be complete"}

TASK:
1. Extract ALL facts explicitly mentioned in the user's answer into extracted_facts (e.g., brand, model, purchase_price, purchase_platform, purchase_date, etc.).
2. Evaluate the user's answer for "${req.currentQuestionTopic ?? "initial"}":
   - Apply all VALIDATION RULES above.
   - Check for CONFLICT against existing known facts.
   - If ambiguous/invalid: put topic key in uncertain_facts.
   - If conflict: set conflict_detected:true, conflict_fact, conflict_question.
3. Apply CONDITIONAL LOGIC to skip irrelevant facts.
4. Choose the single most important next fact from STILL REQUIRED FACTS.
5. Write a natural, concise question in ${langName} for that next topic.
6. Only set interview_complete:true if STILL REQUIRED FACTS is "none — interview may be complete" AND there are no unresolved conflicts.`
}

// ── Safe JSON parser ──────────────────────────────────────────────────────────

function safeParseGeminiJSON(raw: string): InterviewTurnResponse | null {
  let cleaned = raw.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  const start = cleaned.indexOf("{")
  const end   = cleaned.lastIndexOf("}")
  if (start === -1 || end === -1) return null
  cleaned = cleaned.slice(start, end + 1)

  try {
    const p = JSON.parse(cleaned)
    if (typeof p.next_question !== "string") return null
    if (typeof p.interview_complete !== "boolean") return null

    // Filter extracted_facts to only non-empty strings with known keys
    const extractedClean: Partial<Record<FactKey, string>> = {}
    if (p.extracted_facts && typeof p.extracted_facts === "object") {
      for (const [k, v] of Object.entries(p.extracted_facts)) {
        if (typeof v === "string" && v.trim().length > 0) {
          extractedClean[k as FactKey] = v.trim()
        }
      }
    }

    return {
      extracted_facts:    extractedClean,
      uncertain_facts:    Array.isArray(p.uncertain_facts) ? p.uncertain_facts : [],
      next_question_topic: (p.next_question_topic && typeof p.next_question_topic === "string")
                            ? (p.next_question_topic as FactKey)
                            : null,
      next_question:       p.next_question,
      needs_clarification: Boolean(p.needs_clarification),
      interview_complete:  Boolean(p.interview_complete),
      conflict_detected:   Boolean(p.conflict_detected),
      conflict_fact:       (p.conflict_fact && typeof p.conflict_fact === "string")
                            ? (p.conflict_fact as FactKey)
                            : null,
      conflict_question:   typeof p.conflict_question === "string" ? p.conflict_question : "",
      mode: "gemini",
    }
  } catch {
    return null
  }
}

// ── Bounded Retry Helper for Transient Errors ─────────────────────────────────

async function generateContentWithRetry(
  ai: GoogleGenAI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
  maxRetries = 2
) {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const jitter = Math.random() * 400
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + jitter, 4000)
        await new Promise(r => setTimeout(r, delay))
      }
      return await ai.models.generateContent(params)
    } catch (err: unknown) {
      lastError = err
      const apiErr = err as ApiError
      const status = apiErr?.status ?? 0
      const msg = apiErr?.message ?? String(err)
      const isTransient =
        status === 429 ||
        status === 503 ||
        status === 0 ||
        msg.toLowerCase().includes("fetch failed") ||
        msg.toLowerCase().includes("unavailable") ||
        msg.toLowerCase().includes("high demand") ||
        msg.toLowerCase().includes("econnreset") ||
        msg.toLowerCase().includes("socket")

      if (!isTransient || attempt === maxRetries) {
        throw err
      }
    }
  }
  throw lastError
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── API key check ────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    console.warn(
      "[interview/turn:NOT_CONFIGURED] GEMINI_API_KEY not set in .env.local — " +
      "add it and restart the dev server to enable AI interview."
    )
    return NextResponse.json(
      {
        error:  "NOT_CONFIGURED",
        detail: "GEMINI_API_KEY is missing. Add it to .env.local and restart.",
      },
      { status: 503 }
    )
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: InterviewTurnRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST", detail: "Could not parse JSON body." },
      { status: 400 }
    )
  }

  if (!body.userAnswer || !body.language) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", detail: "userAnswer and language are required." },
      { status: 400 }
    )
  }

  const langName = LANG_NAMES[body.language] ?? "English"
  const model    = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL

  // ── Call Gemini via SDK ──────────────────────────────────────────────────
  const ai = new GoogleGenAI({ apiKey })

  let rawText = ""
  try {
    const response = await generateContentWithRetry(ai, {
      model,
      contents: buildUserPrompt(body, langName),
      config: {
        systemInstruction: buildSystemInstruction(langName),
        temperature:       0.15,
        maxOutputTokens:   1000,
        responseMimeType:  "application/json",
        responseSchema:    interviewResponseSchema,
        thinkingConfig:    { thinkingBudget: 0 },
        httpOptions:       { timeout: 25000 },
      },
    })
    rawText = response.text?.trim() ?? ""
  } catch (err: unknown) {
    const apiErr = err as ApiError
    const status  = apiErr?.status  ?? 0
    const message = apiErr?.message ?? String(err)
    const msgLower = message.toLowerCase()

    if (status === 401 || status === 403) {
      console.error(`[interview/turn:AUTH_ERROR] status: ${status}, model: ${model}`)
      return NextResponse.json(
        { error: "AI_AUTH_FAILED", detail: "Gemini authentication failed. Check GEMINI_API_KEY." },
        { status: 502 }
      )
    }
    if (status === 404) {
      console.error(`[interview/turn:MODEL_ERROR] Model '${model}' not found for this API key.`)
      return NextResponse.json(
        {
          error:  "AI_MODEL_NOT_FOUND",
          detail: `Model '${model}' not available for this API key. Update GEMINI_MODEL in .env.local.`,
        },
        { status: 502 }
      )
    }
    if (status === 429) {
      console.warn(`[interview/turn:RATE_LIMIT] Quota or rate limit reached for model: ${model}`)
      return NextResponse.json(
        { error: "AI_RATE_LIMITED", detail: "Gemini quota or rate limit reached. Try again shortly." },
        { status: 429 }
      )
    }
    if (msgLower.includes("timeout") || msgLower.includes("aborted")) {
      console.error(`[interview/turn:TIMEOUT] Request timed out for model: ${model}`)
      return NextResponse.json(
        { error: "AI_TIMEOUT", detail: "Gemini request timed out." },
        { status: 502 }
      )
    }
    if (status === 0 || msgLower.includes("fetch failed") || msgLower.includes("econnreset") || msgLower.includes("socket")) {
      console.error(`[interview/turn:NETWORK_ERROR] Network/socket failure communicating with model: ${model}`)
      return NextResponse.json(
        { error: "NETWORK_ERROR", detail: "Network error communicating with Gemini service." },
        { status: 502 }
      )
    }

    console.error(`[interview/turn:AI_ERROR] status: ${status}, model: ${model}, reason: ${message.slice(0, 150)}`)
    return NextResponse.json(
      { error: "AI_ERROR", detail: `Gemini error (${status || "unknown"}).` },
      { status: 502 }
    )
  }

  // ── Validate Gemini produced text ────────────────────────────────────────
  if (!rawText) {
    console.error(`[interview/turn:EMPTY_RESPONSE] Gemini returned empty response text. Model: ${model}`)
    return NextResponse.json(
      { error: "AI_EMPTY_RESPONSE", detail: "Gemini produced no text output." },
      { status: 502 }
    )
  }

  // ── Parse structured JSON ────────────────────────────────────────────────
  const parsed = safeParseGeminiJSON(rawText)
  if (!parsed) {
    console.error(`[interview/turn:JSON_PARSE_ERROR] Failed to parse structured JSON: ${rawText.slice(0, 200)}`)
    return NextResponse.json(
      { error: "AI_PARSE_ERROR", detail: "Gemini response was not valid structured JSON." },
      { status: 502 }
    )
  }

  return NextResponse.json(parsed)
}
