import { useVoiceRecorder, type ParsedVoiceTask } from '@/hooks/useVoiceRecorder'

interface Props {
  onResult: (task: ParsedVoiceTask) => void
}

export default function VoiceRecorderFab({ onResult }: Props) {
  const { isRecording, isProcessing, error, startRecording, stopRecording } = useVoiceRecorder(onResult)

  const handleToggle = () => {
    if (isProcessing) return
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Animation classes
  const pulseClass = isRecording ? 'animate-pulse scale-110 shadow-rose-500/40 bg-rose-500/20 border-rose-500/50' : 'bg-[#120F2D]/80 border-white/10 shadow-indigo-500/20'
  const spinClass = isProcessing ? 'animate-spin border-t-indigo-400' : ''

  return (
    <div className="fixed bottom-28 right-6 z-40 flex flex-col items-end gap-2">
      {error && (
        <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] px-3 py-1.5 rounded-full font-bold backdrop-blur-md animate-task-in shadow-lg">
          {error}
        </div>
      )}
      
      {(isRecording || isProcessing) && !error && (
        <div className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] px-3 py-1.5 rounded-full font-bold backdrop-blur-md animate-task-in uppercase tracking-wider shadow-lg">
          {isProcessing ? 'Analyzing...' : 'Listening...'}
        </div>
      )}

      <button
        onClick={handleToggle}
        aria-label={isRecording ? 'Stop recording' : 'Start voice task'}
        className={`
          flex items-center justify-center 
          w-14 h-14 rounded-full backdrop-blur-xl border
          transition-all duration-300 shadow-xl
          ${pulseClass}
        `}
      >
        {isProcessing ? (
          <div className={`w-5 h-5 rounded-full border-2 border-white/20 ${spinClass}`} />
        ) : (
          <svg 
            className={`w-6 h-6 ${isRecording ? 'text-rose-400' : 'text-indigo-300'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={1.5}
          >
            {isRecording ? (
              <rect x="7" y="7" width="10" height="10" fill="currentColor" stroke="none" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            )}
          </svg>
        )}
      </button>
    </div>
  )
}
