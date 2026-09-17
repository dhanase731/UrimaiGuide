"use client"

import { useState, useCallback } from "react"
import {
  Download, Scale, AlertCircle, CheckCircle2, Clock,
  Globe, ExternalLink, Wifi, RefreshCw, FileText,
} from "lucide-react"
import { useCaseContext, type CourtOrder, type ScrapeSource } from "@/lib/case-context"

const SOURCE_META: Record<ScrapeSource, { label: string; color: string }> = {
  EDAAKHIL: { label: "eDaakhil portal", color: "text-forest" },
  COMMISSION_SITE: { label: "Commission website", color: "text-amber-ink" },
  MANUAL: { label: "Manually entered", color: "text-muted-foreground" },
}

const TYPE_STYLES: Record<string, string> = {
  NOTICE: "bg-bluesoft text-ink-800 border-softborder",
  INTERIM: "bg-amber-soft text-amber-ink border-amber-ink/20",
  FINAL: "bg-forest-soft text-forest border-forest/20",
  ADMISSION: "bg-bluesoft text-ink-800 border-softborder",
  EX_PARTE: "bg-red-50 text-danger-ink border-danger-ink/20",
}

function SourceBadge({ source, scraped_at, url }: { source: ScrapeSource; scraped_at: string; url?: string }) {
  const meta = SOURCE_META[source]
  const time = new Date(scraped_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <Globe className="h-3 w-3" />
      <span className={meta.color}>{meta.label}</span>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-ink-900">
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
      · {time}
    </span>
  )
}

