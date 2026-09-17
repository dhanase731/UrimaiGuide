"use client"

import { useState } from "react"
import { Braces, ArrowDownToLine, ArrowUpFromLine, Copy, Check } from "lucide-react"

type Tab = "request" | "response"

function JsonBlock({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(value, null, 2)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable in some sandboxes — no-op
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-ink-700 bg-ink-800 px-2 py-1 text-[11px] font-semibold text-parchment/80 transition-colors hover:text-parchment"
        aria-label="Copy JSON"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="max-h-[420px] overflow-auto rounded-lg bg-ink-900 p-4 font-mono text-[12.5px] leading-relaxed text-parchment/90">
        <code>{text}</code>
      </pre>
    </div>
  )
}

export function ApiContractPanel({
  request,
  response,
  endpoint = "POST /api/v1/auth/register",
  requestNote = "Live request body built from the form. Password is masked; the backend hashes it with bcrypt before storage.",
  responseNote = "Sample RegisterResponse. React stores the tokens in httpOnly cookies and routes to next_step.",
}: {
  request: unknown
  response: unknown
  endpoint?: string
  requestNote?: string
  responseNote?: string
}) {
  const [tab, setTab] = useState<Tab>("request")

  return (
    <aside className="flex flex-col rounded-xl border border-softborder bg-card">
      <div className="flex items-center gap-2 border-b border-softborder px-4 py-3">
        <Braces className="h-4 w-4 text-amber-ink" />
        <div className="leading-tight">
          <p className="font-serif text-sm font-bold text-ink-900">API Contract</p>
          <p className="text-xs text-muted-foreground">{endpoint}</p>
        </div>
      </div>

      <div
        className="flex gap-1 px-3 pt-3"
        role="tablist"
        aria-label="API payload"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "request"}
          onClick={() => setTab("request")}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            tab === "request"
              ? "bg-ink-900 text-parchment"
              : "text-ink-700 hover:bg-bluesoft"
          }`}
        >
          <ArrowUpFromLine className="h-3.5 w-3.5" />
          JSON Input
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "response"}
          onClick={() => setTab("response")}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            tab === "response"
              ? "bg-ink-900 text-parchment"
              : "text-ink-700 hover:bg-bluesoft"
          }`}
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          JSON Output
        </button>
      </div>

      <div className="p-3">
        {tab === "request" ? (
          <JsonBlock value={request} />
        ) : (
          <JsonBlock value={response} />
        )}
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
          {tab === "request" ? requestNote : responseNote}
        </p>
      </div>
    </aside>
  )
}
