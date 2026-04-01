import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider as GoogleAuthProviderClass,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/firebase'

/* ─── Mock User (for Agent / PWA testing) ───────────────────── */

const MOCK_USER: Partial<User> = {
  uid: 'mock-user-agent',
  email: 'agent@taskflow.dev',
  displayName: 'Agent Tester',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=TaskFlow',
}

/* ─── Types ─────────────────────────────────────────────────── */

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** Google OAuth access token (available only for the current session). */
  googleAccessToken: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

/* ─── Context ───────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null)

/* ─── Provider ──────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                         = useState<User | null>(null)
  const [loading, setLoading]                   = useState(true)
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // If VITE_MOCK_AUTH is enabled, bypass Firebase and use the dummy user.
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      console.warn('[Auth] Running in MOCK_AUTH mode.')
      setUser(MOCK_USER as User)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      setUser(MOCK_USER as User)
      return
    }

    // Request Google Calendar scope so we can mirror family events
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events')

    const result = await signInWithPopup(auth, googleProvider)

    // Capture the Google OAuth access token for GCal API calls
    const credential = GoogleAuthProviderClass.credentialFromResult(result)
    if (credential?.accessToken) {
      setGoogleAccessToken(credential.accessToken)
    }
  }

  const signOut = async () => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      setUser(null)
      return
    }
    setGoogleAccessToken(null)
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, googleAccessToken, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/* ─── Hook ──────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider />')
  }
  return ctx
}
