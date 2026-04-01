import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTasks } from '@/hooks/useTasks'
import { useCalendarEvents } from '@/hooks/useCalendarEvents'
import { useGoogleCalendarSync } from '@/hooks/useGoogleCalendarSync'
import MainLayout from '@/layout/MainLayout'
import TaskCard from '@/components/TaskCard'
import AddTaskModal from '@/components/AddTaskModal'
import SettingsModal from '@/components/SettingsModal'
import EmptyState from '@/components/EmptyState'
import type { ActiveView } from '@/components/BottomNav'
import type { DisplayTask } from '@/types/calendarEvent'

/**
 * HomePage — Unified TaskFlow interface.
 * Merges Today and Upcoming into a single screen with a separator.
 * Family calendar events appear inline with a purple badge.
 */
export default function HomePage() {
  const { user, signOut } = useAuth()

  // Family calendar events
  const { events: familyEvents, displayTasks: familyDisplayTasks } = useCalendarEvents()

  // Mirror new family events to Google Calendar (client-side)
  useGoogleCalendarSync(familyEvents)

  // Pass family display tasks into useTasks for merged views
  const {
    todayTasks,
    upcomingTasks,
    overdueTasks,
    loading,
    error,
    addTask,
    toggleTaskStatus,
    deleteTask,
  } = useTasks(familyDisplayTasks)

  const [activeView, setActiveView]     = useState<ActiveView>('tasks')
  const [modalOpen, setModalOpen]       = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  /* ── Handlers ───────────────────────────────────────────── */
  const handleToggle = async (task: DisplayTask) => {
    // Family events are read-only — no toggle
    if (task.readOnly) return
    try { await toggleTaskStatus(task.id, task.status) }
    catch (e) { console.error('[HomePage] toggle error', e) }
  }

  const handleDelete = async (task: DisplayTask) => {
    // Family events are read-only — no delete
    if (task.readOnly) return
    try { await deleteTask(task.id) }
    catch (e) { console.error('[HomePage] delete error', e) }
  }

  const handleAdd = async (title: string, dueDate: string) => {
    await addTask(title, dueDate)
  }

  /* ── Combined Tasks Render ──────────────────────────────── */
  const renderTasksView = () => {
    const hasToday    = todayTasks.length > 0
    const hasUpcoming = upcomingTasks.length > 0

    if (!hasToday && !hasUpcoming) {
      return <EmptyState view="tasks" /> // Falls back to caught up message
    }

    return (
      <div className="flex flex-col gap-3 pt-2">
        {/* Today Section */}
        {hasToday && (
          <ul className="flex flex-col gap-3" role="list" aria-label="Today's tasks">
            {todayTasks.map((task, i) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  index={i}
                  onToggle={() => handleToggle(task)}
                  onDelete={() => handleDelete(task)}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Separator — thin but distinctive line */}
        {hasToday && hasUpcoming && (
          <div className="relative py-4 px-2">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/10" />
            <span className="relative z-10 bg-[#0f0c29]/50 backdrop-blur-sm px-3 text-[10px] font-bold text-white/20 uppercase tracking-widest rounded-full border border-white/5 ml-2">
              Upcoming
            </span>
          </div>
        )}

        {/* Upcoming Section */}
        {hasUpcoming && (
          <ul className="flex flex-col gap-3" role="list" aria-label="Upcoming tasks">
            {upcomingTasks.map((task, i) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  index={hasToday ? i + todayTasks.length : i}
                  onToggle={() => handleToggle(task)}
                  onDelete={() => handleDelete(task)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  /* ── Overdue Render ─────────────────────────────────────── */
  const renderOverdueView = () => {
    if (overdueTasks.length === 0) {
      return <EmptyState view="overdue" />
    }
    return (
      <ul className="flex flex-col gap-3 pt-2" role="list" aria-label="Overdue tasks">
        {overdueTasks.map((task, i) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              index={i}
              onToggle={() => handleToggle(task)}
              onDelete={() => handleDelete(task)}
            />
          </li>
        ))}
      </ul>
    )
  }

  /* ── Main Render ────────────────────────────────────────── */
  return (
    <>
      <MainLayout
        user={user}
        activeView={activeView}
        onViewChange={setActiveView}
        onAddClick={() => setModalOpen(true)}
        overdueCount={overdueTasks.length}
        onSignOut={signOut}
        onSettingsClick={() => setSettingsOpen(true)}
      >
        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-3 pt-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-white/5 border border-white/8 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="glass-card rounded-2xl px-5 py-4 mt-2 text-rose-400 text-sm font-medium border border-rose-500/20">
            ⚠ Failed to load tasks: {error.message}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          activeView === 'tasks' ? renderTasksView() : renderOverdueView()
        )}
      </MainLayout>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAdd}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
