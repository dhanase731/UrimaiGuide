import { NextRequest, NextResponse } from "next/server"
import type { InterviewFactState, FactKey } from "@/lib/interview/facts"

export const runtime = "nodejs"

const LANG_NAMES: Record<string, string> = {
  ENGLISH: "English",
  TAMIL: "Tamil",
  HINDI: "Hindi",
}

export interface InterviewTurnRequest {
  factState: InterviewFactState
  userAnswer: string
  currentQuestionTopic: FactKey | null
  problemContext: string
  language: string
  nextMissingFacts: FactKey[]
}

export interface InterviewTurnResponse {
  extracted_facts: Partial<Record<FactKey, string>>
  uncertain_facts: FactKey[]
  next_question_topic: FactKey | null
  next_question: string
  needs_clarification: boolean
  interview_complete: boolean
}

function buildSystemPrompt(langName: string): string {
  return `You are an information-gathering assistant for an Indian consumer complaint system.
Your ONLY job is to extract facts from the user's answer and generate the next interview question.

ABSOLUTE RULES — never break these:
1. Do NOT invent, assume, or infer any fact not explicitly stated by the user.
2. Do NOT provide legal advice, legal conclusions, or predict outcomes.
3. Do NOT tell the user they will win or lose.
4. Do NOT fabricate dates, prices, warranty status, documents, or seller responses.
5. If a fact is unclear or ambiguous, mark it as uncertain — do not guess.
6. Ask exactly ONE focused question at a time.
7. All questions and messages must be in ${langName}.
8. Preserve the user's original words when extracting facts.`
}

function buildUserPrompt(req: InterviewTurnRequest, langName: string): string {
  const knownFacts = Object.entries(req.factState)
    .filter(([, f]) => f.status === "KNOWN")
    .map(([k, f]) => `  ${k}: ${f.value}`)
    .join("\n")

  const missingList = req.nextMissingFacts.slice(0, 5).join(", ")

  return `CONTEXT:
Original problem description: "${req.problemContext}"

ALREADY KNOWN FACTS:
${knownFacts || "  (none yet)"}

CURRENT QUESTION TOPIC: ${req.currentQuestionTopic ?? "initial"}
USER'S ANSWER: "${req.userAnswer}"

STILL MISSING FACTS (in priority order): ${missingList || "none"}

TASK:
1. Extract only facts the user explicitly stated in their answer. Do not invent anything.
2. If the answer is unclear for the current topic, mark it as uncertain.
3. Choose the most important missing fact from the list above as the next question topic.
4. Write a natural, conversational question in ${langName} to ask about that topic.
5. If no facts are missing, set interview_complete to true and next_question to a closing message in ${langName}.

Respond with ONLY valid JSON in this exact structure:
{
  "extracted_facts": { "fact_key": "user's exact words or extracted value" },
  "uncertain_facts": ["fact_key_if_unclear"],
  "next_question_topic": "fact_key_or_null",
  "next_question": "the question text in ${langName}",
  "needs_clarification": false,
  "interview_complete": false
}`
}

function safeParseGeminiJSON(raw: string): InterviewTurnResponse | null {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  try {
    const parsed = JSON.parse(cleaned)
    // Validate required fields
    if (
      typeof parsed.next_question !== "string" ||
      typeof parsed.interview_complete !== "boolean"
    ) return null
    return {
      extracted_facts: parsed.extracted_facts ?? {},
      uncertain_facts: Array.isArray(parsed.uncertain_facts) ? parsed.uncertain_facts : [],
      next_question_topic: parsed.next_question_topic ?? null,
      next_question: parsed.next_question,
      needs_clarification: Boolean(parsed.needs_clarification),
      interview_complete: Boolean(parsed.interview_complete),
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 })
  }

  let body: InterviewTurnRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 })
  }

  const langName = LANG_NAMES[body.language] ?? "English"
  const systemPrompt = buildSystemPrompt(langName)
  const userPrompt = buildUserPrompt(body, langName)

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(20000),
    })

    if (!geminiRes.ok) {
      return NextResponse.json({ error: "AI_ERROR" }, { status: 502 })
    }

    const data = await geminiRes.json()
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""

    if (!rawText) {
      return NextResponse.json({ error: "AI_EMPTY_RESPONSE" }, { status: 502 })
    }

    const parsed = safeParseGeminiJSON(rawText)
    if (!parsed) {
      return NextResponse.json({ error: "AI_PARSE_ERROR" }, { status: 502 })
    }

    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError"
    return NextResponse.json(
      { error: isTimeout ? "AI_TIMEOUT" : "NETWORK_ERROR" },
      { status: 502 }
    )
  }
}
