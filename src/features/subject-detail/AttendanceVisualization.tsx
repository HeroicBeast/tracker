import { lazy, Suspense, useMemo, useState } from 'react';
import type { AttendanceRecord } from '../../db/types';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Spinner } from '../../components/ui/Spinner';
import { formatDateIndian, toISODate } from '../../lib/date';

const TrendChart = lazy(() => import('./TrendChart'));

type DayStatus = 'present' | 'absent';
type HeatmapDay = { date: string; status: DayStatus | null };

const CELL_COLOR: Record<DayStatus, string> = {
  present: '#34d399',
  absent: '#f87171',
};
const EMPTY_CELL = '#1a2140';

function buildHeatmapWeeks(records: AttendanceRecord[]): HeatmapDay[][] {
  const dated = records.filter((r): r is AttendanceRecord & { classDate: string } => r.classDate !== null);
  if (dated.length === 0) return [];

  const byDate = new Map<string, Set<'present' | 'absent'>>();
  for (const r of dated) {
    if (!byDate.has(r.classDate)) byDate.set(r.classDate, new Set());
    byDate.get(r.classDate)!.add(r.status);
  }

  const dates = [...byDate.keys()].sort();
  const first = new Date(`${dates[0]}T00:00:00`);
  const today = new Date();
  const start = new Date(first);
  const day = start.getDay();
  const mondayDelta = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - mondayDelta);

  const days: HeatmapDay[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const iso = toISODate(cursor);
    const set = byDate.get(iso);
    let status: DayStatus | null = null;
    if (set) status = set.has('absent') ? 'absent' : 'present';
    days.push({ date: iso, status });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function buildTrendSeries(records: AttendanceRecord[]) {
  const sorted = [...records].sort((a, b) => {
    const ad = a.classDate ?? '9999-99-99';
    const bd = b.classDate ?? '9999-99-99';
    if (ad !== bd) return ad.localeCompare(bd);
    return a.addedAt - b.addedAt;
  });
  let present = 0;
  let total = 0;
  return sorted.map((r, i) => {
    total += 1;
    if (r.status === 'present') present += 1;
    return { index: i + 1, percentage: Math.round((present / total) * 1000) / 10 };
  });
}

export function AttendanceVisualization({ records }: { records: AttendanceRecord[] }) {
  const [mode, setMode] = useState<'heatmap' | 'trend'>('heatmap');
  const weeks = useMemo(() => buildHeatmapWeeks(records), [records]);
  const trend = useMemo(() => buildTrendSeries(records), [records]);

  return (
    <div className="space-y-3">
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: 'heatmap', label: 'Calendar' },
          { value: 'trend', label: 'Trend' },
        ]}
      />

      {mode === 'heatmap' ? (
        weeks.length === 0 ? (
          <p className="text-xs text-ink-faint py-4">No dated entries yet — undated bulk entries don't appear on the calendar.</p>
        ) : (
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1" style={{ minWidth: weeks.length * 14 }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${formatDateIndian(day.date)}${day.status ? ` — ${day.status}` : ''}`}
                      className="h-3 w-3 rounded-sm"
                      style={{ background: day.status ? CELL_COLOR[day.status] : EMPTY_CELL }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-ink-faint">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: CELL_COLOR.present }} /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm inline-block" style={{ background: CELL_COLOR.absent }} /> Absent
              </span>
            </div>
          </div>
        )
      ) : (
        <div className="h-48">
          <Suspense fallback={<Spinner />}>
            <TrendChart data={trend} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
