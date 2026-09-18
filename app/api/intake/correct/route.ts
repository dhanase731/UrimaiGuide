import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

interface CorrectRequest {
  text: string
  language: "ENGLISH" | "TAMIL" | "HINDI"
}

interface CorrectResponse {
  originalText: string
  correctedText: string
  changed: boolean
}

const LANG_NAMES: Record<string, string> = {
  ENGLISH: "English",
  TAMIL: "Tamil",
  HINDI: "Hindi",
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 })
  }

  let body: CorrectRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 })
  }

  const { text, language } = body
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "EMPTY_TEXT" }, { status: 400 })
  }

  const langName = LANG_NAMES[language] ?? "English"

  const systemPrompt = `You are a language correction assistant for a consumer complaint system.
Your ONLY task is to correct grammar and clarity in ${langName}.

STRICT RULES:
- Do NOT add, remove, infer, assume, or invent any facts.
- Do NOT add dates, prices, product names, seller names, or platform names that the user did not mention.
- Do NOT provide legal advice or legal conclusions.
- Do NOT classify the case.
- Preserve every factual detail the user provided: product, seller, platform, date, amount, defect, response, relief.
- Return ONLY the corrected sentence(s) in ${langName}. No explanation, no preamble.
- If the text is already grammatically correct and clear, return it unchanged.`

  const userPrompt = `Correct the following consumer complaint text (language: ${langName}):\n\n${text.trim()}`

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash"
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!geminiRes.ok) {
      return NextResponse.json({ error: "AI_ERROR" }, { status: 502 })
    }

    const data = await geminiRes.json()
    const correctedText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""

    if (!correctedText) {
      return NextResponse.json({ error: "AI_EMPTY_RESPONSE" }, { status: 502 })
    }

    const result: CorrectResponse = {
      originalText: text.trim(),
      correctedText,
      changed: correctedText !== text.trim(),
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError"
    return NextResponse.json(
      { error: isTimeout ? "AI_TIMEOUT" : "NETWORK_ERROR" },
      { status: 502 }
    )
  }
}
