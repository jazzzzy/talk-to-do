import { useAuth } from '@/context/AuthContext'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'

/**
 * App acts as the top-level auth gate.
 * No router needed in Phase 1 — the binary auth state is sufficient (KISS).
 */
export default function App() {
  const { user, loading } = useAuth()

  // Show a minimal spinner while Firebase resolves the persisted auth state.
  // This prevents a flash of the LoginPage for already-authenticated users.
  if (loading) {
    return (
      <div className="gradient-bg min-h-screen w-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  return user ? <HomePage /> : <LoginPage />
}
