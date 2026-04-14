import { useState, useRef, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import { useAuth } from '@/context/AuthContext'
import { useUserSettings } from '@/hooks/useUserSettings'

export interface ParsedVoiceTask {
  title: string
  dueDate: string
  startTime?: string
  endTime?: string
  hasConflict: boolean
  conflictWarning?: string
}

export function useVoiceRecorder(onResult: (task: ParsedVoiceTask) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { googleAccessToken } = useAuth()
  const { settings } = useUserSettings()
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error('[useVoiceRecorder] Microphone permission denied or failed:', err)
      setError('Microphone access denied.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') return

    mediaRecorder.current.onstop = async () => {
      setIsRecording(false)
      setIsProcessing(true)
      
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
      audioChunks.current = [] // reset
      
      // Stop all mic tracks
      mediaRecorder.current?.stream.getTracks().forEach(track => track.stop())

      try {
        const base64data = await blobToBase64(audioBlob)
        const processCmd = httpsCallable<any, ParsedVoiceTask>(functions, 'processVoiceCommand')
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

        if (!googleAccessToken) {
          console.warn('[useVoiceRecorder] No Google Access Token found. Calendar conflict checking will be skipped.')
        }

        const response = await processCmd({
          audioBase64: base64data,
          timezone,
          accessToken: googleAccessToken || undefined,
          languageCode: settings?.voiceLanguage || 'en-US'
        })

        if (response.data) {
          onResult(response.data)
        }
      } catch (err: any) {
        console.error('[useVoiceRecorder] Cloud Function error:', err)
        setError(err.message || 'Failed to process voice command.')
      } finally {
        setIsProcessing(false)
      }
    }

    mediaRecorder.current.stop()
  }, [googleAccessToken, onResult])

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      // The FileReader returns data:audio/webm;base64,..... 
      // We only want the raw base64 string
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
