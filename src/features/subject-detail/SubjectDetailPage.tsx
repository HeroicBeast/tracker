import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { db } from '../../db/db';
import { deleteSubject } from '../../db/queries';
import { computeAttendanceStats, targetClassesForCredits, STATUS_COLOR } from '../../lib/attendanceMath';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Spinner } from '../../components/ui/Spinner';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Modal } from '../../components/ui/Modal';
import { AttendanceVisualization } from './AttendanceVisualization';
import { RecordList } from './RecordList';
import { MarkTabs } from '../mark/MarkTabs';
import { useToast } from '../../context/ToastContext';

export function SubjectDetailPage({ subjectId, onBack }: { subjectId: number; onBack: () => void }) {
  const subject = useLiveQuery(() => db.subjects.get(subjectId), [subjectId]);
  const records = useLiveQuery(() => db.attendance.where('subjectId').equals(subjectId).toArray(), [subjectId]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [markOpen, setMarkOpen] = useState(false);
  const { showToast } = useToast();

  if (subject === undefined || records === undefined) return <Spinner />;

  if (subject === null) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-soft mb-4">This subject no longer exists.</p>
        <Button onClick={onBack}>Go back</Button>
      </div>
    );
  }

  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.length - present;
  const stats = computeAttendanceStats(present, absent, subject.credits);

  const safeLine =
    stats.status === 'no-data'
      ? '—'
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
      : 'text-ink';

  async function handleDelete() {
    await deleteSubject(subject!);
    showToast(`Deleted "${subject!.name}"`);
    setConfirmDelete(false);
    onBack();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="Back"
          className="h-11 w-11 flex items-center justify-center rounded-full text-ink-soft hover:bg-surface-hover hover:text-ink -ml-2 shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-ink truncate">{subject.name}</h1>
          <p className="text-xs text-ink-soft">
            {subject.credits} credit{subject.credits > 1 ? 's' : ''} · ~{targetClassesForCredits(subject.credits)} classes/semester (reference)
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete subject"
          className="h-11 w-11 flex items-center justify-center rounded-full text-ink-faint hover:bg-below/15 hover:text-below shrink-0"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-5">
          <ProgressRing percentage={stats.percentage} size={84} strokeWidth={7} color={STATUS_COLOR[stats.status]}>
            <span className="font-data text-xl font-bold text-ink">{stats.status === 'no-data' ? '–' : Math.round(stats.percentage)}</span>
          </ProgressRing>
          <div>
            <p className="font-data text-sm text-ink-soft">
              {stats.present} present · {stats.absent} absent
            </p>
            <p className="font-data text-xs text-ink-faint mt-0.5">{stats.totalClasses} classes total</p>
            <div className="mt-2">
              <StatusBadge status={stats.status} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-line">
          <div>
            <p className="text-xs text-ink-faint mb-0.5">Leaves used / allowed</p>
            <p className="font-data text-sm font-medium text-ink">
              {stats.absent} / {stats.maxLeavesAllowed}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-faint mb-0.5">Safe to bunk</p>
            <p className={`font-data text-sm font-medium ${safeLineClass}`}>{safeLine}</p>
          </div>
        </div>
      </Card>

      <Button className="w-full" onClick={() => setMarkOpen(true)}>
        <Plus size={18} /> Mark attendance
      </Button>

      {records.length > 0 && <AttendanceVisualization records={records} />}

      <div>
        <h2 className="text-sm font-semibold text-ink-soft mb-3">All entries</h2>
        <RecordList records={records} subjectName={subject.name} />
      </div>

      {markOpen && (
        <Modal title={`Add attendance — ${subject.name}`} onClose={() => setMarkOpen(false)}>
          <MarkTabs lockedSubject={subject} onDone={() => setMarkOpen(false)} />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this subject?"
          description={`This permanently deletes "${subject.name}" and all ${records.length} attendance record(s) for it. This cannot be undone — the deletion is recorded in the audit log first.`}
          confirmLabel="Delete subject"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
