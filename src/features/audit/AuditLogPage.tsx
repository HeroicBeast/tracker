import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Trash2, History, Database, type LucideIcon } from 'lucide-react';
import { db } from '../../db/db';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatTimestamp } from '../../lib/date';
import type { AuditAction } from '../../db/types';

const actionIcon: Record<AuditAction, LucideIcon> = { add: Plus, edit: Pencil, delete: Trash2 };
const actionColor: Record<AuditAction, string> = {
  add: 'bg-safe/15 text-safe',
  edit: 'bg-borderline/15 text-borderline',
  delete: 'bg-below/15 text-below',
};

export function AuditLogPage() {
  const entries = useLiveQuery(() => db.auditLog.orderBy('timestamp').reverse().toArray());

  if (entries === undefined) return <Spinner />;

  if (entries.length === 0) {
    return <EmptyState icon={History} title="No activity yet" subtitle="Every addition, edit, and deletion shows up here automatically." />;
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const Icon = e.entity === 'backup' ? Database : actionIcon[e.action];
        return (
          <div key={e.id} className="flex gap-3 bg-surface border border-line rounded-xl px-4 py-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${actionColor[e.action]}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{e.summary}</p>
              {(e.oldValue || e.newValue) && (
                <p className="font-data text-xs text-ink-faint mt-0.5">
                  {e.oldValue}
                  {e.oldValue && e.newValue && ' → '}
                  {e.newValue}
                </p>
              )}
              <p className="font-data text-[11px] text-ink-faint mt-1">{formatTimestamp(e.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
