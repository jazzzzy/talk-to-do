import type { ActiveView } from '@/components/BottomNav'

interface Props {
  view: ActiveView
}

const CONFIG: Record<ActiveView, { emoji: string; heading: string; sub: string }> = {
  tasks: {
    emoji: '✨',
    heading: "You're all caught up!",
    sub: 'Nothing due today. Enjoy the moment.',
  },
  overdue: {
    emoji: '🎉',
    heading: 'Zero overdue',
    sub: "Great discipline — nothing's fallen behind.",
  },
}

/** "Zen" empty-state card shown when a filtered task list is empty. */
export default function EmptyState({ view }: Props) {
  const { emoji, heading, sub } = CONFIG[view]

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-3xl mb-1">
        {emoji}
      </div>
      <h3 className="text-white/70 font-semibold text-base">{heading}</h3>
      <p className="text-white/35 text-sm max-w-[220px] leading-relaxed">{sub}</p>
    </div>
  )
}
