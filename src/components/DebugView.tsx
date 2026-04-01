import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import type { DisplayTask } from '@/types/calendarEvent'

/* ─── Helpers ────────────────────────────────────────────────── */

function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA')
}

/* ─── Task Row ───────────────────────────────────────────────── */

interface TaskRowProps {
  task: DisplayTask
  onToggle: () => void
  onDelete: () => void
}

function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs cursor-pointer transition-all ${
            task.status === 'completed'
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-white/30 hover:border-indigo-400'
          }`}
        >
          {task.status === 'completed' && '✓'}
        </button>
        <span
          className={`text-sm truncate ${
            task.status === 'completed' ? 'line-through text-white/30' : 'text-white/80'
          }`}
        >
          {task.title}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-white/30 text-xs">{task.dueDate}</span>
        <button
          onClick={onDelete}
          className="text-rose-400/60 hover:text-rose-400 cursor-pointer text-sm transition-colors"
          aria-label="Delete task"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/* ─── Section ─────────────────────────────────────────────────── */

interface SectionProps {
  label: string
  emoji: string
  tasks: DisplayTask[]
  accent: string
  onToggle: (id: string, status: DisplayTask['status']) => void
  onDelete: (id: string) => void
}

function Section({ label, emoji, tasks, accent, onToggle, onDelete }: SectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${accent}`}>
        <span>{emoji}</span>
        <span>{label}</span>
        <span className="ml-auto opacity-60">({tasks.length})</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-white/25 text-xs italic pl-1">No tasks here</p>
      ) : (
        tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onToggle={() => onToggle(t.id, t.status)}
            onDelete={() => onDelete(t.id)}
          />
        ))
      )}
    </div>
  )
}

/* ─── DebugView ───────────────────────────────────────────────── */

/**
 * Temporary verification UI for Phase 2.
 * Replaced by the polished TaskList in Phase 3.
 */
export default function DebugView() {
  const { todayTasks, upcomingTasks, overdueTasks, loading, error, addTask, toggleTaskStatus, deleteTask } =
    useTasks()

  const [title, setTitle]     = useState('')
  const [dueDate, setDueDate] = useState(getLocalToday())
  const [adding, setAdding]   = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    setAdding(true)
    setAddError(null)
    try {
      await addTask(title.trim(), dueDate)
      setTitle('')
      setDueDate(getLocalToday())
    } catch (err) {
      setAddError('Failed to add task. Check Firestore rules.')
      console.error('[DebugView] addTask error:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (id: string, status: DisplayTask['status']) => {
    try {
      await toggleTaskStatus(id, status)
    } catch (err) {
      console.error('[DebugView] toggleTask error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id)
    } catch (err) {
      console.error('[DebugView] deleteTask error:', err)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-white/40 text-xs font-mono uppercase tracking-widest">
          ⚙ Debug View — Phase 2
        </span>
      </div>

      {/* Add Task Form */}
      <form
        onSubmit={handleAdd}
        className="glass-card rounded-2xl p-4 flex flex-col gap-3"
        id="debug-add-task-form"
      >
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Add Task</p>
        <div className="flex gap-2">
          <input
            id="debug-task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title…"
            required
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-400/60 transition-colors"
          />
          <input
            id="debug-task-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-400/60 transition-colors"
          />
        </div>
        {addError && (
          <p className="text-rose-400 text-xs">{addError}</p>
        )}
        <button
          id="debug-add-task-btn"
          type="submit"
          disabled={adding || !title.trim()}
          className="glass-button rounded-xl px-4 py-2 text-white text-sm font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {adding ? 'Adding…' : '+ Add Task'}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          Firestore error: {error.message}
        </div>
      )}

      {/* Task lists */}
      {loading ? (
        <div className="text-white/40 text-sm text-center py-8">Loading tasks…</div>
      ) : (
        <div className="glass-card rounded-2xl p-4 flex flex-col gap-5">
          <Section
            label="Overdue"
            emoji="🔴"
            tasks={overdueTasks}
            accent="text-rose-400"
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
          <div className="h-px bg-white/10" />
          <Section
            label="Today"
            emoji="⚡"
            tasks={todayTasks}
            accent="text-indigo-400"
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
          <div className="h-px bg-white/10" />
          <Section
            label="Upcoming"
            emoji="📅"
            tasks={upcomingTasks}
            accent="text-sky-400"
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  )
}
