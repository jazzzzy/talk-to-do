import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

/**
 * Firebase configuration sourced from Vite environment variables.
 * All keys must be prefixed with VITE_ to be exposed to the client bundle.
 * See .env.example for the full list of required variables.
 */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
}

// Validate that all required env vars are present before initializing Firebase.
// This surfaces a clear developer error instead of a cryptic Firebase crash.
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => `VITE_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`)

if (missingKeys.length > 0) {
  throw new Error(
    `[firebase.ts] Missing environment variables:\n${missingKeys.join('\n')}\n\n` +
    'Copy .env.example → .env and fill in your Firebase project values, then restart the dev server.'
  )
}

const app = initializeApp(firebaseConfig)

export const auth           = getAuth(app)
export const db             = getFirestore(app)
export const functions      = getFunctions(app)
export const googleProvider = new GoogleAuthProvider()
