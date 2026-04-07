import { useEffect, useRef, useState, useCallback } from 'react'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useAuth } from '@/context/AuthContext'
import { fetchCalendarList } from '@/lib/googleCalendar'
import { getFunctions, httpsCallable } from 'firebase/functions'

interface Props {
  open: boolean
  onClose: () => void
}

interface GCalCalendar {
  id: string
  summary: string
  primary?: boolean
}

export default function SettingsModal({ open, onClose }: Props) {
  const { googleAccessToken } = useAuth()
  const { settings, saving, saveSettings } = useUserSettings()

  const [url, setUrl]                     = useState('')
  const [selectedIds, setSelectedIds]     = useState<string[]>([])
  const [availableCals, setAvailableCals] = useState<GCalCalendar[]>([])
  
  const [error, setError]                 = useState<string | null>(null)
  const [success, setSuccess]             = useState(false)
  const [syncing, setSyncing]             = useState(false)
  const [syncMessage, setSyncMessage]     = useState<string | null>(null)
  const [tooltipOpen, setTooltipOpen]     = useState(false)
  const [loadingCals, setLoadingCals]     = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Data Initialization ─────────────────────────────────
  
  const loadCals = useCallback(async () => {
    if (!googleAccessToken) return
    setLoadingCals(true)
    try {
      const list = await fetchCalendarList(googleAccessToken)
      setAvailableCals(list)

      // If user hasn't saved preferences yet, default to Család/Primary
      if (!settings?.googleCalendarIds) {
        const defaults = list
          .filter(c => c.primary || c.summary.toLowerCase().includes('család'))
          .map(c => c.id)
        
        // If nothing matches 'Család', at least keep 'primary'
        if (defaults.length === 0) defaults.push('primary')
        setSelectedIds(defaults)
      }
    } catch (err) {
      console.error('[Settings] Failed to fetch calendars:', err)
    } finally {
      setLoadingCals(false)
    }
  }, [googleAccessToken, settings?.googleCalendarIds])

  useEffect(() => {
    if (open) {
      setUrl(settings?.familyCalendarUrl ?? '')
      setSelectedIds(settings?.googleCalendarIds ?? [])
      setError(null)
      setSuccess(false)
      setSyncMessage(null)
      loadCals()
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open, settings, loadCals])

  // Dismiss on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ── Handlers ─────────────────────────────────────────────

  const toggleCalendar = (id: string) => {
    setSuccess(false)
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    // URL is optional if they just want GCal, but validate if present
    if (url.trim() && !url.startsWith('https://') && !url.startsWith('webcal://')) {
      setError('iCloud URL must start with https:// or webcal://')
      return
    }

    setError(null)
    setSuccess(false)
    setSyncMessage(null)

    try {
      const normalizedUrl = url.trim().replace(/^webcal:\/\//, 'https://')
      await saveSettings({
        familyCalendarUrl: normalizedUrl,
        googleCalendarIds: selectedIds,
      })
      setSuccess(true)
    } catch (err) {
      setError('Failed to save settings. Please try again.')
    }
  }

  const handleManualSync = async () => {
    setSyncing(true)
    setError(null)
    setSyncMessage(null)
    try {
      const functions = getFunctions()
      const trigger = httpsCallable(functions, 'triggerCalendarSync')
      const result = await trigger() as { data: { count: number } }
      setSyncMessage(`✓ Synced ${result.data.count} events`)
    } catch (err) {
      console.error('[Settings] Manual sync failed:', err)
      setError('Sync failed. Make sure the iCloud URL is valid.')
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

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8">
          <div className="flex flex-col gap-8">
            <h2 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-sm">
                ⚙️
              </span>
              Settings
            </h2>

            {/* Google Calendar Section */}
            <div className="flex flex-col gap-4">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest pl-1">
                Google Calendars to Sync
              </label>

              {loadingCals ? (
                <div className="flex flex-col gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {availableCals.map(cal => (
                    <label
                      key={cal.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedIds.includes(cal.id)
                          ? 'bg-blue-500/10 border-blue-400/30 text-blue-100'
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-sm font-medium truncate pr-4">{cal.summary}</span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedIds.includes(cal.id)}
                        onChange={() => toggleCalendar(cal.id)}
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedIds.includes(cal.id)
                          ? 'bg-blue-500 border-blue-400 scale-110 shadow-lg shadow-blue-500/40'
                          : 'border-white/20'
                      }`}>
                        {selectedIds.includes(cal.id) && (
                          <span className="text-[10px] text-white">✓</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Family Calendar Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="settings-calendar-url"
                  className="text-white/40 text-[10px] font-bold uppercase tracking-widest pl-1"
                >
                  iCloud Shared Calendar URL
                </label>
                <button
                  type="button"
                  onClick={() => setTooltipOpen(!tooltipOpen)}
                  className="w-5 h-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/40 text-[10px] font-bold hover:bg-white/20"
                >
                  ?
                </button>
              </div>

              {tooltipOpen && (
                <div className="animate-task-in bg-purple-500/10 border border-purple-400/20 rounded-2xl px-4 py-3 text-xs text-purple-200/80 leading-relaxed flex flex-col gap-2">
                  <p className="font-semibold text-purple-300">📱 How to get the link:</p>
                  <ol className="list-decimal list-inside space-y-1 text-white/50">
                    <li>Open <strong className="text-white/70">Calendar</strong> app on iPhone</li>
                    <li>Tap <strong className="text-white/70">Calendars</strong> (bottom) → <strong className="text-white/70">ⓘ</strong></li>
                    <li>Enable <strong className="text-white/70">"Public Calendar"</strong> & copy link</li>
                  </ol>
                </div>
              )}

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
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm placeholder-white/20 focus:outline-none focus:border-purple-400/50"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncing || !url.trim()}
                  className="glass-button flex-1 rounded-2xl py-3 text-white/60 font-bold text-sm cursor-pointer disabled:opacity-30"
                >
                  {syncing ? 'Syncing...' : '↻ Sync iCloud Now'}
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {(error || success || syncMessage) && (
              <div className="flex flex-col gap-2">
                {error && <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</div>}
                {success && <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">✓ Settings saved successfully!</div>}
                {syncMessage && <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{syncMessage}</div>}
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl py-4 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
              >
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl py-4 text-white/30 font-bold text-xs hover:text-white/50 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

