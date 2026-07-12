import { Fragment } from 'react';
import type { Subject, TimetableSlot } from '../../db/types';
import { DAY_NAMES_SHORT, timeToMinutes, formatTime12h } from '../../lib/date';

interface Props {
  slots: TimetableSlot[];
  subjects: Subject[];
  startHour: number;
  endHour: number;
  onSlotClick: (slot: TimetableSlot) => void;
}

const PALETTE = [
  'bg-accent/20 border-accent/40 text-accent',
  'bg-safe/20 border-safe/40 text-safe',
  'bg-borderline/20 border-borderline/40 text-borderline',
  'bg-below/20 border-below/40 text-below',
  'bg-ink-faint/20 border-ink-faint/40 text-ink-soft',
];

export function TimetableGridView({ slots, subjects, startHour, endHour, onSlotClick }: Props) {
  const totalMinutes = (endHour - startHour) * 60;
  const hourMarks = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const subjectColor = (id: number) => PALETTE[Math.max(0, subjects.findIndex((s) => s.id === id)) % PALETTE.length];

  return (
    <div className="hidden md:block rounded-2xl border border-line overflow-hidden">
      <div className="grid grid-cols-[64px_repeat(7,1fr)]">
        <div className="bg-surface border-b border-line" />
        {DAY_NAMES_SHORT.map((d) => (
          <div key={d} className="bg-surface border-b border-l border-line py-2 text-center text-xs font-medium text-ink-soft">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[64px_repeat(7,1fr)]" style={{ height: totalMinutes }}>
        <div className="relative">
          {hourMarks.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-2 text-right text-[11px] text-ink-faint -translate-y-1/2"
              style={{ top: (h - startHour) * 60 }}
            >
              {formatTime12h(`${String(h).padStart(2, '0')}:00`)}
            </div>
          ))}
        </div>
        {Array.from({ length: 7 }, (_, day) => (
          <div key={day} className="relative border-l border-line">
            {hourMarks.map((h) => (
              <div key={h} className="absolute left-0 right-0 border-t border-line/60" style={{ top: (h - startHour) * 60 }} />
            ))}
            {slots
              .filter((s) => s.dayOfWeek === day)
              .map((slot) => {
                const subject = subjects.find((s) => s.id === slot.subjectId);
                if (!subject) return null;
                const top = timeToMinutes(slot.startTime) - startHour * 60;
                return (
                  <Fragment key={slot.id}>
                    <button
                      onClick={() => onSlotClick(slot)}
                      className={`absolute left-1 right-1 rounded-lg border px-2 py-1 text-left text-xs font-medium overflow-hidden ${subjectColor(
                        subject.id!
                      )}`}
                      style={{ top, height: 60 }}
                    >
                      <p className="truncate">{subject.name}</p>
                      <p className="font-data text-[10px] opacity-70">{formatTime12h(slot.startTime)}</p>
                    </button>
                  </Fragment>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
