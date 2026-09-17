import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { CourtOrders } from "@/components/orders/court-orders"

export const metadata: Metadata = {
  title: "Court orders — Urimai",
  description: "Read and download all orders issued by the Consumer Commission for your case.",
}

export default function OrdersPage() {
  return (
    <PageShell backHref="/tracking" backLabel="Back to tracking" activeStep={9} doneUpTo={8}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 9 · Court orders</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Commission orders
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          All notices, interim orders, and the final order issued by the District Consumer Disputes Redressal
          Commission are available here. Download PDFs and track compliance deadlines.
        </p>
      </div>
      <div className="mt-10">
        <CourtOrders />
      </div>
    </PageShell>
  )
}
