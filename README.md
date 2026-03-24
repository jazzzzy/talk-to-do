# TaskFlow PWA

A high-performance, minimalist task management Progressive Web App built with React 19, TypeScript, Tailwind CSS v4, and Firebase.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (Vite) |
| Styling | Tailwind CSS v4 (Glassmorphism) |
| Auth | Firebase Authentication (Google) |
| Database | Firebase Firestore |
| State | React Context API |

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- A Firebase project with **Authentication** (Google provider) and **Firestore** enabled

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config values:

```bash
cp .env.example .env
```

Get the values from: **Firebase Console → Project Settings → Your Apps → Web App**

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 3. Install & Run

```bash
npm install
npm run dev        # Development server → http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build
```

## Project Structure

```
src/
├── firebase.ts              # Firebase app init (reads from .env)
├── context/
│   └── AuthContext.tsx      # AuthProvider + useAuth hook
├── pages/
│   ├── LoginPage.tsx        # Glassmorphism login UI
│   └── HomePage.tsx         # Authenticated user home (Phase 2 placeholder)
├── App.tsx                  # Auth-gated root component
├── main.tsx                 # App entry point
└── index.css                # Tailwind v4 + glassmorphism utilities
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** (start in test mode for development)
5. Register a **Web App** and copy the config keys into `.env`

## Implementation Phases

- **Phase 1 ✅** — Project scaffold, Tailwind v4, Firebase Auth, Google Sign-In
- **Phase 2** — Task CRUD (Firestore), task list UI, optimistic updates
- **Phase 3** — PWA manifest, offline support, push notifications
