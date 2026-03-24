import type { ReactNode } from 'react'
import type { User } from 'firebase/auth'
import BottomNav, { type ActiveView } from '@/components/BottomNav'

interface Props {
  children: ReactNode
  user: User | null
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onAddClick: () => void
  overdueCount: number
  onSignOut: () => void
}

/* ─── Greeting helpers ────────────────────────────────────── */

function getGreeting(name: string | null): string {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return name ? `${time}, ${name.split(' ')[0]}` : time
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

const VIEW_META: Record<ActiveView, { label: string; accent: string }> = {
  tasks:   { label: 'Tasks',   accent: 'text-indigo-400' },
  overdue: { label: 'Overdue', accent: 'text-rose-400'   },
}

/**
 * MainLayout — provides the unified header and scrollable area.
 */
export default function MainLayout({
  children,
  user,
  activeView,
  onViewChange,
  onAddClick,
  overdueCount,
  onSignOut,
}: Props) {
  const { label, accent } = VIEW_META[activeView]

  return (
    <div
      className="gradient-bg flex flex-col w-full"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* ── Ambient orbs ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="gradient-orb w-80 h-80 bg-indigo-600/25 -top-16 -right-16" style={{ position: 'absolute' }} />
        <div className="gradient-orb w-64 h-64 bg-purple-600/15 top-1/2 -left-20" style={{ position: 'absolute', animationDelay: '4s' }} />
        <div className="gradient-orb w-48 h-48 bg-blue-600/10 bottom-32 right-10" style={{ position: 'absolute', animationDelay: '7s' }} />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 flex-shrink-0 w-full max-w-lg mx-auto px-5 pt-10 pb-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'avatar'}
                className="w-9 h-9 rounded-full ring-2 ring-indigo-400/30 shadow-lg"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-white/70 text-sm font-bold">
                {user?.displayName?.[0] ?? '?'}
              </div>
            )}
            <span className="text-white/50 text-sm font-medium">
              {getGreeting(user?.displayName ?? null)}
            </span>
          </div>
          <button
            onClick={onSignOut}
            className="glass-button rounded-xl px-3 py-1.5 text-white/40 text-[11px] font-bold uppercase tracking-wider cursor-pointer hover:text-white/70"
          >
            Sign out
          </button>
        </div>

        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] pl-0.5">
          {getFormattedDate()}
        </p>
        <h1 className={`text-3xl font-black tracking-tighter ${accent}`}>
          {label}
        </h1>
      </header>

      {/* ── Content Area ── */}
      <main
        className="relative z-10 flex-1 w-full max-w-lg mx-auto px-4 py-2"
        style={{ overflowY: 'auto', overflowX: 'hidden' }}
      >
        {children}
      </main>

      {/* ── Unified Nav ── */}
      <BottomNav
        activeView={activeView}
        onViewChange={onViewChange}
        onAddClick={onAddClick}
        overdueCount={overdueCount}
      />
    </div>
  )
}
