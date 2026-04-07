/**
 * settingsRepository.ts — Firestore operations for user settings.
 * Each user has a single document at `userSettings/{userId}`.
 */
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { UserSettings } from '@/types/calendarEvent'

const COLLECTION = 'userSettings'

/** Subscribe to a user's settings document in real-time. */
export function subscribeToUserSettings(
  userId: string,
  onData: (settings: UserSettings | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const ref = doc(db, COLLECTION, userId)

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData({ ...snap.data(), userId } as UserSettings)
      } else {
        onData(null)
      }
    },
    (err) => onError(err),
  )
}

/** Read settings once (non-realtime). */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const snap = await getDoc(doc(db, COLLECTION, userId))
  if (!snap.exists()) return null
  return { ...snap.data(), userId } as UserSettings
}

/** Save or update user settings (URL, GCal IDs, etc). */
export async function saveUserSettings(
  userId: string,
  data: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>,
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, userId),
    {
      ...data,
      userId,
      updatedAt: Date.now(),
    },
    { merge: true },
  )
}
