/**
 * calendarEventRepository.ts — Firestore subscription for family calendar events.
 * Events are written by Cloud Functions and read by the client (read-only).
 */
import {
  collection,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { CalendarEvent } from '@/types/calendarEvent'

const COLLECTION = 'calendarEvents'

/**
 * Subscribe to all family calendar events for the given user.
 * Returns the Firestore unsubscribe function.
 */
export function subscribeToCalendarEvents(
  userId: string,
  onData: (events: CalendarEvent[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('source', '==', 'family-shared'),
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const events: CalendarEvent[] = snapshot.docs.map((snap) => {
        const data = snap.data();
        return {
          id: snap.id,
          ...data,
          // Defensive defaults for missing or legacy fields
          mirroredToGcal: data.mirroredToGcal ?? false,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        } as CalendarEvent;
      });
      onData(events)
    },
    (err) => onError(err),
  )
}
