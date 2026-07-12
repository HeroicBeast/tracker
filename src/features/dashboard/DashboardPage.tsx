import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { db } from '../../db/db';
import { computeAttendanceStats } from '../../lib/attendanceMath';
import { SubjectCard } from './SubjectCard';
import { AddSubjectModal } from './AddSubjectModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';

export function DashboardPage({ onSelectSubject }: { onSelectSubject: (id: number) => void }) {
  const subjects = useLiveQuery(() => db.subjects.toArray());
  const records = useLiveQuery(() => db.attendance.toArray());
  const [addOpen, setAddOpen] = useState(false);

  if (subjects === undefined || records === undefined) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={18} /> Add subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          subtitle="Add your first subject to get started tracking attendance."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={18} /> Add subject
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subjects.map((s) => {
            const subjectRecords = records.filter((r) => r.subjectId === s.id);
            const present = subjectRecords.filter((r) => r.status === 'present').length;
            const absent = subjectRecords.length - present;
            const stats = computeAttendanceStats(present, absent);
            return <SubjectCard key={s.id} subject={s} stats={stats} onClick={() => onSelectSubject(s.id!)} />;
          })}
        </div>
      )}

      {addOpen && <AddSubjectModal onClose={() => setAddOpen(false)} />}
    </div>
  );
}
