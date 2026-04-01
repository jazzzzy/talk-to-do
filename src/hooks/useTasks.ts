import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  subscribeToUserTasks,
  addTask as repoAddTask,
  toggleTaskStatus as repoToggle,
  deleteTask as repoDelete,
} from '@/lib/taskRepository'
import type { Task } from '@/types/task'
import type { DisplayTask } from '@/types/calendarEvent'

/* ─── Timezone-safe "today" ─────────────────────────────────── */

/**
 * Returns the current local date as 'YYYY-MM-DD'.
 * Using 'en-CA' locale is a well-known trick — Canada uses ISO date format,
 * so toLocaleDateString('en-CA') reliably produces YYYY-MM-DD in the
 * device's local timezone without any external library.
 */
function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA')
}

/** Convert a user Task into a unified DisplayTask. */
function taskToDisplayTask(task: Task): DisplayTask {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    status: task.status,
    createdAt: task.createdAt,
    source: 'user',
    readOnly: false,
  }
}

/* ─── Hook return type ──────────────────────────────────────── */

export interface UseTasksReturn {
  // Raw + derived views (now DisplayTask to support family events)
  allTasks: DisplayTask[]
  todayTasks: DisplayTask[]
  upcomingTasks: DisplayTask[]
  overdueTasks: DisplayTask[]
  loading: boolean
  error: Error | null
  // CRUD operations bound to the current user (only for user-created tasks)
  addTask: (title: string, dueDate: string) => Promise<void>
  toggleTaskStatus: (taskId: string, currentStatus: Task['status']) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}

/* ─── useTasks ──────────────────────────────────────────────── */

/**
 * @param familyDisplayTasks — optional array of family events (as DisplayTasks)
 *   to merge into the task views. Pass from useCalendarEvents().displayTasks.
 */
export function useTasks(familyDisplayTasks: DisplayTask[] = []): UseTasksReturn {
  const { user } = useAuth()
  const [rawTasks, setRawTasks]   = useState<Task[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<Error | null>(null)

  // Subscribe to real-time Firestore updates for the current user's tasks.
  useEffect(() => {
    if (!user) {
      setRawTasks([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToUserTasks(
      user.uid,
      (tasks) => {
        // Sort client-side: newest first
        const sorted = [...tasks].sort((a, b) => b.createdAt - a.createdAt)
        setRawTasks(sorted)
        setLoading(false)
      },
      (err) => {
        console.error('[useTasks] Firestore error:', err)
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe // Cleanup on unmount or user change
  }, [user])

  // Merge user tasks + family events into a unified DisplayTask array
  const allTasks: DisplayTask[] = useMemo(() => {
    const userDisplayTasks = rawTasks.map(taskToDisplayTask)
    const merged = [...userDisplayTasks, ...familyDisplayTasks]
    // Sort by dueDate ascending, then by createdAt descending
    return merged.sort((a, b) => {
      const dateCompare = a.dueDate.localeCompare(b.dueDate)
      if (dateCompare !== 0) return dateCompare
      return b.createdAt - a.createdAt
    })
  }, [rawTasks, familyDisplayTasks])

  // Derive the three filtered views. useMemo ensures these only recompute
  // when `allTasks` changes, not on every render.
  const today = getLocalToday()

  const todayTasks: DisplayTask[] = useMemo(
    () => allTasks.filter((t) => t.dueDate === today),
    [allTasks, today],
  )

  const upcomingTasks: DisplayTask[] = useMemo(
    () => allTasks.filter((t) => t.dueDate > today),
    [allTasks, today],
  )

  const overdueTasks: DisplayTask[] = useMemo(
    () => allTasks.filter((t) => t.dueDate < today && t.status === 'pending'),
    [allTasks, today],
  )

  // Bind repository calls to the current user so callers don't need to
  // pass userId explicitly.
  const addTask = async (title: string, dueDate: string) => {
    if (!user) throw new Error('Not authenticated')
    await repoAddTask(user.uid, title, dueDate)
  }

  const toggleTaskStatus = async (taskId: string, currentStatus: Task['status']) => {
    await repoToggle(taskId, currentStatus)
  }

  const deleteTask = async (taskId: string) => {
    await repoDelete(taskId)
  }

  return {
    allTasks,
    todayTasks,
    upcomingTasks,
    overdueTasks,
    loading,
    error,
    addTask,
    toggleTaskStatus,
    deleteTask,
  }
}
