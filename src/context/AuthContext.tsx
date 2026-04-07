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

/* ─── Token persistence (sessionStorage) ────────────────────── */
//
// The Google OAuth access token is only returned from signInWithPopup().
// Firebase's onAuthStateChanged restores the user session but NOT the token.
// We persist the token + its expiry in sessionStorage so it survives page
// refreshes within the same browser tab session (typical PWA use case).
// Tokens expire after ~1 hour; we discard them 5 min early to be safe.

const TOKEN_KEY   = 'gcal_access_token'
const EXPIRY_KEY  = 'gcal_token_expiry'
const TOKEN_TTL_MS = 55 * 60 * 1000 // 55 minutes

function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + TOKEN_TTL_MS))
}

function loadToken(): string | null {
  const token  = sessionStorage.getItem(TOKEN_KEY)
  const expiry = Number(sessionStorage.getItem(EXPIRY_KEY) ?? 0)
  if (!token || Date.now() > expiry) {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(EXPIRY_KEY)
    return null
  }
  return token
}

function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRY_KEY)
}

/* ─── Types ─────────────────────────────────────────────────── */

interface AuthContextValue {
  user: User | null
  loading: boolean
  /** Google OAuth access token — available only when token is valid. */
  googleAccessToken: string | null
  /**
   * True when the user's Firebase session is restored but the GCal token
   * is missing or expired (e.g. after closing and reopening the app).
   * Show a "Reconnect Google Calendar" prompt in the UI when this is true.
   */
  needsGCalReconnect: boolean
  signInWithGoogle: () => Promise<void>
  /** Re-triggers signInWithPopup silently to refresh the GCal access token. */
  reconnectGCal: () => Promise<void>
  signOut: () => Promise<void>
}

/* ─── Context ───────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null)

/* ─── Provider ──────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                           = useState<User | null>(null)
  const [loading, setLoading]                     = useState(true)
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null)
  const [needsGCalReconnect, setNeedsGCalReconnect] = useState(false)

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

      if (firebaseUser) {
        // Try to restore the GCal token from the session
        const stored = loadToken()
        if (stored) {
          setGoogleAccessToken(stored)
          setNeedsGCalReconnect(false)
        } else {
          // Token missing or expired — user needs to reconnect GCal
          setGoogleAccessToken(null)
          setNeedsGCalReconnect(true)
        }
      } else {
        // Logged out — clear everything
        setGoogleAccessToken(null)
        setNeedsGCalReconnect(false)
        clearToken()
      }
    })
    return unsubscribe
  }, [])

  /** Full sign-in: used when not yet signed in at all. */
  const signInWithGoogle = async () => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      setUser(MOCK_USER as User)
      return
    }

    // Request Google Calendar scopes so we can read & write events
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events')
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly')

    const result = await signInWithPopup(auth, googleProvider)

    // Capture and persist the Google OAuth access token
    const credential = GoogleAuthProviderClass.credentialFromResult(result)
    if (credential?.accessToken) {
      saveToken(credential.accessToken)
      setGoogleAccessToken(credential.accessToken)
      setNeedsGCalReconnect(false)
    }
  }

  /**
   * Re-authenticate with Google to get a fresh access token.
   * Called when Firebase session is intact but GCal token has expired.
   * Google typically completes this immediately without user interaction
   * if the browser already has an active Google session.
   */
  const reconnectGCal = async () => {
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.events')
    googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly')
    const result = await signInWithPopup(auth, googleProvider)
    const credential = GoogleAuthProviderClass.credentialFromResult(result)
    if (credential?.accessToken) {
      saveToken(credential.accessToken)
      setGoogleAccessToken(credential.accessToken)
      setNeedsGCalReconnect(false)
    }
  }

  const signOut = async () => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      setUser(null)
      return
    }
    clearToken()
    setGoogleAccessToken(null)
    setNeedsGCalReconnect(false)
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, googleAccessToken, needsGCalReconnect, signInWithGoogle, reconnectGCal, signOut }}>
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
