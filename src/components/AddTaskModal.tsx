import { useEffect, useRef, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (title: string, dueDate: string, startTime?: string, endTime?: string) => Promise<void>
}

function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA')
}

/**
 * AddTaskModal — a bottom-sheet that slides up from the viewport bottom.
 * Dismissible via backdrop click, Escape key, or the Cancel button.
 */
export default function AddTaskModal({ open, onClose, onAdd }: Props) {
  const [title, setTitle]       = useState('')
  const [dueDate, setDueDate]   = useState(getLocalToday())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the title input when modal opens; reset state when it closes.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80)
      setTitle('')
      setDueDate(getLocalToday())
      setStartTime('')
      setEndTime('')
      setError(null)
    }
  }, [open])

  // Dismiss on Escape key.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    setLoading(true)
    setError(null)
    try {
      await onAdd(title.trim(), dueDate, startTime || undefined, endTime || undefined)
      onClose()
    } catch {
      setError('Could not save task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    /**
     * Backdrop: fixed, viewport-sized.
     * justify-center ensures horizontal centering on all screen sizes.
     * overflow-hidden prevents child bleed.
     */
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex items-end justify-center overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add task"
    >
      {/*
       * Sheet: max-h-[92dvh] ensures it leaves a gap at the top.
       * flex flex-col allows internal scrolling of content.
       */}
      <div
        className="animate-slide-up w-full max-w-lg rounded-t-3xl pb-safe flex flex-col"
        style={{
          background: 'rgba(18, 15, 45, 0.98)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderBottom: 'none',
          maxHeight: '92dvh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle area (fixed at top of sheet) */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8">
          <div className="flex flex-col gap-5">
            <h2 className="text-white font-bold text-lg tracking-tight">New Task</h2>

            <form id="add-task-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Task title input */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="modal-task-title"
                  className="text-white/40 text-[10px] font-bold uppercase tracking-widest pl-1"
                >
                  What needs to be done?
                </label>
                <input
                  id="modal-task-title"
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design app icon…"
                  required
                  maxLength={200}
                  className="w-full max-w-full box-border bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-400/50 focus:bg-white/10 transition-all shadow-inner"
                />
              </div>

              {/* Due date and Times */}
              <div className="flex flex-col gap-4">
                {/* Date */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="modal-task-date"
                    className="text-white/40 text-[10px] font-bold uppercase tracking-widest pl-1"
                  >
                    Due Date
                  </label>
                  <input
                    id="modal-task-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full max-w-full box-border bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm focus:outline-none focus:border-indigo-400/50 transition-all shadow-inner"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* Times (Side-by-side) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
                    <label
                      htmlFor="modal-task-start-time"
                      className="text-white/40 text-[10px] font-bold uppercase tracking-widest pl-1"
                    >
                      Start Time (Opt)
                    </label>
                    <input
                      id="modal-task-start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                        if (!e.target.value) setEndTime('')
                      }}
                      className="w-full max-w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-4 text-white text-sm focus:outline-none focus:border-indigo-400/50 transition-all shadow-inner"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  <div className="flex flex-col gap-2 min-w-0 overflow-hidden">
                    <label
                      htmlFor="modal-task-end-time"
                      className="text-white/40 text-[10px] font-bold uppercase tracking-widest pl-1"
                    >
                      End Time (Opt)
                    </label>
                    <input
                      id="modal-task-end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={!startTime}
                      className="w-full max-w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-4 text-white text-sm focus:outline-none focus:border-indigo-400/50 disabled:opacity-30 disabled:grayscale transition-all shadow-inner"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* Error state */}
              {error && (
                <div role="alert" className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 animate-task-in">
                  {error}
                </div>
              )}

              {/* Action buttons (fixed at content bottom) */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="glass-button flex-1 rounded-2xl py-4 text-white/50 font-bold text-sm cursor-pointer hover:text-white/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  id="modal-add-task-submit"
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="flex-1 rounded-2xl py-4 text-white font-bold text-sm cursor-pointer disabled:opacity-40 disabled:scale-100 transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-indigo-500/25"
                  style={{
                    background: loading
                      ? 'rgba(99,102,241,0.5)'
                      : 'linear-gradient(135deg, #818cf8, #6366f1)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    'Create Task'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
