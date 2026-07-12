import { Plus } from 'lucide-react';
import type { Subject, TimetableSlot } from '../../db/types';
import { DAY_NAMES, formatTime12h } from '../../lib/date';

interface Props {
  slots: TimetableSlot[];
  subjects: Subject[];
  onSlotClick: (slot: TimetableSlot) => void;
  onAddForDay: (day: number) => void;
}

export function TimetableListView({ slots, subjects, onSlotClick, onAddForDay }: Props) {
  return (
    <div className="md:hidden space-y-4">
      {DAY_NAMES.map((day, i) => {
        const daySlots = slots.filter((s) => s.dayOfWeek === i).sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-ink-soft">{day}</h3>
              <button
                onClick={() => onAddForDay(i)}
                aria-label={`Add slot on ${day}`}
                className="h-10 w-10 flex items-center justify-center rounded-full text-ink-faint hover:bg-surface-hover hover:text-accent"
              >
                <Plus size={16} />
              </button>
            </div>
            {daySlots.length === 0 ? (
              <p className="text-xs text-ink-faint pl-1">No classes</p>
            ) : (
              <div className="space-y-2">
                {daySlots.map((slot) => {
                  const subject = subjects.find((s) => s.id === slot.subjectId);
                  if (!subject) return null;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => onSlotClick(slot)}
                      className="w-full flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3 text-left hover:border-accent/40 min-h-[52px]"
                    >
                      <span className="font-data text-xs font-medium text-ink-faint w-16 shrink-0">{formatTime12h(slot.startTime)}</span>
                      <span className="text-sm font-medium text-ink truncate">{subject.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