export function CourtOrders() {
  const { orders, setOrders, addOrder, caseData, addTimelineEvent } = useCaseContext()
  const [selected, setSelected] = useState<CourtOrder | null>(orders[orders.length - 1] ?? null)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(caseData.last_synced_at || "")
  const [dismissed, setDismissed] = useState(false)

  const newOrders = orders.filter((o) => o.is_new)

  const handleSync = useCallback(async () => {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 1800))
    const now = new Date().toISOString()
    setLastSynced(now)

    // Simulate scraper finding a new order if none exist yet
    if (orders.length === 0) {
      const newOrder: CourtOrder = {
        order_id: `ord-${Date.now()}`,
        order_date: new Date().toISOString().split("T")[0],
        order_type: "NOTICE",
        order_number: `ORD/${(caseData.commission_city || "CHN").slice(0, 3).toUpperCase()}/${new Date().getFullYear()}/${caseData.acknowledgement_number?.split("/").pop() || "00001"}/01`,
        title: "Notice to Opposite Party",
        plain_summary_en: `Commission issued notice to ${caseData.opposite_party_name || "the opposite party"} to file written version within 30 days.`,
        plain_summary_ta: "",
        outcome: "NEUTRAL",
        outcome_explanation: "Notice issued — awaiting opposite party response.",
        deadlines: [{ action: "File written version", calculated_deadline: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0], responsible_party: "Opposite Party" }],
        amounts_ordered: [],
        next_hearing_date: caseData.next_hearing_date || null,
        audio_available: false,
        source: "COMMISSION_SITE",
        scraped_at: now,
        source_url: caseData.commission_scrape_url || "https://consumeraffairs.nic.in",
        pdf_url: null,
        is_new: true,
      }
      addOrder(newOrder)
      setSelected(newOrder)
      addTimelineEvent({
        event_id: `e-order-${Date.now()}`,
        timestamp: now,
        label: "New order detected",
        actor: "COURT",
        note: `${newOrder.title} — scraped from ${SOURCE_META["COMMISSION_SITE"].label}`,
      })
    } else {
      // Mark existing new orders as seen after sync
      setOrders(orders.map((o) => ({ ...o, is_new: false })))
    }

    setSyncing(false)
  }, [orders, caseData, addOrder, setOrders, addTimelineEvent])

  function dismissNew() {
    setOrders(orders.map((o) => ({ ...o, is_new: false })))
    setDismissed(true)
  }

  const lastSyncedLabel = lastSynced
    ? new Date(lastSynced).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Never"

  return (
    <div className="flex flex-col gap-6">

      {/* ── Scraper sync panel ── */}
      <section className="rounded-xl border border-softborder bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-forest" />
              <p className="font-serif text-base font-bold text-ink-900">Order auto-detection</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Scraping {caseData.commission_city || "Commission"} website for new uploaded orders · Last synced {lastSyncedLabel}
            </p>
          </div>
          <button type="button" onClick={handleSync} disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-4 py-2 text-xs font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Checking…" : "Check for new orders"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3 text-forest" />
            <a href={caseData.commission_scrape_url || "https://consumeraffairs.nic.in"} target="_blank" rel="noopener noreferrer"
              className="font-semibold text-forest hover:underline inline-flex items-center gap-0.5">
              {caseData.commission_scrape_url || "consumeraffairs.nic.in"} <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3 text-forest" />
            <a href="https://edaakhil.nic.in" target="_blank" rel="noopener noreferrer"
              className="font-semibold text-forest hover:underline inline-flex items-center gap-0.5">
              edaakhil.nic.in <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </span>
        </div>
      </section>

      {/* ── New orders alert ── */}
      {newOrders.length > 0 && !dismissed && (
        <div className="rounded-xl border border-forest/30 bg-forest-soft p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              <div>
                <p className="text-sm font-bold text-forest">
                  {newOrders.length} new order{newOrders.length > 1 ? "s" : ""} detected by scraper
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {newOrders.map((o) => (
                    <li key={o.order_id} className="text-xs text-ink-800">
                      · {o.title} — {new Date(o.order_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button type="button" onClick={dismissNew} className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-ink-900">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Orders list ── */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-5 font-serif text-lg font-bold text-ink-900">Court orders</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet. Click "Check for new orders" to sync from the commission website.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <button key={order.order_id} type="button" onClick={() => setSelected(order)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selected?.order_id === order.order_id ? "border-ink-900 bg-bluesoft" : "border-softborder bg-card hover:bg-bluesoft/50"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink-900">{order.title}</p>
                        {order.is_new && (
                          <span className="rounded-md bg-forest px-1.5 py-0.5 text-[9px] font-bold text-parchment">NEW · SCRAPED</span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{order.order_number}</p>
                      <p className="mt-0.5 text-xs text-ink-700">
                        {new Date(order.order_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <div className="mt-1">
                        <SourceBadge source={order.source} scraped_at={order.scraped_at} url={order.source_url} />
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${TYPE_STYLES[order.order_type] ?? ""}`}>
                    {order.order_type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Order detail panel ── */}
      {selected && (
        <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-lg font-bold text-ink-900">{selected.title}</p>
                {selected.is_new && (
                  <span className="rounded-md bg-forest px-1.5 py-0.5 text-[9px] font-bold text-parchment">NEW · SCRAPED</span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{selected.order_number}</p>
              <div className="mt-1">
                <SourceBadge source={selected.source} scraped_at={selected.scraped_at} url={selected.source_url} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {selected.pdf_url && (
                <a href={selected.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-softborder px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-bluesoft">
                  <FileText className="h-3.5 w-3.5 text-forest" />View PDF<ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
              <button type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-softborder px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-bluesoft">
                <Download className="h-3.5 w-3.5" />Download PDF
              </button>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-ink-800">{selected.plain_summary_en}</p>

          {selected.outcome !== "NEUTRAL" && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 ${
              selected.outcome === "FAVORABLE" ? "border-forest/20 bg-forest-soft" : "border-amber-ink/20 bg-amber-soft"
            }`}>
              {selected.outcome === "FAVORABLE"
                ? <CheckCircle2 className="h-4 w-4 text-forest" />
                : <AlertCircle className="h-4 w-4 text-amber-ink" />}
              <p className="text-sm font-semibold text-ink-900">{selected.outcome_explanation}</p>
            </div>
          )}

          {selected.deadlines.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {selected.deadlines.map((d, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-amber-ink/30 bg-amber-soft p-3">
                  <Clock className="h-4 w-4 shrink-0 text-amber-ink" />
                  <p className="text-sm text-ink-800">
                    <span className="font-semibold">{d.action}: </span>
                    {new Date(d.calculated_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    <span className="ml-1 text-xs text-muted-foreground">({d.responsible_party})</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Provenance */}
          <div className="mt-4 rounded-lg border border-softborder bg-parchment px-3 py-2.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Data provenance</p>
            <div className="flex flex-col gap-1 text-xs text-ink-700">
              <span>Source: <span className={`font-semibold ${SOURCE_META[selected.source].color}`}>{SOURCE_META[selected.source].label}</span></span>
              <span>Scraped: {new Date(selected.scraped_at).toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              {selected.pdf_url && (
                <span className="flex items-center gap-1">PDF: <a href={selected.pdf_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-forest hover:underline truncate max-w-[200px]">{selected.pdf_url}</a></span>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
