"use client"

import { useState } from "react"
import { Plus, CheckSquare, Square, AlertCircle, Clock, ChevronDown, ChevronRight, X } from "lucide-react"
import { useCaseContext, type Task, type TaskType, type TaskPriority, type TaskStatus } from "@/lib/case-context"

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  HIGH: "bg-red-50 text-danger-ink border-danger-ink/20",
  MEDIUM: "bg-amber-soft text-amber-ink border-amber-ink/20",
  LOW: "bg-bluesoft text-ink-800 border-softborder",
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  AUTO_ORDER: "Court order",
  AUTO_HEARING: "Hearing",
  AUTO_COMPLIANCE: "Compliance",
  AUTO_FILING: "Filing",
}

function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const done = task.status === "COMPLETED"
  const overdue = task.status === "OVERDUE"
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${
      overdue ? "border-danger-ink/20 bg-red-50" : done ? "border-softborder bg-card opacity-60" : "border-softborder bg-card"
    }`}>
      <button type="button" onClick={() => onToggle(task.task_id)} className="mt-0.5 shrink-0">
        {done
          ? <CheckSquare className="h-4 w-4 text-forest" />
          : <Square className="h-4 w-4 text-muted-foreground" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${done ? "text-muted-foreground line-through" : "text-ink-900"}`}>
          {task.title}
        </p>
        {task.description && <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[task.priority]}`}>
            {task.priority}
          </span>
          <span className="rounded-md border border-softborder bg-parchment px-2 py-0.5 text-[10px] font-semibold text-ink-700">
            {SOURCE_LABELS[task.source] ?? task.source}
          </span>
          {overdue && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger-ink">
              <AlertCircle className="h-3 w-3" />
              Overdue by {Math.abs(task.days_until_deadline)} day{Math.abs(task.days_until_deadline) !== 1 ? "s" : ""}
            </span>
          )}
          {!done && !overdue && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.days_until_deadline === 0 ? "Due today" : `Due in ${task.days_until_deadline} day${task.days_until_deadline !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, count, tasks, onToggle, defaultOpen = true, danger = false }: {
  title: string; count: number; tasks: Task[]; onToggle: (id: string) => void
  defaultOpen?: boolean; danger?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (tasks.length === 0) return null
  return (
    <div className="rounded-xl border border-softborder bg-card overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4">
        <span className="flex items-center gap-2">
          <span className={`font-serif text-base font-bold ${danger ? "text-danger-ink" : "text-ink-900"}`}>{title}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${danger ? "bg-red-50 text-danger-ink" : "bg-bluesoft text-ink-800"}`}>{count}</span>
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-softborder px-5 pb-5 pt-4">
          {tasks.map((t) => <TaskCard key={t.task_id} task={t} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  )
}

export function TasksView() {
  const { tasks, updateTask, addTask } = useCaseContext()
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDeadline, setNewDeadline] = useState("")
  const [newType, setNewType] = useState<TaskType>("CUSTOM")
  const [newPriority, setNewPriority] = useState<TaskPriority>("MEDIUM")

  function toggleTask(id: string) {
    const task = tasks.find((t) => t.task_id === id)
    if (!task) return
    updateTask(id, { status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" })
  }

  function handleAddTask() {
    if (!newTitle.trim() || !newDeadline) return
    const today = new Date()
    const dl = new Date(newDeadline)
    const days = Math.round((dl.getTime() - today.getTime()) / 86400000)
    addTask({
      task_id: `t-${Date.now()}`,
      title: newTitle.trim(),
      description: "",
      deadline: newDeadline,
      task_type: newType,
      priority: newPriority,
      status: days < 0 ? "OVERDUE" : "PENDING",
      source: "MANUAL",
      days_until_deadline: days,
      reminder_active: false,
    })
    setNewTitle(""); setNewDeadline(""); setShowForm(false)
  }

  const today = tasks.filter((t) => t.status !== "COMPLETED" && t.days_until_deadline === 0)
  const thisWeek = tasks.filter((t) => t.status !== "COMPLETED" && t.days_until_deadline > 0 && t.days_until_deadline <= 7)
  const upcoming = tasks.filter((t) => t.status !== "COMPLETED" && t.days_until_deadline > 7)
  const overdue = tasks.filter((t) => t.status === "OVERDUE")
  const completed = tasks.filter((t) => t.status === "COMPLETED")

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.filter((t) => t.status !== "COMPLETED").length} active · {completed.length} completed
        </p>
        <button type="button" onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-parchment transition-colors hover:bg-ink-800">
          <Plus className="h-4 w-4" />Add task
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-softborder bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-ink-900">New task</h2>
            <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-900">Task title</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Collect notarised affidavit"
                className="w-full rounded-md border border-softborder bg-card px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-ink-800 focus:ring-2 focus:ring-ink-900/10" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900">Deadline</label>
                <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full rounded-md border border-softborder bg-card px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-ink-800" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900">Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value as TaskType)}
                  className="w-full rounded-md border border-softborder bg-card px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-ink-800">
                  {(["DOCUMENT","HEARING","PAYMENT","FILING","COMPLIANCE","CUSTOM"] as TaskType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-900">Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-md border border-softborder bg-card px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-ink-800">
                  {(["HIGH","MEDIUM","LOW"] as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="button" onClick={handleAddTask} disabled={!newTitle.trim() || !newDeadline}
              className="self-start rounded-md bg-ink-900 px-5 py-2.5 text-sm font-bold text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50">
              Add task
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <p className="rounded-xl border border-softborder bg-card p-5 text-sm text-muted-foreground">
          No tasks yet. Tasks are auto-created when you file your complaint and when hearings are scheduled.
        </p>
      )}

      <Section title="Today" count={today.length} tasks={today} onToggle={toggleTask} />
      <Section title="This week" count={thisWeek.length} tasks={thisWeek} onToggle={toggleTask} />
      <Section title="Upcoming" count={upcoming.length} tasks={upcoming} onToggle={toggleTask} defaultOpen={false} />
      <Section title="Overdue" count={overdue.length} tasks={overdue} onToggle={toggleTask} danger />
      <Section title="Completed" count={completed.length} tasks={completed} onToggle={toggleTask} defaultOpen={false} />
    </div>
  )
}
