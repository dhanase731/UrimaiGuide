"use client"

import { useState } from "react"
import { MessageSquare, Smartphone, Bell, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useCaseContext, type Notification } from "@/lib/case-context"

type Channel = "ALL" | "WHATSAPP" | "SMS" | "PUSH"

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  WHATSAPP: MessageSquare,
  SMS: Smartphone,
  PUSH: Bell,
}

const CHANNEL_STYLES: Record<string, string> = {
  WHATSAPP: "bg-forest-soft text-forest border-forest/20",
  SMS: "bg-amber-soft text-amber-ink border-amber-ink/20",
  PUSH: "bg-bluesoft text-ink-800 border-softborder",
}

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: "text-forest",
  SENT: "text-ink-700",
  FAILED: "text-danger-ink",
  PENDING: "text-muted-foreground",
}

export function NotificationsView() {
  const { notifications } = useCaseContext()
  const [filter, setFilter] = useState<Channel>("ALL")

  const filtered: Notification[] = filter === "ALL" ? notifications : notifications.filter((n) => n.channel === filter)

  const counts: Record<Channel, number> = {
    ALL: notifications.length,
    WHATSAPP: notifications.filter((n) => n.channel === "WHATSAPP").length,
    SMS: notifications.filter((n) => n.channel === "SMS").length,
    PUSH: notifications.filter((n) => n.channel === "PUSH").length,
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "WHATSAPP", "SMS", "PUSH"] as Channel[]).map((ch) => (
          <button key={ch} type="button" onClick={() => setFilter(ch)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === ch ? "border-ink-900 bg-ink-900 text-parchment" : "border-softborder bg-card text-ink-700 hover:bg-bluesoft"
            }`}>
            {ch} ({counts[ch]})
          </button>
        ))}
      </div>

      {/* Log table */}
      <section className="rounded-xl border border-softborder bg-card">
        <div className="border-b border-softborder px-5 py-4">
          <h2 className="font-serif text-base font-bold text-ink-900">Delivery history</h2>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No notifications yet. They will appear here as your case progresses — hearing reminders, order alerts, and compliance warnings.
          </p>
        ) : (
          <div className="divide-y divide-softborder">
            {filtered.map((log) => {
              const Icon = CHANNEL_ICONS[log.channel] ?? Bell
              return (
                <div key={log.notification_id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${CHANNEL_STYLES[log.channel]}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-900">{log.message}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${CHANNEL_STYLES[log.channel]}`}>
                        {log.channel}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${STATUS_STYLES[log.delivery_status]}`}>
                        {log.delivery_status === "DELIVERED" || log.delivery_status === "SENT"
                          ? <CheckCircle2 className="h-3 w-3" />
                          : log.delivery_status === "FAILED"
                            ? <XCircle className="h-3 w-3" />
                            : <Clock className="h-3 w-3" />}
                        {log.delivery_status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.sent_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* System health */}
      <section className="rounded-xl border border-softborder bg-card p-5">
        <h2 className="mb-4 font-serif text-base font-bold text-ink-900">Channel health</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: "MSG91 WhatsApp Business API", status: "Active", ok: true },
            { label: "SMS fallback engine", status: "Ready", ok: true },
            { label: "Firebase Cloud Messaging (FCM)", status: "Token registered", ok: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border border-softborder px-4 py-3">
              <span className="text-sm text-ink-900">{item.label}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.ok ? "text-forest" : "text-danger-ink"}`}>
                <span className={`h-2 w-2 rounded-full ${item.ok ? "bg-forest" : "bg-danger-ink"}`} />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
