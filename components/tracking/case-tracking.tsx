"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  Calendar, Bell, FileText, ArrowRight, Clock, CheckCircle2,
  RefreshCw, Globe, ChevronDown, ChevronUp, Wifi, ExternalLink, Diff,
} from "lucide-react"
import { useCaseContext, type ScrapeSource, type ScrapeRecord, type ChangeLogEntry, type Hearing } from "@/lib/case-context"
import { STATUS_LABELS } from "@/lib/case"

// ─── Source meta ───────────────────────────────────────────────────────────────

const SOURCE_META: Record<ScrapeSource, { label: string; color: string }> = {
  EDAAKHIL: { label: "eDaakhil portal", color: "text-forest" },
  COMMISSION_SITE: { label: "Commission website", color: "text-amber-ink" },
  MANUAL: { label: "Manually entered", color: "text-muted-foreground" },
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

function ChangeBadge({ entry }: { entry: ChangeLogEntry }) {
  const meta = SOURCE_META[entry.source]
  const time = new Date(entry.detected_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  return (
    <div className="rounded-lg border border-amber-ink/20 bg-amber-soft p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Diff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-ink" />
          <div>
            <p className="text-xs font-semibold text-ink-900">{entry.field}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground line-through">{entry.old_value}</p>
            <p className="text-[11px] font-semibold text-forest">{entry.new_value}</p>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold ${meta.color}`}>{meta.label}</span>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">Detected {time}</p>
    </div>
  )
}

const TRACK_STEPS = ["FILED", "HEARING_SCHEDULED", "ORDER_ISSUED", "COMPLIANCE_PENDING", "CLOSED"] as const

export function CaseTracking() {
  const {
    caseData, hearings, timeline, scrapeRecords, setScrapeRecords,
    changeLog, addChangeLogEntry, setCaseData, setHearings,
  } = useCaseContext()

  const [syncStatus, setSyncStatus] = useState<"IDLE" | "SYNCING" | "SUCCESS">("IDLE")
  const [cooldown, setCooldown] = useState(false)
  const [newChanges, setNewChanges] = useState<ChangeLogEntry[]>([])
  const [showChangeLog, setShowChangeLog] = useState(false)
  const [showScrapeDetails, setShowScrapeDetails] = useState(false)

  // Build current scrape snapshot from context
  const currentSnapshot: ScrapeRecord[] = scrapeRecords.length > 0 ? scrapeRecords : [
    { field: "Case status", value: STATUS_LABELS[caseData.status] || caseData.status, source: "EDAAKHIL", scraped_at: caseData.last_synced_at || new Date().toISOString(), source_url: "https://edaakhil.nic.in" },
    { field: "Next hearing date", value: caseData.next_hearing_date ? `${new Date(caseData.next_hearing_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · ${caseData.next_hearing_time}` : "Not scheduled", source: "EDAAKHIL", scraped_at: caseData.last_synced_at || new Date().toISOString(), source_url: "https://edaakhil.nic.in" },
    { field: "Acknowledgement number", value: caseData.acknowledgement_number || "Pending", source: "EDAAKHIL", scraped_at: caseData.last_synced_at || new Date().toISOString(), source_url: "https://edaakhil.nic.in" },
    { field: "Opposite party response", value: "Written version not yet filed", source: "COMMISSION_SITE", scraped_at: caseData.last_synced_at || new Date().toISOString(), source_url: caseData.commission_scrape_url || "https://consumeraffairs.nic.in" },
    { field: "Orders uploaded", value: "No orders yet", source: "COMMISSION_SITE", scraped_at: caseData.last_synced_at || new Date().toISOString(), source_url: caseData.commission_scrape_url || "https://consumeraffairs.nic.in" },
  ]

  const handleSync = useCallback(async () => {
    if (cooldown || syncStatus === "SYNCING") return
    setSyncStatus("SYNCING")
    setNewChanges([])
    await new Promise((r) => setTimeout(r, 2200))

    const now = new Date().toISOString()
    // Simulate scraper finding a new hearing date (next hearing + 30 more days)
    const existingHearingDate = caseData.next_hearing_date
    const newHearingDate = existingHearingDate
      ? new Date(new Date(existingHearingDate).getTime() + 30 * 86400000).toISOString().split("T")[0]
      : new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0]
    const newHearingLabel = new Date(newHearingDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })

    const updatedSnapshot: ScrapeRecord[] = currentSnapshot.map((r) => {
      if (r.field === "Next hearing date") return { ...r, value: `${newHearingLabel} · 11:00 AM`, scraped_at: now }
      if (r.field === "Opposite party response") return { ...r, value: "Written version filed", scraped_at: now }
      return { ...r, scraped_at: now }
    })

    // Diff
    const detected: ChangeLogEntry[] = []
    updatedSnapshot.forEach((newR) => {
      const old = currentSnapshot.find((r) => r.field === newR.field)
      if (old && old.value !== newR.value) {
        const entry: ChangeLogEntry = {
          id: `cl-${Date.now()}-${newR.field}`,
          field: newR.field,
          old_value: old.value,
          new_value: newR.value,
          detected_at: now,
          source: newR.source,
        }
        detected.push(entry)
        addChangeLogEntry(entry)
      }
    })

    // Update context
    setScrapeRecords(updatedSnapshot)
    setCaseData({ last_synced_at: now, next_hearing_date: newHearingDate, next_hearing_time: "11:00 AM" })

    // Add second hearing to hearings list if not already there
    if (hearings.length < 2) {
      setHearings([
        ...hearings,
        {
          hearing_id: `h-${Date.now()}`,
          date: newHearingDate,
          time: "11:00 AM",
          label: "Evidence hearing",
          status: "PENDING",
          notes: "Evidence to be submitted. Opposite party to file written version.",
          source: "EDAAKHIL",
          scraped_at: now,
        },
      ])
    }

    setNewChanges(detected)
    setSyncStatus(detected.length > 0 ? "SUCCESS" : "IDLE")
    setCooldown(true)
    setTimeout(() => setCooldown(false), 60_000)
  }, [cooldown, syncStatus, currentSnapshot, caseData, hearings, setScrapeRecords, setCaseData, setHearings, addChangeLogEntry])

  const lastSyncedLabel = caseData.last_synced_at
    ? new Date(caseData.last_synced_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "Never"

  const activeStep = TRACK_STEPS.indexOf(caseData.status as typeof TRACK_STEPS[number])

  return (
    <div className="flex flex-col gap-6">

      {/* ── Scraper sync panel ── */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-forest" />
              <p className="font-serif text-base font-bold text-ink-900">Live case sync</p>
              {syncStatus === "SYNCING" && (
                <span className="rounded-md bg-bluesoft px-2 py-0.5 text-[10px] font-bold text-ink-800 animate-pulse">SYNCING…</span>
              )}
              {syncStatus === "SUCCESS" && newChanges.length > 0 && (
                <span className="rounded-md bg-forest-soft px-2 py-0.5 text-[10px] font-bold text-forest">
                  {newChanges.length} CHANGE{newChanges.length > 1 ? "S" : ""} DETECTED
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Scraping eDaakhil + {caseData.commission_city || "Commission"} website · Last synced {lastSyncedLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={cooldown || syncStatus === "SYNCING"}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-4 py-2 text-xs font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === "SYNCING" ? "animate-spin" : ""}`} />
            {syncStatus === "SYNCING" ? "Syncing…" : cooldown ? "Sync (cooldown)" : "Sync now"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            { src: "EDAAKHIL" as ScrapeSource, url: "https://edaakhil.nic.in" },
            { src: "COMMISSION_SITE" as ScrapeSource, url: caseData.commission_scrape_url || "https://consumeraffairs.nic.in" },
          ]).map(({ src, url }) => (
            <a key={src} href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-softborder bg-parchment px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-bluesoft">
              <Wifi className="h-3 w-3 text-forest" />
              {SOURCE_META[src].label}
              <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
            </a>
          ))}
        </div>

        {newChanges.length > 0 && (
          <div className="mt-4 rounded-lg border border-forest/30 bg-forest-soft p-3">
            <p className="mb-2 text-xs font-bold text-forest">✓ {newChanges.length} update{newChanges.length > 1 ? "s" : ""} found</p>
            <div className="flex flex-col gap-2">{newChanges.map((c) => <ChangeBadge key={c.id} entry={c} />)}</div>
          </div>
        )}

        <button type="button" onClick={() => setShowScrapeDetails((v) => !v)}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-ink-900">
          {showScrapeDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showScrapeDetails ? "Hide" : "Show"} scraped data fields ({currentSnapshot.length})
        </button>

        {showScrapeDetails && (
          <div className="mt-3 flex flex-col gap-2">
            {currentSnapshot.map((field) => (
              <div key={field.field} className="rounded-lg border border-softborder bg-parchment px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{field.field}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink-900">{field.value}</p>
                <SourceBadge source={field.source} scraped_at={field.scraped_at} url={field.source_url} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Status stepper ── */}
      <section className="rounded-xl border border-softborder bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current status</p>
            <p className="mt-1 font-serif text-xl font-bold text-ink-900">
              {STATUS_LABELS[caseData.status] || caseData.status}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {caseData.case_number && (
              <span className="rounded-md border border-forest/20 bg-forest-soft px-3 py-1.5 text-sm font-semibold text-forest">
                {caseData.case_number}
              </span>
            )}
            <SourceBadge source="EDAAKHIL" scraped_at={caseData.last_synced_at || new Date().toISOString()} url="https://edaakhil.nic.in" />
          </div>
        </div>
        <div className="mt-5 flex items-center">
          {TRACK_STEPS.map((s, i) => {
            const active = s === caseData.status
            const done = activeStep > -1 ? i < activeStep : false
            return (
              <div key={s} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? "bg-ink-900 text-parchment" : done ? "bg-forest text-parchment" : "border border-softborder bg-card text-muted-foreground"
                  }`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`hidden text-[10px] sm:block ${active ? "font-semibold text-ink-900" : "text-muted-foreground"}`}>
                    {STATUS_LABELS[s]}
                  </span>
                </div>
                {i < TRACK_STEPS.length - 1 && <div className={`h-px flex-1 ${done ? "bg-forest" : "bg-softborder"}`} />}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Hearing schedule ── */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-ink-900">Hearing schedule</h2>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Wifi className="h-3 w-3 text-forest" />Auto-detected via eDaakhil scraper
          </span>
        </div>
        {hearings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hearings scheduled yet. Sync to check for updates.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {hearings.map((h: Hearing) => (
              <div key={h.hearing_id} className={`rounded-lg border p-4 ${h.status === "SCHEDULED" ? "border-ink-900/20 bg-bluesoft" : "border-softborder bg-card"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{h.label}</p>
                      <p className="mt-0.5 text-xs font-medium text-ink-700">
                        {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {h.time}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{h.notes}</p>
                      <div className="mt-1.5">
                        <SourceBadge source={h.source} scraped_at={h.scraped_at} url="https://edaakhil.nic.in" />
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    h.status === "SCHEDULED" ? "bg-ink-900 text-parchment" : "border border-softborder text-muted-foreground"
                  }`}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Change log ── */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <button type="button" onClick={() => setShowChangeLog((v) => !v)} className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Diff className="h-4 w-4 text-amber-ink" />
            <h2 className="font-serif text-lg font-bold text-ink-900">Change log</h2>
            <span className="rounded-md bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-amber-ink">{changeLog.length} entries</span>
          </div>
          {showChangeLog ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        <p className="mt-1 text-xs text-muted-foreground">Every field change detected by the scraper, with before/after values.</p>
        {showChangeLog && (
          <div className="mt-4 flex flex-col gap-2">
            {changeLog.length === 0
              ? <p className="text-xs text-muted-foreground">No changes detected yet. Run a sync to check.</p>
              : changeLog.map((entry) => <ChangeBadge key={entry.id} entry={entry} />)}
          </div>
        )}
      </section>

      {/* ── Case timeline ── */}
      <section className="rounded-xl border border-softborder bg-card p-5 md:p-6">
        <h2 className="mb-5 font-serif text-lg font-bold text-ink-900">Case timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events yet.</p>
        ) : (
          <ol className="relative flex flex-col border-l border-softborder pl-6">
            {[...timeline].reverse().map((event, i) => (
              <li key={event.event_id} className={`relative ${i < timeline.length - 1 ? "pb-5" : ""}`}>
                <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full border border-softborder bg-card">
                  <span className="h-2 w-2 rounded-full bg-ink-900" />
                </span>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink-900">{event.label}</p>
                {event.note && <p className="mt-0.5 text-xs text-ink-700">{event.note}</p>}
                <SourceBadge
                  source={event.actor === "COURT" ? "COMMISSION_SITE" : event.actor === "SYSTEM" ? "EDAAKHIL" : "MANUAL"}
                  scraped_at={event.timestamp}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "View documents", href: "/documents", icon: FileText },
          { label: "View orders", href: "/orders", icon: Clock },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="inline-flex items-center gap-2 rounded-md border border-softborder px-4 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-bluesoft">
            <item.icon className="h-4 w-4" />
            {item.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
