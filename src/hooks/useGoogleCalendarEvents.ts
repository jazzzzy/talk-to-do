/**
 * useGoogleCalendarEvents — fetches events from the user's primary Google Calendar
 * and returns them as read-only DisplayTasks for display in the task list.
 *
 * One-shot fetch on mount (or when the access token becomes available).
 * No polling — the user refreshes by closing and reopening the app.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fetchGCalEvents } from '@/lib/googleCalendar'
import type { DisplayTask } from '@/types/calendarEvent'

export interface UseGoogleCalendarEventsReturn {
  gcalTasks: DisplayTask[]
  loading: boolean
  error: string | null
}

export function useGoogleCalendarEvents(): UseGoogleCalendarEventsReturn {
  const { googleAccessToken } = useAuth()
  const [gcalTasks, setGcalTasks] = useState<DisplayTask[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!googleAccessToken) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchGCalEvents(googleAccessToken)
      .then((tasks) => {
        if (!cancelled) setGcalTasks(tasks)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          console.error('[useGoogleCalendarEvents]', msg)
          setError(msg)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Cancel stale fetch if token changes mid-flight
    return () => { cancelled = true }
  }, [googleAccessToken])

  return { gcalTasks, loading, error }
}
