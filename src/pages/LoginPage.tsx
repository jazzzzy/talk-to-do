import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

/* ─── Google "G" SVG Icon ───────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

/* ─── Decorative background orbs ────────────────────────────── */
function BackgroundOrbs() {
  return (
    <>
      <div
        className="gradient-orb w-96 h-96 bg-indigo-600/30 -top-20 -left-20"
        style={{ position: 'absolute', animationDelay: '0s' }}
      />
      <div
        className="gradient-orb w-80 h-80 bg-purple-600/25 bottom-10 -right-16"
        style={{ position: 'absolute', animationDelay: '3s' }}
      />
      <div
        className="gradient-orb w-64 h-64 bg-blue-600/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ position: 'absolute', animationDelay: '6s' }}
      />
    </>
  )
}

/* ─── Main Login Page ───────────────────────────────────────── */
export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      // Show a friendly error; don't expose raw Firebase error codes to users.
      setError('Sign-in was cancelled or failed. Please try again.')
      console.error('[LoginPage] Google sign-in error:', err)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="gradient-bg relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4">
      <BackgroundOrbs />

      {/* Glass card */}
      <div className="glass-card relative z-10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-6 animate-fade-in-up">

        {/* App icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-8 h-8"
            aria-hidden="true"
          >
            <path
              d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
              stroke="#a5b4fc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Heading */}
        <div className="text-center animate-fade-in-up-delay">
          <h1 className="text-gradient text-3xl font-bold tracking-tight mb-1">
            TaskFlow
          </h1>
          <p className="text-white/50 text-sm font-medium">
            Your tasks, beautifully organised
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/10" />

        {/* Feature bullets */}
        <ul className="w-full space-y-3 animate-fade-in-up-delay">
          {[
            { icon: '⚡', label: 'Real-time sync across devices' },
            { icon: '🔒', label: 'Secure Google Sign-In' },
            { icon: '✨', label: 'Beautiful, distraction-free UI' },
          ].map(({ icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-white/60 text-sm">
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="w-full text-center text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2"
          >
            {error}
          </div>
        )}

        {/* CTA Button */}
        <button
          id="google-sign-in-btn"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="glass-button animate-fade-in-up-delay-2 w-full flex items-center justify-center gap-3 rounded-2xl px-6 py-3.5 text-white font-semibold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Sign in with Google"
        >
          {isSigningIn ? (
            <>
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <p className="text-white/25 text-xs text-center animate-fade-in-up-delay-2">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  )
}
