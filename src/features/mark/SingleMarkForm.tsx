import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, X as XIcon } from 'lucide-react';
import { db } from '../../db/db';
import { addAttendanceRecord } from '../../db/queries';
import type { Subject } from '../../db/types';
import { todayISO } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export function SingleMarkForm({ lockedSubject, onDone }: { lockedSubject?: Subject; onDone?: () => void }) {
  const subjects = useLiveQuery(() => db.subjects.toArray());
  const [subjectId, setSubjectId] = useState<number | ''>(lockedSubject?.id ?? '');
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState<'present' | 'absent'>('present');
  const { showToast } = useToast();

  const subject = lockedSubject ?? subjects?.find((s) => s.id === subjectId);

  async function handleSubmit() {
    if (!subject || !date) return;
    await addAttendanceRecord(subject, status, date, 'manual');
    showToast(`Marked ${status} for ${subject.name} — ${date}`);
    onDone?.();
  }

  if (!lockedSubject && subjects && subjects.length === 0) {
    return <p className="text-sm text-ink-soft py-6 text-center">Add a subject first before marking attendance.</p>;
  }

  return (
    <div className="space-y-4">
      {!lockedSubject && (
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(Number(e.target.value))}
            className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink focus:outline-none focus:border-accent/50"
          >
            <option value="" disabled>
              Choose a subject
            </option>
            {subjects?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-xs text-ink-faint mb-1.5 block">Date (past, today, or future)</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink focus:outline-none focus:border-accent/50"
        />
      </div>
      <div>
        <label className="text-xs text-ink-faint mb-1.5 block">Status</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setStatus('present')}
            className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              status === 'present' ? 'bg-safe/15 border-safe/40 text-safe' : 'bg-surface-hover border-line text-ink-soft'
            }`}
          >
            <Check size={18} /> Present
          </button>
          <button
            onClick={() => setStatus('absent')}
            className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              status === 'absent' ? 'bg-below/15 border-below/40 text-below' : 'bg-surface-hover border-line text-ink-soft'
            }`}
          >
            <XIcon size={18} /> Absent
          </button>
        </div>
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={!subject || !date}>
        Save entry
      </Button>
    </div>
  );
}
