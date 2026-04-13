# Task Checklist: Voice-Enabled Task Creation

- `[x]` **Task: Add backend dependencies and initialize Firebase Cloud Function**
  - **Acceptance**: `package.json` in `functions` has `@google-cloud/speech` and `@google/genai` installed. A barebones `processVoiceCommand` HTTP callable function is exported.
  - **Verify**: Run `npm run build` in functions folder directory with no errors.
  - **Files**: `functions/package.json`, `functions/src/index.ts`, `functions/src/processVoiceCommand.ts`

- `[x]` **Task: Implement STT conversion inside Cloud Function**
  - **Acceptance**: Function correctly accepts base64 audio and passes it to the Google Cloud Speech-to-Text V1 API (using `v1.SpeechClient()`), returning a raw text transcript.
  - **Verify**: Write a simple unit test or invoke via emulator shell to verify basic transcription logic.
  - **Files**: `functions/src/processVoiceCommand.ts`

- `[x]` **Task: Define Gemini Tool and Calendar API wrapper**
  - **Acceptance**: A helper function is written to query the user's Google Calendar using `googleapis`. This wrapper is cleanly defined as a tool for the Gemini SDK.
  - **Verify**: TypeScript compiles successfully; verify calendar API scope requirements.
  - **Files**: `functions/src/processVoiceCommand.ts`, `src/lib/googleCalendar.ts` (if code sharing applies)

- `[x]` **Task: Prompt Engineering & Response Parsing**
  - **Acceptance**: Gemini is invoked with the transcript and tool. It correctly identifies the standard task variables and detects conflicts to generate a funny, short warning message. It returns typed JSON matching `ParsedTaskResponse`.
  - **Verify**: Test within Firebase emulator using simulated STT text resolving to a mock calendar busy slot.
  - **Files**: `functions/src/processVoiceCommand.ts`

- `[x]` **Task: Implement `<useVoiceRecorder>` Hook**
  - **Acceptance**: A robust custom hook uses `MediaRecorder` API to capture mic stream, handles permissions, outputs a base64 blob, and triggers the `processVoiceCommand` Firebase function.
  - **Verify**: Hook correctly logs base64 payload to console during local dev.
  - **Files**: `src/hooks/useVoiceRecorder.ts`

- `[x]` **Task: Implement `VoiceRecorderFab` UI Component**
  - **Acceptance**: A microphone Floating Action Button is created with distinct active ("Listening") and loading ("Processing") glassmorphic states. Added to the main App shell.
  - **Verify**: Visual check. Button displays correctly and triggers the hook without page disruption.
  - **Files**: `src/components/VoiceRecorderFab.tsx`, `src/layout/MainLayout.tsx`

- `[x]` **Task: Link Voice Payload to AddTaskModal**
  - **Acceptance**: When the hook receives the parsed JSON from Firebase, `AddTaskModal` opens automatically with all values heavily pre-filled, and displaying the funny `conflictWarning` prominently if it exists.
  - **Verify**: Manual end-to-end check in the browser. Voice triggers modal opening with data intact. 
  - **Files**: `src/pages/HomePage.tsx`, `src/components/AddTaskModal.tsx`
