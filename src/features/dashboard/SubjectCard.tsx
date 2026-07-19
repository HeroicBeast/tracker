import { ChevronRight } from 'lucide-react';
import type { Subject } from '../../db/types';
import { STATUS_COLOR, type AttendanceStats } from '../../lib/attendanceMath';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProgressRing } from '../../components/ui/ProgressRing';

export function SubjectCard({
  subject,
  stats,
  onClick,
}: {
  subject: Subject;
  stats: AttendanceStats;
  onClick: () => void;
}) {
  const safeLine =
    stats.status === 'no-data'
      ? 'No classes recorded yet'
      : stats.percentage < 80
      ? `Attend next ${stats.classesNeededToRecover} to recover`
      : stats.leavesRemaining <= 0
      ? '0 leaves left'
      : `Can miss ${stats.leavesRemaining} more`;

  const safeLineClass =
    stats.status === 'no-data'
      ? 'text-ink-faint'
      : stats.percentage >= 80 && stats.leavesRemaining <= 0
      ? 'text-below font-semibold'
      : 'text-ink-faint';

  return (
    <Card onClick={onClick} className="hover:border-accent/40 transition-colors">
      <div className="flex items-center gap-4">
        <ProgressRing percentage={stats.percentage} size={56} strokeWidth={5} color={STATUS_COLOR[stats.status]}>
          <span className="font-data text-xs font-semibold text-ink">
            {stats.status === 'no-data' ? '–' : Math.round(stats.percentage)}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink truncate">{subject.name}</p>
          <p className="text-xs text-ink-faint">
            {subject.credits} credit{subject.credits > 1 ? 's' : ''}
          </p>
          <p className="font-data text-xs text-ink-soft mt-1">
            {stats.present}/{stats.totalClasses} attended
          </p>
        </div>
        <ChevronRight size={18} className="text-ink-faint shrink-0" />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <StatusBadge status={stats.status} />
        <p className={`font-data text-xs ${safeLineClass}`}>{safeLine}</p>
      </div>
    </Card>
  );
}
