import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { addBulkAttendance } from '../../db/queries';
import type { Subject, AttendanceStatus } from '../../db/types';
import { todayISO, toISODate, DAY_NAMES_SHORT } from '../../lib/date';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { useToast } from '../../context/ToastContext';

function datesInRange(start: string, end: string, weekdays: Set<number>): string[] {
  if (!start || !end) return [];
  const result: string[] = [];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (s > e) return result;
  const cur = new Date(s);
  while (cur <= e) {
    if (weekdays.has(cur.getDay())) result.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

export function BulkAddForm({ lockedSubject, onDone }: { lockedSubject?: Subject; onDone?: () => void }) {
  const subjects = useLiveQuery(() => db.subjects.toArray());
  const [subjectId, setSubjectId] = useState<number | ''>(lockedSubject?.id ?? '');
  const [rangeMode, setRangeMode] = useState<'dated' | 'undated'>('dated');
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [weekdays, setWeekdays] = useState<Set<number>>(() => new Set([new Date().getDay()]));
  const [datedStatus, setDatedStatus] = useState<AttendanceStatus>('present');

  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);

  const subject = lockedSubject ?? subjects?.find((s) => s.id === subjectId);
  const matchingDates = useMemo(() => datesInRange(startDate, endDate, weekdays), [startDate, endDate, weekdays]);

  function toggleWeekday(d: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  async function handleDatedSubmit() {
    if (!subject || matchingDates.length === 0) return;
    await addBulkAttendance(subject, matchingDates.map((d) => ({ status: datedStatus, classDate: d })), 'bulk-dated');
    showToast(`Added ${matchingDates.length} ${datedStatus} entries for ${subject.name}`);
    onDone?.();
  }

  async function handleUndatedSubmit() {
    if (!subject || (presentCount === 0 && absentCount === 0)) return;
    const entries = [
      ...Array.from({ length: presentCount }, () => ({ status: 'present' as const, classDate: null })),
      ...Array.from({ length: absentCount }, () => ({ status: 'absent' as const, classDate: null })),
    ];
    await addBulkAttendance(subject, entries, 'bulk-undated');
    showToast(`Added ${presentCount + absentCount} undated entries for ${subject.name}`);
    setPresentCount(0);
    setAbsentCount(0);
    onDone?.();
  }

  if (!lockedSubject && subjects && subjects.length === 0) {
    return <p className="text-sm text-ink-soft py-6 text-center">Add a subject first before bulk adding attendance.</p>;
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

      <SegmentedControl
        value={rangeMode}
        onChange={setRangeMode}
        options={[
          { value: 'dated', label: 'Dated range' },
          { value: 'undated', label: 'Undated count' },
        ]}
      />

      {rangeMode === 'dated' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-faint mb-1.5 block">Which weekdays count as class days</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_NAMES_SHORT.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleWeekday(i)}
                  className={`h-10 w-11 rounded-lg text-xs font-medium border transition-colors ${
                    weekdays.has(i) ? 'bg-accent-solid border-accent-solid text-white' : 'bg-surface-hover border-line text-ink-soft'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-faint mb-1.5 block">Mark all of these as</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDatedStatus('present')}
                className={`h-12 rounded-xl border text-sm font-medium transition-colors ${
                  datedStatus === 'present' ? 'bg-safe/15 border-safe/40 text-safe' : 'bg-surface-hover border-line text-ink-soft'
                }`}
              >
                Present
              </button>
              <button
                onClick={() => setDatedStatus('absent')}
                className={`h-12 rounded-xl border text-sm font-medium transition-colors ${
                  datedStatus === 'absent' ? 'bg-below/15 border-below/40 text-below' : 'bg-surface-hover border-line text-ink-soft'
                }`}
              >
                Absent
              </button>
            </div>
          </div>
          <p className="font-data text-xs text-ink-faint">
            {matchingDates.length} date{matchingDates.length === 1 ? '' : 's'} will be added.
          </p>
          <Button className="w-full" onClick={handleDatedSubmit} disabled={!subject || matchingDates.length === 0}>
            Add {matchingDates.length || ''} entries
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">Present count</label>
              <input
                type="number"
                min={0}
                value={presentCount}
                onChange={(e) => setPresentCount(Math.max(0, Number(e.target.value)))}
                className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink font-data focus:outline-none focus:border-accent/50"
              />
            </div>
            <div>
              <label className="text-xs text-ink-faint mb-1.5 block">Absent count</label>
              <input
                type="number"
                min={0}
                value={absentCount}
                onChange={(e) => setAbsentCount(Math.max(0, Number(e.target.value)))}
                className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink font-data focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
          <p className="text-xs text-ink-faint">These are added with no class date — only a record of when they were added.</p>
          <Button className="w-full" onClick={handleUndatedSubmit} disabled={!subject || (presentCount === 0 && absentCount === 0)}>
            Add entries
          </Button>
        </div>
      )}
    </div>
  );
}
