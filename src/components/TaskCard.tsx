import type { Task } from '@/types/task'

interface Props {
  task: Task
  onToggle: () => void
  onDelete: () => void
  /** Staggered entry delay index for list animation */
  index?: number
}

/**
 * TaskCard — renders a single task with a custom checkbox and delete button.
 * Touch targets are ≥44px to comply with mobile accessibility guidelines.
 */
export default function TaskCard({ task, onToggle, onDelete, index = 0 }: Props) {
  const isCompleted = task.status === 'completed'
  const delay = `${index * 0.05}s`

  return (
    <div
      className="glass-card animate-task-in rounded-2xl flex items-center gap-0 overflow-hidden"
      style={{ animationDelay: delay }}
    >
      {/* ── Checkbox (44×64 touch target) ─────────────────────── */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-14 h-16 flex items-center justify-center cursor-pointer group"
        aria-label={isCompleted ? 'Mark as pending' : 'Mark as complete'}
      >
        <div
          className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all duration-300 ease-out
            ${isCompleted
              ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30 scale-110'
              : 'border-white/25 group-hover:border-indigo-400/80 group-hover:scale-110'
            }
          `}
        >
          {isCompleted && (
            <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none" aria-hidden="true">
              <path
                d="M1 4l2.5 2.5L9 1"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 py-4 pr-1">
        <p
          className={`
            text-sm font-medium leading-snug transition-all duration-300
            ${isCompleted ? 'line-through text-white/25' : 'text-white/85'}
          `}
        >
          {task.title}
        </p>
        <p className={`text-xs mt-0.5 transition-colors duration-300 ${isCompleted ? 'text-white/15' : 'text-white/35'}`}>
          {formatDueDate(task.dueDate)}
        </p>
      </div>

      {/* ── Delete (44×64 touch target) ───────────────────────── */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 w-12 h-16 flex items-center justify-center cursor-pointer text-white/15 hover:text-rose-400 transition-colors duration-200 group"
        aria-label="Delete task"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────── */

/** Formats 'YYYY-MM-DD' into a human-readable label relative to today. */
function formatDueDate(dueDate: string): string {
  const today    = new Date().toLocaleDateString('en-CA')
  const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA')

  if (dueDate === today)    return 'Today'
  if (dueDate === tomorrow) return 'Tomorrow'

  // Parse the ISO date parts manually to avoid timezone shift from `new Date(string)`
  const [y, m, d] = dueDate.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
