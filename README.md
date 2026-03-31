# TaskFlow PWA 🌙

A high-performance, minimalist task management Progressive Web App built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Firebase**. 

Designed with a high-fidelity **Glassmorphism** aesthetic for a premium mobile-first experience.

## ✨ Key Features

- **Unified Task Engine:** Today and Upcoming tasks merged into one seamless flow with a visual date separator.
- **Glassmorphism UI:** Immersive, blur-heavy design with animated ambient orbs and spring-animated micro-interactions.
- **PWA Ready:** Installable on iOS/Android with offline caching for the UI shell and typography.
- **Real-Time Data:** Powered by Firestore `onSnapshot` for instant sync across devices.
- **Google Auth:** Secure, one-tap login.
- **CI/CD Built-in:** Automated builds and deployments to Firebase Hosting via GitHub Actions.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript (Vite) |
| **Styling** | Tailwind CSS v4 (Custom Glassmorphism Utilities) |
| **Auth** | Firebase Authentication (Google) |
| **Database** | Firebase Firestore |
| **PWA** | Vite-plugin-pwa + Workbox Strategy |
| **Deployment** | Firebase Hosting + GitHub Actions |

## 🚀 Getting Started

### 1. Prerequisites
- Node.js ≥ 18
- Firebase project with **Authentication** (Google) and **Firestore** enabled.

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase config values:
```bash
cp .env.example .env
```

### 3. Install & Run
```bash
npm install
npm run dev        # Development server → http://localhost:5173
npm run build      # Production-ready PWA bundle
npm run preview    # Local preview of the PWA build
```

## 🧪 Testing (Mock Auth)
To test the UI and PWA features without real Firebase authentication:
```bash
VITE_MOCK_AUTH=true npm run dev
```
This enables a "Logged In" state with a dummy user, bypassing the Google OAuth flow.

## ☁️ Deployment (GitHub Actions)

This project is configured to deploy automatically on every merge to `main`. 

### 1. GitHub Secrets
Add the following secrets to your GitHub repository under **Settings > Secrets and variables > Actions**:
- `FIREBASE_SERVICE_ACCOUNT_TASKFLOW_PWA`: Your [Firebase Service Account JSON](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk).
- `VITE_FIREBASE_API_KEY`: Your Firebase API key.
- ... and other `VITE_FIREBASE_` variables found in your `.env`.

### 2. Firestore Security Rules
Ensure strict access control by deploying [firestore.rules](./firestore.rules). These rules enforce:
- **Ownership:** Users can only access their own data.
- **Data Validation:** Correct types and required fields for all tasks.

### 3. Firebase Hosting Security
Enhanced via [firebase.json](./firebase.json) with custom headers:
- **Content Security Policy (CSP):** Trusted source enforcement.
- **HSTS / Frame Options:** Protection against Clickjacking and MITM attacks.

### 4. Security Audit (v1.0-sec)
The project has been hardened with zero dependency vulnerabilities (audited and patched via `npm overrides`) and full environment isolation.

## 📂 Project Structure
```
src/
├── context/
│   └── AuthContext.tsx      # Unified Auth + Mock Mode logic
├── hooks/
│   └── useTasks.ts          # Real-time Firestore task hook
├── components/
│   ├── AddTaskModal.tsx     # Bomb-proof mobile modal
│   ├── BottomNav.tsx        # 3-zone unified navigation
│   └── TaskCard.tsx         # High-fidelity task item
├── layout/
│   └── MainLayout.tsx       # Ambient background + Header logic
└── pages/
    ├── LoginPage.tsx        # Animated login entrance
    └── HomePage.tsx         # Unified tasks vs Overdue views
```

---
Built with ❤️ by Antigravity using **KISS** & **YAGNI** principles.
