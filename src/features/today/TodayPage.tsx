import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarOff, Check, X as XIcon, BookOpen } from 'lucide-react';
import { db } from '../../db/db';
import { addAttendanceRecord, updateAttendanceRecord } from '../../db/queries';
import { todayISO, formatDateLabel, formatTime12h } from '../../lib/date';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import type { Subject, TimetableSlot, AttendanceRecord } from '../../db/types';
import type { View } from '../../types';

export function TodayPage({ onNavigate }: { onNavigate: (v: View) => void }) {
  const dow = new Date().getDay();
  const iso = todayISO();
  const slots = useLiveQuery(() => db.timetable.where('dayOfWeek').equals(dow).toArray(), [dow]);
  const subjects = useLiveQuery(() => db.subjects.toArray());
  const todayRecords = useLiveQuery(() => db.attendance.where('classDate').equals(iso).toArray(), [iso]);
  const { showToast } = useToast();

  if (slots === undefined || subjects === undefined || todayRecords === undefined) {
    return <Spinner />;
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No subjects yet"
        subtitle="Add your first subject on the Dashboard tab to get started."
        action={
          <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium text-accent hover:underline">
            Go to Dashboard
          </button>
        }
      />
    );
  }

  const bySubject = new Map<number, TimetableSlot[]>();
  for (const s of slots) {
    if (!bySubject.has(s.subjectId)) bySubject.set(s.subjectId, []);
    bySubject.get(s.subjectId)!.push(s);
  }

  type CardData = { subject: Subject; slots: TimetableSlot[]; existing: AttendanceRecord | undefined };

  const cards: CardData[] = [...bySubject.entries()]
    .map(([subjectId, slotList]): CardData | null => {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) return null;
      const sorted = [...slotList].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const existing = todayRecords.find((r) => r.subjectId === subjectId && r.source === 'today');
      return { subject, slots: sorted, existing };
    })
    .filter((c): c is CardData => c !== null)
    .sort((a, b) => a.slots[0].startTime.localeCompare(b.slots[0].startTime));

  async function mark(subject: Subject, status: 'present' | 'absent', existing?: AttendanceRecord) {
    if (existing) {
      if (existing.status === status) return;
      await updateAttendanceRecord(existing, subject.name, { status });
    } else {
      await addAttendanceRecord(subject, status, iso, 'today');
    }
    showToast(`Marked ${status} for ${subject.name}`);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft -mt-1">{formatDateLabel(iso)}</p>

      {cards.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No classes today"
          subtitle="Nothing scheduled in your timetable for today. Use the Mark tab if you have an extra or off-day class to log."
        />
      ) : (
        <div className="space-y-3">
          {cards.map(({ subject, slots: slotList, existing }) => (
            <Card key={subject.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{subject.name}</p>
                <p className="font-data text-xs text-ink-soft">{slotList.map((s) => formatTime12h(s.startTime)).join(', ')}</p>
                {existing && (
                  <p className={`text-xs mt-0.5 font-medium ${existing.status === 'present' ? 'text-safe' : 'text-below'}`}>
                    Marked {existing.status} — tap the other button to change
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => mark(subject, 'present', existing)}
                  aria-label={`Mark ${subject.name} present`}
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-colors ${
                    existing?.status === 'present'
                      ? 'bg-safe/20 border-safe text-safe'
                      : 'bg-surface-hover border-line text-ink-soft hover:text-safe hover:border-safe/40'
                  }`}
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => mark(subject, 'absent', existing)}
                  aria-label={`Mark ${subject.name} absent`}
                  className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-colors ${
                    existing?.status === 'absent'
                      ? 'bg-below/20 border-below text-below'
                      : 'bg-surface-hover border-line text-ink-soft hover:text-below hover:border-below/40'
                  }`}
                >
                  <XIcon size={20} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
