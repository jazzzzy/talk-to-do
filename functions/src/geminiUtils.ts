import { GoogleGenAI, Type } from '@google/genai'
import axios from 'axios'

// Requires the GEMINI_API_KEY to be set in the Firebase environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('[GeminiUtils] CRITICAL: GEMINI_API_KEY is not set in environment variables.')
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' })

export interface ParsedVoiceTask {
  title: string
  dueDate: string
  startTime?: string
  endTime?: string
  hasConflict: boolean
  conflictWarning?: string
}

// Step 1: Define the Tool Schema
const calendarTool = {
  functionDeclarations: [
    {
      name: 'checkGoogleCalendar',
      description: 'Queries the users Google Calendar to check if there are any events between timeMin and timeMax.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          timeMin: {
            type: Type.STRING,
            description: 'ISO-8601 extended format datetime for the start of the required block (e.g., "2026-04-14T15:00:00+02:00")',
          },
          timeMax: {
            type: Type.STRING,
            description: 'ISO-8601 extended format datetime for the end of the required block (e.g., "2026-04-14T16:00:00+02:00")',
          },
        },
        required: ['timeMin', 'timeMax'],
      },
    },
  ],
}

// Step 2: Implement the underlying API call
async function checkGoogleCalendar(accessToken: string, timeMin: string, timeMax: string) {
  try {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    url.searchParams.append('timeMin', timeMin)
    url.searchParams.append('timeMax', timeMax)
    url.searchParams.append('singleEvents', 'true')
    url.searchParams.append('maxResults', '5')

    const res = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      // Optional: fast fail timeout for LLM responsiveness
      timeout: 5000, 
    })

    const events = res.data.items || []
    if (events.length === 0) {
      return { conflict: false, message: 'No events found.' }
    }
    
    const summaries = events.map((e: any) => e.summary).join(', ')
    return {
      conflict: true,
      message: `Found ${events.length} overlapping events: ${summaries}`,
      events: events.map((e: any) => ({ summary: e.summary, start: e.start, end: e.end }))
    }
  } catch (error: any) {
    console.warn('[GeminiTool] Failed to fetch calendar:', error?.response?.data || error.message)
    return { conflict: false, message: 'Calendar check failed or unavailable.' }
  }
}

// Step 3: Define the Response Schema for strict JSON output
const taskResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Short actionable title' },
    dueDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
    startTime: { type: Type.STRING, description: 'HH:MM in 24hr format. Leave empty if unstated.' },
    endTime: { type: Type.STRING, description: 'HH:MM in 24hr format. Leave empty if unstated.' },
    hasConflict: { type: Type.BOOLEAN, description: 'True if the calendar check tool revealed an overlap' },
    conflictWarning: { type: Type.STRING, description: 'A short, funny warning if a conflict exists. Otherwise empty.' },
  },
  required: ['title', 'dueDate', 'hasConflict'],
}

/**
 * Main Orchestrator:
 * 1. Pings Gemini with the transcript and tool.
 * 2. If Gemini calls checkGoogleCalendar, we execute it and return the result.
 * 3. Gemini summarizes the decision into the final JSON output.
 */
export async function parseTaskWithGemini(
  transcript: string,
  userTimezone: string,
  accessToken: string | undefined
): Promise<ParsedVoiceTask> {
  
  const today = new Date().toLocaleString('en-US', { timeZone: userTimezone })

  const systemInstruction = `
You are a witty, highly effective task scheduling AI.
Current user time: ${today} (Timezone: ${userTimezone}).

Rules:
1. Extract standard task details from the voice transcript.
2. If time constraints are mentioned, invoke the checkGoogleCalendar tool to see if the user is busy.
3. Output the final task details strictly matching the JSON schema.
4. If the tool indicates a calendar conflict, set hasConflict=true and write a very short, humorous conflictWarning telling them they're double-booked.
  `

  console.log(`[GeminiUtils] Initiating LLM parse for transcript: "${transcript}"`)

  try {
    const chat = ai.chats.create({
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction,
        tools: accessToken ? [calendarTool] : [], // Only supply tool if we have an auth token
        temperature: 0.1,
      },
    })

    // Turn 1: Send transcript
    let response = await chat.sendMessage({ message: transcript })

    // If Gemini decides to call the tool:
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0]
      if (call.name === 'checkGoogleCalendar') {
        const { timeMin, timeMax } = call.args as any
        console.log(`[GeminiUtils] Tool Called: checkGoogleCalendar(${timeMin}, ${timeMax})`)
        
        const toolResult = await checkGoogleCalendar(accessToken!, timeMin, timeMax)
        
        // Emulate returning the result to the model, asking for the final JSON
        response = await chat.sendMessage({
          message: [{ functionResponse: { name: 'checkGoogleCalendar', response: toolResult } }] as any
        })
      }
    }

    // Now, force the final JSON structure using generateContent on the chat history
    // (In full auto mode, we could just ask for structure at the same time, but Gemini handles 
    // structured output best as a distinct generation step).
    const history = await chat.getHistory()
    const finalJSONResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [...history, { role: 'user', parts: [{ text: 'Output the final parsed task as JSON according to the schema.' }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: taskResponseSchema,
        temperature: 0.0, // High accuracy formatting
      }
    })

    const data = JSON.parse(finalJSONResponse.text || '{}') as ParsedVoiceTask
    console.log('[GeminiUtils] Final parsed result:', data)
    return data

  } catch (error: any) {
    console.error('[GeminiUtils] Failed LLM orchestration. Error details:', {
      message: error.message,
      stack: error.stack,
      status: error.status,
      statusText: error.statusText,
      data: error.response?.data
    })
    throw error
  }
}
