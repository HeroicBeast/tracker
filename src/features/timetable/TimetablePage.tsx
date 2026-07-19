import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, CalendarClock } from 'lucide-react';
import { db } from '../../db/db';
import { TimetableGridView } from './TimetableGridView';
import { TimetableListView } from './TimetableListView';
import { SlotModal, type SlotDraft } from './SlotModal';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { TimetableSlot } from '../../db/types';
import { timeToMinutes, DAY_VALUES_ORDERED_6 } from '../../lib/date';

function computeRange(slots: TimetableSlot[]) {
  if (slots.length === 0) return { startHour: 8, endHour: 18 };
  const starts = slots.map((s) => timeToMinutes(s.startTime));
  const minStart = Math.min(...starts);
  const maxEnd = Math.max(...starts) + 60; // classes are fixed at 1 hour
  return {
    startHour: Math.max(0, Math.floor(minStart / 60) - 1),
    endHour: Math.min(24, Math.ceil(maxEnd / 60) + 1),
  };
}

export function TimetablePage() {
  const slots = useLiveQuery(() => db.timetable.toArray());
  const subjects = useLiveQuery(() => db.subjects.toArray());
  const [modalSlot, setModalSlot] = useState<SlotDraft | null>(null);

  if (slots === undefined || subjects === undefined) return <Spinner />;

  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Add a subject first"
        subtitle="You'll need at least one subject before building your timetable."
      />
    );
  }

  const { startHour, endHour } = computeRange(slots);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            const today = new Date().getDay();
            const defaultDay = DAY_VALUES_ORDERED_6.includes(today as (typeof DAY_VALUES_ORDERED_6)[number]) ? today : 1;
            setModalSlot({ dayOfWeek: defaultDay, startTime: '09:00' });
          }}
        >
          <Plus size={18} /> Add slot
        </Button>
      </div>

      {slots.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Your timetable is empty"
          subtitle="Add your weekly class slots to see them here and get quick-mark shortcuts on the Today tab."
        />
      ) : (
        <>
          <TimetableGridView slots={slots} subjects={subjects} startHour={startHour} endHour={endHour} onSlotClick={setModalSlot} />
          <TimetableListView
            slots={slots}
            subjects={subjects}
            onSlotClick={setModalSlot}
            onAddForDay={(day) => setModalSlot({ dayOfWeek: day, startTime: '09:00' })}
          />
        </>
      )}

      {modalSlot && <SlotModal slot={modalSlot} onClose={() => setModalSlot(null)} />}
    </div>
  );
}
