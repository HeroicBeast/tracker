import { useState } from 'react';
import type { AttendanceRecord, AttendanceStatus } from '../../db/types';
import { updateAttendanceRecord } from '../../db/queries';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

export function EditRecordModal({
  record,
  subjectName,
  onClose,
}: {
  record: AttendanceRecord;
  subjectName: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [hasDate, setHasDate] = useState(record.classDate !== null);
  const [date, setDate] = useState(record.classDate ?? '');
  const { showToast } = useToast();

  async function handleSave() {
    await updateAttendanceRecord(record, subjectName, { status, classDate: hasDate ? date : null });
    showToast('Entry updated');
    onClose();
  }

  return (
    <Modal
      title="Edit entry"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={hasDate && !date}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Status</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStatus('present')}
              className={`h-12 rounded-xl border text-sm font-medium transition-colors ${
                status === 'present' ? 'bg-safe/15 border-safe/40 text-safe' : 'bg-surface-hover border-line text-ink-soft'
              }`}
            >
              Present
            </button>
            <button
              onClick={() => setStatus('absent')}
              className={`h-12 rounded-xl border text-sm font-medium transition-colors ${
                status === 'absent' ? 'bg-below/15 border-below/40 text-below' : 'bg-surface-hover border-line text-ink-soft'
              }`}
            >
              Absent
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-ink-faint">Has a specific date</label>
          <button
            onClick={() => setHasDate((v) => !v)}
            aria-label="Toggle has a specific date"
            className={`h-7 w-12 rounded-full transition-colors relative ${hasDate ? 'bg-accent-solid' : 'bg-surface-hover border border-line'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                hasDate ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {hasDate && (
          <div>
            <label className="text-xs text-ink-faint mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink focus:outline-none focus:border-accent/50"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
