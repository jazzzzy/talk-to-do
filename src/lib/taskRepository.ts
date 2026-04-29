/**
 * taskRepository.ts — all Firestore side-effects live here.
 * Components and hooks import these functions; they never touch `db` directly.
 * This keeps Firebase coupling in one place and makes testing trivial.
 */
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Task, NewTaskPayload } from '@/types/task'

const COLLECTION = 'tasks'

/* ─── Subscription ──────────────────────────────────────────── */

/**
 * Subscribe to all tasks owned by `userId`.
 * Returns the Firestore unsubscribe function — call it in useEffect cleanup.
 *
 * We intentionally avoid orderBy() to prevent requiring a composite index
 * at the MVP stage. Sorting is done client-side inside useTasks.
 */
export function subscribeToUserTasks(
  userId: string,
  onData: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((snap) => ({
        id: snap.id,
        ...(snap.data() as Omit<Task, 'id'>),
      }))
      onData(tasks)
    },
    (err) => onError(err),
  )
}

/* ─── Write operations ──────────────────────────────────────── */

/** Add a new pending task for the given user. */
export async function addTask(
  userId: string,
  title: string,
  dueDate?: string,
  startTime?: string,
  endTime?: string,
): Promise<void> {
  const payload: NewTaskPayload = {
    userId,
    title: title.trim(),
    dueDate: dueDate || undefined,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    status: 'pending',
    createdAt: Date.now(),
  }
  await addDoc(collection(db, COLLECTION), payload)
}

/** Toggle a task between 'pending' and 'completed'. */
export async function toggleTaskStatus(
  taskId: string,
  currentStatus: Task['status'],
): Promise<void> {
  const next: Task['status'] = currentStatus === 'pending' ? 'completed' : 'pending'
  await updateDoc(doc(db, COLLECTION, taskId), { status: next })
}

/** Permanently delete a task. */
export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, taskId))
}
