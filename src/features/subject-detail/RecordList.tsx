import { useState } from 'react';
import { Check, X as XIcon, Pencil, Trash2 } from 'lucide-react';
import type { AttendanceRecord } from '../../db/types';
import { deleteAttendanceRecord, restoreAttendanceRecord } from '../../db/queries';
import { formatDateIndian, formatTimestamp } from '../../lib/date';
import { useToast } from '../../context/ToastContext';
import { EditRecordModal } from './EditRecordModal';

export function RecordList({ records, subjectName }: { records: AttendanceRecord[]; subjectName: string }) {
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const { showToast } = useToast();

  const sorted = [...records].sort((a, b) => {
    const ad = a.classDate ?? '0000-00-00';
    const bd = b.classDate ?? '0000-00-00';
    if (ad !== bd) return bd.localeCompare(ad);
    return b.addedAt - a.addedAt;
  });

  async function handleDelete(record: AttendanceRecord) {
    await deleteAttendanceRecord(record, subjectName);
    showToast('Entry deleted', { label: 'Undo', onClick: () => restoreAttendanceRecord(record) });
  }

  if (sorted.length === 0) {
    return <p className="text-sm text-ink-faint text-center py-6">No entries yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map((r) => (
        <div key={r.id} className="flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3">
          <div
            className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
              r.status === 'present' ? 'bg-safe/15 text-safe' : 'bg-below/15 text-below'
            }`}
          >
            {r.status === 'present' ? <Check size={16} /> : <XIcon size={16} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink capitalize">{r.status}</p>
            <p className="font-data text-xs text-ink-faint">
              {r.classDate ? formatDateIndian(r.classDate) : `Undated · added ${formatTimestamp(r.addedAt)}`}
            </p>
          </div>
          <button
            onClick={() => setEditing(r)}
            aria-label="Edit entry"
            className="h-10 w-10 flex items-center justify-center rounded-full text-ink-faint hover:bg-surface-hover hover:text-accent shrink-0"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(r)}
            aria-label="Delete entry"
            className="h-10 w-10 flex items-center justify-center rounded-full text-ink-faint hover:bg-below/15 hover:text-below shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {editing && <EditRecordModal record={editing} subjectName={subjectName} onClose={() => setEditing(null)} />}
    </div>
  );
}
