/**
 * useCalendarEvents — subscribes to family calendar events from Firestore
 * and converts them into DisplayTask format for unified rendering.
 */
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { subscribeToCalendarEvents } from '@/lib/calendarEventRepository'
import type { CalendarEvent, DisplayTask } from '@/types/calendarEvent'

export interface UseCalendarEventsReturn {
  /** Raw calendar events from Firestore. */
  events: CalendarEvent[]
  /** Events converted to DisplayTask for merged rendering with Tasks. */
  displayTasks: DisplayTask[]
  loading: boolean
  error: Error | null
}

export function useCalendarEvents(): UseCalendarEventsReturn {
  const { user } = useAuth()
  const [events, setEvents]   = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToCalendarEvents(
      user.uid,
      (evts) => {
        setEvents(evts)
        setLoading(false)
      },
      (err) => {
        console.error('[useCalendarEvents] Firestore error:', err)
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  // Convert CalendarEvents → DisplayTasks so they can be merged with user tasks
  const displayTasks: DisplayTask[] = useMemo(
    () =>
      events.map((evt) => ({
        id: evt.id,
        title: evt.title,
        dueDate: evt.dueDate,
        status: 'pending' as const,
        createdAt: evt.createdAt,
        source: 'family-shared' as const,
        readOnly: true,
        startTime: evt.startTime,
        endTime: evt.endTime,
        location: evt.location,
        allDay: evt.allDay,
      })),
    [events],
  )

  return { events, displayTasks, loading, error }
}
