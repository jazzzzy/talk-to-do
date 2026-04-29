/**
 * Task — the core data model persisted in Firestore.
 * dueDate is stored as a local YYYY-MM-DD string so filtering is
 * timezone-safe on the client without converting Firestore Timestamps.
 */
export interface Task {
  id: string
  userId: string
  title: string
  dueDate?: string          // ISO local date: 'YYYY-MM-DD' (optional)
  startTime?: string        // 'HH:MM'
  endTime?: string          // 'HH:MM'
  status: 'pending' | 'completed'
  createdAt: number         // Unix timestamp (ms) – Date.now()
}

/** Payload shape when writing a new task to Firestore (no id yet). */
export type NewTaskPayload = Omit<Task, 'id'>
