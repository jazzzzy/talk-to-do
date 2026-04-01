/**
 * useUserSettings — manages the current user's settings (family calendar URL).
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  subscribeToUserSettings,
  saveFamilyCalendarUrl,
} from '@/lib/settingsRepository'
import type { UserSettings } from '@/types/calendarEvent'

export interface UseUserSettingsReturn {
  settings: UserSettings | null
  loading: boolean
  saving: boolean
  error: Error | null
  saveCalendarUrl: (url: string) => Promise<void>
}

export function useUserSettings(): UseUserSettingsReturn {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading]  = useState(true)
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setSettings(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToUserSettings(
      user.uid,
      (s) => {
        setSettings(s)
        setLoading(false)
      },
      (err) => {
        console.error('[useUserSettings] Error:', err)
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const saveCalendarUrl = useCallback(async (url: string) => {
    if (!user) throw new Error('Not authenticated')
    setSaving(true)
    setError(null)
    try {
      await saveFamilyCalendarUrl(user.uid, url)
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user])

  return { settings, loading, saving, error, saveCalendarUrl }
}
