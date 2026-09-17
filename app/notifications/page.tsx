import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { NotificationsView } from "@/components/notifications/notifications-view"

export const metadata: Metadata = {
  title: "Notifications — Urimai",
  description: "WhatsApp, SMS, and push notification delivery history for your case.",
}

export default function NotificationsPage() {
  return (
    <PageShell backHref="/dashboard" backLabel="Back to dashboard" activeStep={8} doneUpTo={7}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 16 · Notifications</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Alert dispatcher & delivery log
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Every WhatsApp message, SMS fallback, and push notification sent for your case is logged here with
          delivery status and timestamp.
        </p>
      </div>
      <div className="mt-10">
        <NotificationsView />
      </div>
    </PageShell>
  )
}
