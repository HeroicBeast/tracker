import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import { db } from '../../db/db';
import { addTimetableSlot, updateTimetableSlot, deleteTimetableSlot, restoreTimetableSlot } from '../../db/queries';
import type { TimetableSlot } from '../../db/types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { DAY_NAMES_SHORT, DAY_VALUES_ORDERED_6 } from '../../lib/date';
import { useToast } from '../../context/ToastContext';

export type SlotDraft = TimetableSlot | { id?: undefined; dayOfWeek: number; startTime: string; subjectId?: number };

export function SlotModal({ slot, onClose }: { slot: SlotDraft; onClose: () => void }) {
  const subjects = useLiveQuery(() => db.subjects.toArray());
  const [subjectId, setSubjectId] = useState<number | ''>(slot.subjectId ?? '');
  const [dayOfWeek, setDayOfWeek] = useState(slot.dayOfWeek);
  const [startTime, setStartTime] = useState(slot.startTime || '09:00');
  const { showToast } = useToast();
  const isEditing = slot.id !== undefined;

  async function handleSave() {
    const subject = subjects?.find((s) => s.id === subjectId);
    if (!subject) return;
    if (isEditing) {
      await updateTimetableSlot(slot as TimetableSlot, subject, dayOfWeek, startTime);
      showToast('Timetable slot updated');
    } else {
      await addTimetableSlot(subject, dayOfWeek, startTime);
      showToast('Added to timetable');
    }
    onClose();
  }

  async function handleDelete() {
    if (!isEditing) return;
    const fullSlot = slot as TimetableSlot;
    const subject = subjects?.find((s) => s.id === fullSlot.subjectId);
    await deleteTimetableSlot(fullSlot, subject?.name ?? 'Subject');
    showToast('Removed from timetable', { label: 'Undo', onClick: () => restoreTimetableSlot(fullSlot) });
    onClose();
  }

  if (subjects && subjects.length === 0) {
    return (
      <Modal title="Add to timetable" onClose={onClose}>
        <p className="text-sm text-ink-soft py-4 text-center">Add a subject first before building your timetable.</p>
      </Modal>
    );
  }

  return (
    <Modal
      title={isEditing ? 'Edit timetable slot' : 'Add timetable slot'}
      onClose={onClose}
      footer={
        <>
          {isEditing && (
            <Button variant="danger" size="icon" onClick={handleDelete} aria-label="Delete slot">
              <Trash2 size={18} />
            </Button>
          )}
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={!subjectId}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
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
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Day</label>
          <div className="grid grid-cols-6 gap-1.5">
            {DAY_NAMES_SHORT.slice(1, 7).map((d, i) => {
              const dayValue = DAY_VALUES_ORDERED_6[i];
              return (
                <button
                  key={dayValue}
                  onClick={() => setDayOfWeek(dayValue)}
                  className={`h-11 rounded-lg text-xs font-medium border transition-colors ${
                    dayOfWeek === dayValue ? 'bg-accent-solid border-accent-solid text-white' : 'bg-surface-hover border-line text-ink-soft'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Start time (classes are 1 hour)</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>
    </Modal>
  );
}
