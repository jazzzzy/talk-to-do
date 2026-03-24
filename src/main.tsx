import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/context/AuthContext'
import App from '@/App'
import '@/index.css'

/* ─── Error Boundary ────────────────────────────────────────── */
// Catches errors from firebase.ts (e.g. missing env vars) and renders
// a readable message instead of a blank white screen.

interface ErrorBoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="gradient-bg min-h-screen w-full flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-lg rounded-3xl p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <h1 className="text-white text-xl font-semibold">Configuration Error</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              The app could not start. This is usually caused by missing Firebase environment variables.
            </p>
            <pre className="bg-black/30 border border-white/10 rounded-xl p-4 text-rose-300 text-xs whitespace-pre-wrap overflow-auto max-h-48">
              {error.message}
            </pre>
            <p className="text-white/40 text-xs">
              Fix: Copy <code className="text-indigo-400">.env.example</code> → <code className="text-indigo-400">.env</code>, fill in your Firebase values, then restart <code className="text-indigo-400">npm run dev</code>.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ─── Mount ─────────────────────────────────────────────────── */

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
)
