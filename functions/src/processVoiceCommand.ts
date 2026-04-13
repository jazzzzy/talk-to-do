import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import speech from '@google-cloud/speech'

if (!admin.apps.length) {
  admin.initializeApp()
}

// Ensure the Speech client connects with the default credentials on Google Cloud environments
const client = new speech.v1.SpeechClient()

/**
 * Handles incoming audio blobs from the PWA, transcribes them using GCP STT,
 * and parses task details + calendar conflicts using Gemini.
 */
export const processVoiceCommand = onCall({ timeoutSeconds: 60 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to process voice commands.')
  }

  const { audioBase64, timezone } = request.data

  if (!audioBase64) {
    throw new HttpsError('invalid-argument', 'Missing audioBase64 payload.')
  }

  let transcript = ''

  try {
    // Phase 1: Transcribe the audio using Speech-to-Text V1
    const [response] = await client.recognize({
      audio: {
        content: audioBase64,
      },
      config: {
        encoding: 'WEBM_OPUS', // Default format from modern browsers' MediaRecorder
        sampleRateHertz: 48000,
        languageCode: 'en-US', // Can be parameterized later if i18n is needed
      },
    })

    const results = response.results
    if (!results || results.length === 0) {
      throw new Error('No speech recognized.')
    }
    transcript = results.map((r) => r.alternatives?.[0]?.transcript).join('\n')
    
    console.log(`[processVoiceCommand] Transcript received: "${transcript}"`)

  } catch (error) {
    console.error('[processVoiceCommand] STT Error:', error)
    throw new HttpsError('internal', 'Failed to transcribe audio.', error)
  }

  try {
    // Phase 2 Placeholder: LLM logic
    return {
      title: transcript || 'Placholder Task from Voice',
      dueDate: new Date().toLocaleDateString('en-CA'),
      startTime: undefined,
      endTime: undefined,
      hasConflict: false,
    }
  } catch (error) {
    console.error('Error processing voice command LLM:', error)
    throw new HttpsError('internal', 'Failed to parse task from transcript.')
  }
})
