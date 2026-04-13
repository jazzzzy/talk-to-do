# Spec: Voice-Enabled Task Creation

## Objective
Enable hands-free, intelligent task creation through voice input in the TaskFlow PWA. Users can tap a microphone button, dictate a task description with implicit or explicit times (e.g., "Remind me to call Mom tomorrow afternoon at 4"), and the app will transcribe the audio, parse the task details using an LLM, check their Google Calendar for conflicts, and pre-fill the `AddTaskModal` with the data and any conflict warnings.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, HTML5 `MediaRecorder` API
- **Backend**: Firebase Cloud Functions (v2), Node.js, Firebase Admin Auth
- **Third-Party Integrations**: 
  - STT/LLM Provider (OpenAI Whisper + GPT-4o-mini, OR Google Cloud STT + Gemini)
  - Google Calendar API (via `googleapis` or direct HTTP fetches with user's access token)

## Commands
*   **Run Dev**: `npm run dev`
*   **Run Typescript Check**: `npx tsc -b --noEmit`
*   **Deploy Emulators**: `firebase emulators:start`
*   **Deploy Functions**: `firebase deploy --only functions`

## Project Structure
```
src/
  components/
    AddTaskModal.tsx      → Will be updated to receive pre-filled state & warnings
    VoiceRecorderFab.tsx  → (NEW) Floating action button to capture mic input
  hooks/
    useVoiceTasks.ts      → (NEW) Handles MediaRecorder state and Cloud Function calls
functions/
  src/
    processVoiceCommand.ts→ (NEW) Cloud Function for STT, LLM parsing, and GCal conflict checking
```

## Code Style
*   **React hooks**: Strict separation of UI and business logic.
*   **Type Safety**: Strict TS definitions for LLM outputs.
```typescript
interface ParsedTaskResponse {
  title: string;
  dueDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  hasConflict: boolean;
  conflictWarning?: string;
}
```

## Testing Strategy
1.  **Frontend**: Manual browser testing using Chrome/Safari to verify microphone permissions and MediaRecorder blob generation. Verification of smooth Glassmorphism UI states (`Listening...`, `Processing...`).
2.  **Backend**: Use Firebase Emulators. Mock the Google Calendar API responses and test the LLM prompt behavior with predefined text transcripts to ensure date/time interpretation is robust.

## Boundaries
- **Always**: Request explicit microphone permissions gracefully, handle audio constraints (e.g. background noise handling or short recordings). Show clear UI processing states (transcription and LLM parsing takes 2-4 seconds).
- **Ask first**: Before installing specific heavy SDKs like `@google/genai` or `openai` into the Firebase functions, verify the chosen provider with the user.
- **Never**: Store the raw voice recordings permanently. The audio Blob should be transcribed entirely in memory and immediately discarded by the Cloud Function.

## Success Criteria
- [ ] User can hold/tap a microphone icon in the PWA.
- [ ] The app successfully records audio from the phone/desktop mic.
- [ ] The audio is sent to a Firebase Cloud Function for transcription.
- [ ] An LLM accurately extracts `title`, `dueDate`, `startTime`, and `endTime`.
- [ ] The LLM successfully uses a Tool Call to query Google Calendar API, verifying if the requested time block has conflicts.
- [ ] The Add Task Modal opens with the fields populated and a visible warning if the slot is double-booked.


## Finalized Decisions
1. **AI Provider**: Google Cloud (Speech-to-Text via Google Cloud SDK / Vertex AI) and Gemini for LLM parsing.
2. **Architecture**: Direct Tool Calling inside the Firebase Cloud Function using existing Google OAuth tokens.
3. **Conflict Resolution**: The LLM will provide a funny, short warning message in the UI if a conflict is detected. It will not auto-shift the task.
