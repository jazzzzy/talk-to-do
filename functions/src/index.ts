/**
 * Cloud Functions entry point — TaskFlow Phase 5.
 *
 * syncSharedCalendar: Scheduled every 15 minutes via Cloud Scheduler.
 * Fetches each user's configured Family Calendar ICS feed, deduplicates
 * events by iCloud UID, and upserts them into the `calendarEvents` collection.
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { fetchAndParseIcs, type ParsedEvent } from "./icsParser";
export { processVoiceCommand } from "./processVoiceCommand";

initializeApp();
const db = getFirestore();

const SETTINGS_COLLECTION = "userSettings";
const EVENTS_COLLECTION = "calendarEvents";

/* ─── Scheduled Sync (every 15 minutes) ─────────────────────── */

export const syncSharedCalendar = onSchedule(
  {
    schedule: "every 15 minutes",
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    console.log("[syncSharedCalendar] Starting scheduled sync…");

    // 1. Fetch all users who have configured a family calendar URL
    const settingsSnap = await db.collection(SETTINGS_COLLECTION).get();

    if (settingsSnap.empty) {
      console.log("[syncSharedCalendar] No users with calendar URLs configured.");
      return;
    }

    // 2. Process each user's calendar
    const results = await Promise.allSettled(
      settingsSnap.docs.map((doc) => syncUserCalendar(doc.id, doc.data()))
    );

    // 3. Log results
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    console.log(
      `[syncSharedCalendar] Done. ${succeeded} succeeded, ${failed} failed.`
    );
  }
);

/* ─── Manual Sync (callable from Settings UI) ───────────────── */

export const triggerCalendarSync = onCall(
  { maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }

    const userId = request.auth.uid;
    const settingsDoc = await db
      .collection(SETTINGS_COLLECTION)
      .doc(userId)
      .get();

    if (!settingsDoc.exists) {
      throw new HttpsError(
        "not-found",
        "No calendar settings found. Save a calendar URL first."
      );
    }

    const result = await syncUserCalendar(userId, settingsDoc.data()!);
    return { success: true, count: result.count, message: `Synced ${result.count} events.` };
  }
);

/* ─── Core Sync Logic ───────────────────────────────────────── */

async function syncUserCalendar(
  userId: string,
  settings: FirebaseFirestore.DocumentData
): Promise<{ count: number }> {
  const calendarUrl = settings.familyCalendarUrl as string | undefined;

  if (!calendarUrl) {
    console.log(`[sync] User ${userId}: No calendar URL, skipping.`);
    return { count: 0 };
  }

  console.log(`[sync] User ${userId}: Fetching ICS from ${calendarUrl}…`);

  // Fetch and parse the ICS feed
  let events: ParsedEvent[];
  try {
    events = await fetchAndParseIcs(calendarUrl);
  } catch (err) {
    console.error(`[sync] User ${userId}: Failed to fetch ICS:`, err);
    throw err;
  }

  console.log(`[sync] User ${userId}: Parsed ${events.length} events.`);

  const now = Date.now();
  const batch = db.batch();
  const incomingUids = new Set<string>();

  // Upsert each event (deduplicate by UID)
  for (const event of events) {
    const docId = `${userId}_${sanitizeDocId(event.uid)}`;
    const docRef = db.collection(EVENTS_COLLECTION).doc(docId);
    incomingUids.add(event.uid);

    // We use server-side merge to avoid overwriting mirroredToGcal if it's already true
    // but we MUST include userId and source so the client-side query finds them.
    batch.set(
      docRef,
      {
        userId,
        icalUid: event.uid,
        title: event.summary,
        dueDate: event.startDate,
        startTime: event.startTime || null,
        endTime: event.endTime || null,
        allDay: event.allDay,
        location: event.location || null,
        description: event.description || null,
        source: "family-shared",
        readOnly: true,
        lastSyncedAt: now,
        // Initialize these if new, but don't overwrite if they exist
        createdAt: now,
        mirroredToGcal: false,
      },
      {
        // We only update content fields + sync metadata.
        // Importantly, we OMIT 'mirroredToGcal' and 'createdAt' from mergeFields
        // so that for EXISTING docs, those values are preserved.
        // For NEW docs, all fields in the payload above ARE written.
        mergeFields: [
          "userId",
          "icalUid",
          "title",
          "dueDate",
          "startTime",
          "endTime",
          "allDay",
          "location",
          "description",
          "source",
          "readOnly",
          "lastSyncedAt",
        ],
      }
    );
  }

  await batch.commit();
  console.log(`[sync] User ${userId}: Upserted ${events.length} events.`);

  // Remove stale events that are no longer in the ICS feed
  await removeStaleEvents(userId, incomingUids);

  return { count: events.length };
}

/**
 * Delete events from Firestore that no longer appear in the ICS feed.
 * Prevents phantom events from lingering when the calendar owner
 * deletes or moves them.
 */
async function removeStaleEvents(
  userId: string,
  currentUids: Set<string>
): Promise<void> {
  const existingSnap = await db
    .collection(EVENTS_COLLECTION)
    .where("userId", "==", userId)
    .where("source", "==", "family-shared")
    .get();

  const staleRefs: FirebaseFirestore.DocumentReference[] = [];

  for (const doc of existingSnap.docs) {
    const data = doc.data();
    if (!currentUids.has(data.icalUid)) {
      staleRefs.push(doc.ref);
    }
  }

  if (staleRefs.length > 0) {
    const batch = db.batch();
    staleRefs.forEach((ref) => batch.delete(ref));
    await batch.commit();
    console.log(`[sync] User ${userId}: Removed ${staleRefs.length} stale events.`);
  }
}

/**
 * Sanitize an iCloud UID for use as a Firestore document ID.
 * Firestore doc IDs cannot contain '/' or be longer than 1500 bytes.
 */
function sanitizeDocId(uid: string): string {
  return uid.replace(/[/\\#$.[\]]/g, "_").slice(0, 200);
}
