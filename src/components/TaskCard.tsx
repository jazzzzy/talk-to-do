import type { DisplayTask } from '@/types/calendarEvent'
import EventBadge from '@/components/EventBadge'

interface Props {
  task: DisplayTask
  onToggle?: () => void
  onDelete?: () => void
  /** Staggered entry delay index for list animation */
  index?: number
}

/**
 * TaskCard — renders a single task or family event with a custom checkbox
 * and delete button. Family events show a purple badge and are read-only.
 * Touch targets are ≥44px to comply with mobile accessibility guidelines.
 */
export default function TaskCard({ task, onToggle, onDelete, index = 0 }: Props) {
  const isCompleted = task.status === 'completed'
  const isFamily    = task.source === 'family-shared'
  const isGCal      = task.source === 'google-calendar'
  const isReadOnly  = isFamily || isGCal
  const delay = `${index * 0.05}s`

  return (
    <div
      className={`glass-card animate-task-in rounded-2xl flex items-center gap-0 overflow-hidden ${
        isFamily ? 'family-card' : isGCal ? 'gcal-card' : ''
      }`}
      style={{ animationDelay: delay }}
    >
      {/* ── Checkbox (44×64 touch target) ─────────────────────── */}
      {isReadOnly ? (
        // Read-only events: coloured dot indicator instead of checkbox
        <div className="flex-shrink-0 w-14 h-16 flex items-center justify-center">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isFamily
              ? 'bg-purple-500/20 border-2 border-purple-400/40'
              : 'bg-blue-500/20 border-2 border-blue-400/40'
          }`}>
            <svg
              viewBox="0 0 16 16"
              className={`w-3 h-3 ${isFamily ? 'text-purple-400' : 'text-blue-400'}`}
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 1a3 3 0 100 6 3 3 0 000-6zM4.5 9A2.5 2.5 0 002 11.5V13a1 1 0 001 1h10a1 1 0 001-1v-1.5A2.5 2.5 0 0011.5 9h-7z" />
            </svg>
          </div>
        </div>
      ) : (
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
      )}

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 py-3 pr-1">
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

        {/* Source badge row for read-only events */}
        {isReadOnly && (
          <div className="mt-1">
            <EventBadge
              source={task.source}
              time={task.startTime && !task.allDay ? `${task.startTime}${task.endTime ? `–${task.endTime}` : ''}` : undefined}
              location={task.location}
            />
          </div>
        )}
      </div>

      {/* ── Delete / Read-only indicator ──────────────────────── */}
      {isReadOnly ? (
        // Read-only lock icon
        <div className="flex-shrink-0 w-12 h-16 flex items-center justify-center text-white/10">
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
      ) : (
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
      )}
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
