import { useState } from 'react';
import { BottomNav } from './components/layout/BottomNav';
import { ToastProvider } from './context/ToastContext';
import { TodayPage } from './features/today/TodayPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MarkPage } from './features/mark/MarkPage';
import { TimetablePage } from './features/timetable/TimetablePage';
import { MorePage } from './features/more/MorePage';
import { AuditLogPage } from './features/audit/AuditLogPage';
import { SubjectDetailPage } from './features/subject-detail/SubjectDetailPage';
import type { View } from './types';

const titles: Record<View, string> = {
  today: 'Today',
  dashboard: 'Dashboard',
  mark: 'Mark Attendance',
  timetable: 'Timetable',
  more: 'More',
  audit: 'Audit Log',
};

function AppShell() {
  const [view, setView] = useState<View>('today');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  function goTo(v: View) {
    setSelectedSubjectId(null);
    setView(v);
  }

  const inSubjectDetail = selectedSubjectId !== null;

  return (
    <div className="min-h-[100dvh] bg-base">
      {!inSubjectDetail && (
        <header
          className="sticky top-0 z-30 bg-base/90 backdrop-blur-sm border-b border-line px-5"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)', paddingBottom: '1rem' }}
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-lg font-semibold text-ink">{titles[view]}</h1>
          </div>
        </header>
      )}

      <main className="max-w-2xl mx-auto px-5 py-5 pb-28">
        {inSubjectDetail ? (
          <SubjectDetailPage subjectId={selectedSubjectId} onBack={() => setSelectedSubjectId(null)} />
        ) : (
          <>
            {view === 'today' && <TodayPage onNavigate={goTo} />}
            {view === 'dashboard' && <DashboardPage onSelectSubject={setSelectedSubjectId} />}
            {view === 'mark' && <MarkPage />}
            {view === 'timetable' && <TimetablePage />}
            {view === 'more' && <MorePage onNavigate={goTo} />}
            {view === 'audit' && <AuditLogPage />}
          </>
        )}
      </main>

      <BottomNav active={view} onChange={goTo} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

# wtf
