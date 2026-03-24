export type ActiveView = 'tasks' | 'overdue'

interface Props {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onAddClick: () => void
  overdueCount: number
}

/**
 * BottomNav — 3-zone navigation for the unified view.
 * Zones: Tasks (Today+Upcoming) | FAB (+) | Overdue
 */
export default function BottomNav({
  activeView,
  onViewChange,
  onAddClick,
  overdueCount,
}: Props) {
  return (
    <nav
      aria-label="Primary navigation"
      className="pb-safe w-full flex-shrink-0"
      style={{
        background: 'rgba(10, 8, 30, 0.8)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-6 h-16">

        {/* ── All Tasks ────────────────────────────────────── */}
        <NavButton
          id="nav-tasks-btn"
          label="Tasks"
          active={activeView === 'tasks'}
          activeColor="text-indigo-400"
          activeBg="bg-indigo-500/15"
          badge={0}
          badgeColor=""
          onClick={() => onViewChange('tasks')}
          aria-label="View all tasks"
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
        />

        {/* ── FAB (+) ───────────────────────────────────────── */}
        <button
          id="add-task-fab"
          onClick={onAddClick}
          className="relative flex items-center justify-center w-14 h-14 -mt-6 rounded-2xl cursor-pointer shadow-xl shadow-indigo-500/40 transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}
          aria-label="Add new task"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* ── Overdue ──────────────────────────────────────── */}
        <NavButton
          id="nav-overdue-btn"
          label="Overdue"
          active={activeView === 'overdue'}
          activeColor="text-rose-400"
          activeBg="bg-rose-500/15"
          badge={overdueCount}
          badgeColor={activeView === 'overdue' ? 'bg-rose-400' : 'bg-rose-500'}
          badgePulse={activeView !== 'overdue'}
          onClick={() => onViewChange('overdue')}
          aria-label="View overdue tasks"
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          }
        />

      </div>
    </nav>
  )
}

/* ─── NavButton sub-component ─────────────────────────────── */

interface NavButtonProps {
  id: string
  label: string
  active: boolean
  activeColor: string
  activeBg: string
  badge: number
  badgeColor: string
  badgePulse?: boolean
  onClick: () => void
  icon: React.ReactNode
  'aria-label': string
}

function NavButton({
  id, label, active, activeColor, activeBg,
  badge, badgeColor, badgePulse = false,
  onClick, icon,
  'aria-label': ariaLabel,
}: NavButtonProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      className="flex flex-col items-center gap-1 min-w-[64px] cursor-pointer group"
      aria-label={ariaLabel}
    >
      <div className={`relative flex items-center justify-center w-12 h-9 rounded-xl transition-all duration-200 ${active ? activeBg : 'group-hover:bg-white/5'}`}>
        <span className={`transition-colors duration-200 ${active ? activeColor : 'text-white/35 group-hover:text-white/60'}`}>
          {icon}
        </span>
        {badge > 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center border border-[#0f0c29] ${badgeColor} ${badgePulse ? 'animate-pulse' : ''}`}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-bold tracking-tight transition-colors duration-200 ${active ? activeColor : 'text-white/25'}`}>
        {label}
      </span>
    </button>
  )
}
