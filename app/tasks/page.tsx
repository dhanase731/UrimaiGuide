import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"
import { TasksView } from "@/components/tasks/tasks-view"

export const metadata: Metadata = {
  title: "Task manager — Urimai",
  description: "Manage all case deadlines, hearing tasks, and compliance actions in one place.",
}

export default function TasksPage() {
  return (
    <PageShell backHref="/dashboard" backLabel="Back to dashboard" activeStep={8} doneUpTo={7}>
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">Module 15 · Task manager</p>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
          Case action centre
        </h1>
        <p className="mt-3 leading-relaxed text-ink-700">
          Every deadline extracted from court orders, every hearing date, and every manual task you add lives
          here. WhatsApp reminders fire automatically 7, 3, and 1 day before each deadline.
        </p>
      </div>
      <div className="mt-10">
        <TasksView />
      </div>
    </PageShell>
  )
}
