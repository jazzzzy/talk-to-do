/**
 * googleCalendar.ts — Client-side Google Calendar API helper.
 * Creates events in the user's primary Google Calendar using their
 * OAuth access token obtained during sign-in.
 */

const GCAL_API_BASE = 'https://www.googleapis.com/calendar/v3'

export interface GCalEventPayload {
  summary: string
  start: { date?: string; dateTime?: string; timeZone?: string }
  end: { date?: string; dateTime?: string; timeZone?: string }
  location?: string
  description?: string
  // Tag to identify events created by TaskFlow
  extendedProperties?: {
    private: Record<string, string>
  }
}

/**
 * Insert an event into the user's primary Google Calendar.
 * Returns the created event ID, or null if the token is expired/invalid.
 */
export async function createGCalEvent(
  accessToken: string,
  event: GCalEventPayload,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${GCAL_API_BASE}/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    )

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('[GCal] Access token expired. Event will be synced on next sign-in.')
        return null
      }
      const body = await response.text()
      console.error(`[GCal] API error ${response.status}:`, body)
      return null
    }

    const data = await response.json() as { id: string }
    return data.id
  } catch (err) {
    console.error('[GCal] Network error:', err)
    return null
  }
}

/**
 * Build a GCal event payload from a family calendar event.
 */
export function buildGCalPayload(
  title: string,
  dueDate: string,
  startTime?: string,
  endTime?: string,
  allDay?: boolean,
  location?: string,
  description?: string,
): GCalEventPayload {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  let start: GCalEventPayload['start']
  let end: GCalEventPayload['end']

  if (allDay || !startTime) {
    // All-day event
    start = { date: dueDate }
    // Google Calendar all-day events end on the next day
    end = { date: getNextDay(dueDate) }
  } else {
    start = {
      dateTime: `${dueDate}T${startTime}:00`,
      timeZone,
    }
    end = {
      dateTime: endTime
        ? `${dueDate}T${endTime}:00`
        : `${dueDate}T${addOneHour(startTime)}:00`,
      timeZone,
    }
  }

  const payload: GCalEventPayload = {
    summary: `👨‍👩‍👧 ${title}`,
    start,
    end,
    extendedProperties: {
      private: { source: 'taskflow-family' },
    },
  }

  if (location) payload.location = location
  if (description) payload.description = description

  return payload
}

/** Advance 'YYYY-MM-DD' by one day. */
function getNextDay(date: string): string {
  const d = new Date(date + 'T12:00:00') // Noon to avoid DST edge cases
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Add 1 hour to 'HH:MM', wrapping at 24. */
function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const newH = (h + 1) % 24
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
