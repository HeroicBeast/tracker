import clsx from 'clsx';
import type { SubjectStatus } from '../../lib/attendanceMath';

const labels: Record<SubjectStatus, string> = {
  safe: 'Safe',
  borderline: 'Borderline',
  below: 'Below 80%',
  'no-data': 'No data yet',
};

const classes: Record<SubjectStatus, string> = {
  safe: 'bg-safe/15 text-safe',
  borderline: 'bg-borderline/15 text-borderline',
  below: 'bg-below/15 text-below',
  'no-data': 'bg-neutral/15 text-neutral',
};

export function StatusBadge({ status }: { status: SubjectStatus }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', classes[status])}>
      {labels[status]}
    </span>
  );
}
