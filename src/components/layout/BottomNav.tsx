import { Calendar, LayoutDashboard, PlusCircle, CalendarClock, MoreHorizontal, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import type { View } from '../../types';

const items: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'today', label: 'Today', icon: Calendar },
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'mark', label: 'Mark', icon: PlusCircle },
  { view: 'timetable', label: 'Timetable', icon: CalendarClock },
  { view: 'more', label: 'More', icon: MoreHorizontal },
];

export function BottomNav({ active, onChange }: { active: View; onChange: (v: View) => void }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {items.map(({ view, label, icon: Icon }) => {
          const isActive = active === view || (view === 'more' && active === 'audit');
          return (
            <button
              key={view}
              onClick={() => onChange(view)}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-colors',
                isActive ? 'text-accent' : 'text-ink-faint'
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
