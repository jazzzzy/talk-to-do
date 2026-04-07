/**
 * googleCalendar.ts — Client-side Google Calendar API helper.
 * Creates events in the user's primary Google Calendar using their
 * OAuth access token obtained during sign-in.
 */

import type { DisplayTask } from '@/types/calendarEvent'

const GCAL_API_BASE = 'https://www.googleapis.com/calendar/v3'

/** Number of days ahead to fetch from Google Calendar. */
const GCAL_FETCH_DAYS = 90

/* ─── GCal Event fetch (Reverse Sync) ───────────────────────── */

interface GCalCalendar {
  id: string
  summary: string
  primary?: boolean
}

interface GCalListEvent {
  id: string
  summary?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
  location?: string
  description?: string
  extendedProperties?: { private?: Record<string, string> }
}

/**
 * Fetch upcoming events from ALL of the user's Google Calendars.
 * - First fetches the calendar list, then events from each calendar in parallel.
 * - Window: start-of-today → today + GCAL_FETCH_DAYS days.
 * - Excludes events created by TaskFlow (tagged taskflow-user / taskflow-family)
 *   to prevent duplicates alongside existing task/family event lists.
 * - Returns a deduplicated DisplayTask[] with source 'google-calendar'.
 */
export async function fetchGCalEvents(accessToken: string): Promise<DisplayTask[]> {
  const now = new Date()

  // Use start-of-today (midnight local time) so events earlier today aren't excluded
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const timeMin = startOfToday.toISOString()

  const future = new Date(now)
  future.setDate(future.getDate() + GCAL_FETCH_DAYS)
  const timeMax = future.toISOString()

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  // ── Step 1: Get all calendars ──────────────────────────────
  let calendars: GCalCalendar[] = []
  try {
    const calRes = await fetch(`${GCAL_API_BASE}/users/me/calendarList`, { headers })
    if (!calRes.ok) {
      if (calRes.status === 401) {
        console.warn('[GCal] Access token expired during calendar list fetch.')
        return []
      }
      console.error(`[GCal] Calendar list error ${calRes.status}`)
      return []
    }
    const calData = await calRes.json() as { items?: GCalCalendar[] }
    calendars = calData.items ?? []
    console.log(`[GCal] Found ${calendars.length} calendar(s):`, calendars.map(c => c.summary))
  } catch (err) {
    console.error('[GCal] Network error fetching calendar list:', err)
    return []
  }

  // ── Step 2: Fetch events from all calendars in parallel ────
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const fetchCalendarEvents = async (calId: string): Promise<GCalListEvent[]> => {
    try {
      const res = await fetch(
        `${GCAL_API_BASE}/calendars/${encodeURIComponent(calId)}/events?${params}`,
        { headers },
      )
      if (!res.ok) return []
      const data = await res.json() as { items?: GCalListEvent[] }
      return data.items ?? []
    } catch {
      return []
    }
  }

  const allItemArrays = await Promise.all(calendars.map(cal => fetchCalendarEvents(cal.id)))
  const allItems = allItemArrays.flat()

  console.log(`[GCal] Raw API returned ${allItems.length} total item(s) across all calendars`)

  // ── Step 3: Deduplicate and filter ────────────────────────
  const seen = new Set<string>()
  const tasks: DisplayTask[] = []

  for (const item of allItems) {
    if (!item.summary || !item.start) continue
    if (seen.has(item.id)) continue  // Deduplicate events that appear in multiple calendars
    seen.add(item.id)

    // Skip events we created from TaskFlow to avoid self-duplicates
    const source = item.extendedProperties?.private?.source
    if (source === 'taskflow-user' || source === 'taskflow-family') {
      console.log(`[GCal] Skipping TaskFlow-created event: "${item.summary}"`)
      continue
    }

    const rawDate = item.start.date ?? item.start.dateTime
    if (!rawDate) continue

    const dueDate = rawDate.slice(0, 10)
    const startTime = item.start.dateTime ? item.start.dateTime.slice(11, 16) : undefined
    const endTime   = item.end?.dateTime   ? item.end.dateTime.slice(11, 16)  : undefined

    tasks.push({
      id: `gcal_${item.id}`,
      title: item.summary.replace(/^[✅👨‍👩‍👧]\s*/, '').trim(),
      dueDate,
      status: 'pending',
      createdAt: now.getTime(),
      source: 'google-calendar',
      readOnly: true,
      startTime,
      endTime,
      allDay: !item.start.dateTime,
      location: item.location,
    })
  }

  console.log(`[GCal] Fetched ${tasks.length} external events (${GCAL_FETCH_DAYS}-day window)`)
  return tasks
}

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
 * Build a GCal event payload from a shared family calendar event.
 * Prefixes the title with a family emoji and tags the source.
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
  return buildPayload(`👨‍👩‍👧 ${title}`, 'taskflow-family', dueDate, startTime, endTime, allDay, location, description)
}

/**
 * Build a GCal event payload from a user-created task.
 * No emoji prefix; tagged as 'taskflow-user' so it can be identified later.
 */
export function buildUserTaskPayload(
  title: string,
  dueDate: string,
): GCalEventPayload {
  // User tasks have no time info — always created as all-day events
  return buildPayload(`✅ ${title}`, 'taskflow-user', dueDate)
}

/** Shared payload builder for both family and user tasks. */
function buildPayload(
  summary: string,
  source: string,
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
    summary,
    start,
    end,
    extendedProperties: {
      private: { source },
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
