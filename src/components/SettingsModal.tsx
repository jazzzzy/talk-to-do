/**
 * SettingsModal — bottom-sheet for configuring the family calendar URL.
 * Includes a tooltip explaining where to find the iCloud public link.
 */
import { useEffect, useRef, useState } from 'react'
import { useUserSettings } from '@/hooks/useUserSettings'
import { getFunctions, httpsCallable } from 'firebase/functions'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: Props) {
  const { settings, saving, saveCalendarUrl } = useUserSettings()
  const [url, setUrl]               = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)
  const [syncing, setSyncing]       = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Pre-fill with existing URL when modal opens
  useEffect(() => {
    if (open) {
      setUrl(settings?.familyCalendarUrl ?? '')
      setError(null)
      setSuccess(false)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open, settings])

  // Dismiss on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleSave = async () => {
    if (!url.trim()) {
      setError('Please enter a calendar URL.')
      return
    }

    // Basic URL validation
    if (!url.startsWith('https://') && !url.startsWith('webcal://')) {
      setError('URL must start with https:// or webcal://')
      return
    }

    setError(null)
    setSuccess(false)

    try {
      // Normalize webcal:// to https://
      const normalizedUrl = url.replace(/^webcal:\/\//, 'https://')
      await saveCalendarUrl(normalizedUrl)
      setSuccess(true)
      setUrl(normalizedUrl)
    } catch {
      setError('Failed to save. Please try again.')
    }
  }

  const handleManualSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const functions = getFunctions()
      const trigger = httpsCallable(functions, 'triggerCalendarSync')
      await trigger()
      setSuccess(true)
    } catch (err) {
      console.error('[Settings] Manual sync failed:', err)
      setError('Sync failed. Make sure the URL is valid and accessible.')
    } finally {
      setSyncing(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="animate-backdrop-in fixed inset-0 z-50 flex items-end justify-center overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
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
        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8">
          <div className="flex flex-col gap-6">
            <h2 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-sm">
                ⚙️
              </span>
              Settings
            </h2>

            {/* Family Calendar Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="settings-calendar-url"
                  className="text-white/40 text-[10px] font-bold uppercase tracking-widest pl-1"
                >
                  Shared Family Calendar URL
                </label>

                {/* Tooltip trigger */}
                <button
                  type="button"
                  onClick={() => setTooltipOpen(!tooltipOpen)}
                  className="w-5 h-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/40 text-[10px] font-bold cursor-pointer hover:bg-white/20 transition-all"
                  aria-label="How to find your calendar URL"
                >
                  ?
                </button>
              </div>

              {/* Tooltip content */}
              {tooltipOpen && (
                <div className="animate-task-in bg-purple-500/10 border border-purple-400/20 rounded-2xl px-4 py-3 text-xs text-purple-200/80 leading-relaxed flex flex-col gap-2">
                  <p className="font-semibold text-purple-300">📱 How to get the link:</p>
                  <ol className="list-decimal list-inside space-y-1 text-white/50">
                    <li>Open the <strong className="text-white/70">Calendar</strong> app on iPhone</li>
                    <li>Tap <strong className="text-white/70">Calendars</strong> at the bottom</li>
                    <li>Tap the <strong className="text-white/70">ⓘ</strong> next to your shared calendar</li>
                    <li>Enable <strong className="text-white/70">"Public Calendar"</strong></li>
                    <li>Tap <strong className="text-white/70">"Share Link"</strong> and copy it</li>
                  </ol>
                  <p className="text-white/35 text-[10px] mt-1">
                    The link looks like: <code className="text-purple-300/60">https://p123-caldav.icloud.com/published/...</code>
                  </p>
                </div>
              )}

              {/* URL Input */}
              <input
                id="settings-calendar-url"
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setSuccess(false)
                }}
                placeholder="https://p123-caldav.icloud.com/published/..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all shadow-inner"
              />

              {/* Error */}
              {error && (
                <div role="alert" className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 animate-task-in">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-task-in">
                  ✓ Saved successfully!
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !url.trim()}
                  className="flex-1 rounded-2xl py-3.5 text-white font-bold text-sm cursor-pointer disabled:opacity-40 transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-purple-500/20"
                  style={{
                    background: saving
                      ? 'rgba(168,85,247,0.5)'
                      : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                  }}
                >
                  {saving ? 'Saving…' : 'Save URL'}
                </button>

                {settings?.familyCalendarUrl && (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="glass-button rounded-2xl px-4 py-3.5 text-white/60 font-bold text-sm cursor-pointer hover:text-white/90 disabled:opacity-40 transition-all"
                  >
                    {syncing ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" />
                        Syncing
                      </span>
                    ) : (
                      '↻ Sync Now'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="glass-button rounded-2xl py-3.5 text-white/40 font-bold text-sm cursor-pointer hover:text-white/70 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
