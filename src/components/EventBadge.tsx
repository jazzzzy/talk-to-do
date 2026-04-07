/**
 * EventBadge — visual indicator pill for non-user tasks.
 * - 'family-shared' → purple "Family" badge
 * - 'google-calendar' → blue "Google Cal" badge
 */
import type { TaskSource } from '@/types/calendarEvent'

interface Props {
  source: TaskSource
  /** Optional: time label for non-all-day events. */
  time?: string
  /** Optional: location label. */
  location?: string
}

export default function EventBadge({ source, time, location }: Props) {
  const isFamily = source === 'family-shared'

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Primary source badge */}
      {isFamily ? (
        <span className="family-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
          <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="currentColor" aria-hidden="true">
            <path d="M8 1a3 3 0 100 6 3 3 0 000-6zM4.5 9A2.5 2.5 0 002 11.5V13a1 1 0 001 1h10a1 1 0 001-1v-1.5A2.5 2.5 0 0011.5 9h-7z" />
          </svg>
          Family
        </span>
      ) : (
        <span className="gcal-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
          {/* Google Calendar "G" icon (simplified) */}
          <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="currentColor" aria-hidden="true">
            <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm.75 3v3.25H11v1.5H8.75V12h-1.5V9.75H5v-1.5h2.25V5h1.5z" />
          </svg>
          Google Cal
        </span>
      )}

      {/* Time pill (if not all-day) */}
      {time && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-[9px] text-white/35 font-medium">
          {time}
        </span>
      )}

      {/* Location pill */}
      {location && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-[9px] text-white/35 font-medium truncate max-w-[120px]">
          📍 {location}
        </span>
      )}
    </div>
  )
}
