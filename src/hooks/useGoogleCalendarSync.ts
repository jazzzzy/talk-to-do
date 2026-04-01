/**
 * useGoogleCalendarSync — mirrors new family events to Google Calendar.
 *
 * Runs client-side using the Google OAuth access token captured during sign-in.
 * Only processes events that haven't been mirrored yet (mirroredToGcal === false).
 * Marks events as mirrored in Firestore after successful creation.
 */
import { useEffect, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/context/AuthContext'
import { createGCalEvent, buildGCalPayload } from '@/lib/googleCalendar'
import type { CalendarEvent } from '@/types/calendarEvent'

const EVENTS_COLLECTION = 'calendarEvents'

/**
 * Pass the family events array from useCalendarEvents.
 * The hook automatically mirrors unsynced events to Google Calendar.
 */
export function useGoogleCalendarSync(events: CalendarEvent[]): void {
  const { googleAccessToken } = useAuth()
  // Track which event IDs we've attempted to mirror this session
  // to avoid duplicate API calls during re-renders
  const attemptedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!googleAccessToken) return
    if (events.length === 0) return

    const unmirrored = events.filter(
      (evt) => !evt.mirroredToGcal && !attemptedRef.current.has(evt.id),
    )

    if (unmirrored.length === 0) return

    // Mirror each event sequentially to avoid rate limits
    const mirrorEvents = async () => {
      for (const evt of unmirrored) {
        attemptedRef.current.add(evt.id)

        const payload = buildGCalPayload(
          evt.title,
          evt.dueDate,
          evt.startTime,
          evt.endTime,
          evt.allDay,
          evt.location,
          evt.description,
        )

        const gcalId = await createGCalEvent(googleAccessToken, payload)

        if (gcalId) {
          // Mark as mirrored in Firestore
          try {
            await updateDoc(doc(db, EVENTS_COLLECTION, evt.id), {
              mirroredToGcal: true,
            })
            console.log(`[GCalSync] Mirrored "${evt.title}" → GCal ID: ${gcalId}`)
          } catch (err) {
            console.error(`[GCalSync] Failed to update mirror flag for ${evt.id}:`, err)
          }
        }
      }
    }

    mirrorEvents()
  }, [events, googleAccessToken])
}
