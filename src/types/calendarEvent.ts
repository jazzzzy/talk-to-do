/**
 * CalendarEvent — a read-only event synced from the family iCloud calendar.
 * Stored in the `calendarEvents` Firestore collection.
 * Deduplication key: `${userId}_${icalUid}`.
 */
export interface CalendarEvent {
  id: string                // Firestore doc ID
  userId: string            // Owner who subscribed to the feed
  icalUid: string           // Original iCloud VEVENT UID for dedup
  title: string             // VEVENT SUMMARY
  dueDate: string           // ISO local date: 'YYYY-MM-DD' (start date)
  startTime?: string        // 'HH:MM' for non-all-day events
  endTime?: string          // 'HH:MM' for non-all-day events
  allDay: boolean           // True if DTSTART is a DATE (not DATETIME)
  location?: string         // VEVENT LOCATION
  description?: string      // VEVENT DESCRIPTION
  source: 'family-shared'   // Discriminator tag
  readOnly: true            // Always true for synced events
  lastSyncedAt: number      // Unix timestamp (ms) of last sync
  createdAt: number         // Unix timestamp (ms) of first sync
  mirroredToGcal: boolean   // Whether it's been pushed to Google Calendar
}

/**
 * UserSettings — per-user configuration stored in `userSettings/{userId}`.
 */
export interface UserSettings {
  userId: string
  familyCalendarUrl: string // Public iCloud ICS URL
  googleCalendarIds?: string[] // IDs of selected GCal calendars to sync
  voiceLanguage?: 'en-US' | 'hu-HU'
  updatedAt: number         // Unix timestamp (ms) of last update
}

/**
 * DisplayTask — the unified view type used by TaskCard.
 * Either a user-created task or a synced family calendar event,
 * rendered in the same list with a visual discriminator.
 */
export type TaskSource = 'user' | 'family-shared' | 'google-calendar'

export interface DisplayTask {
  id: string
  title: string
  dueDate?: string          // 'YYYY-MM-DD' (optional)
  status: 'pending' | 'completed'
  createdAt: number
  source: TaskSource
  readOnly: boolean
  // Family-specific metadata (optional)
  startTime?: string
  endTime?: string
  location?: string
  allDay?: boolean
}
