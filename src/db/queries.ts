import { db } from './db';
import type {
  Subject,
  AttendanceRecord,
  TimetableSlot,
  AuditLogEntry,
  AuditAction,
  AuditEntity,
  Credits,
  AttendanceStatus,
} from './types';
import { DAY_NAMES, formatTime12h } from '../lib/date';

async function logAudit(
  action: AuditAction,
  entity: AuditEntity,
  subjectName: string,
  summary: string,
  oldValue?: string,
  newValue?: string
) {
  await db.auditLog.add({ timestamp: Date.now(), action, entity, subjectName, summary, oldValue, newValue });
}

// ---------------------------------------------------------------------------
// Subjects
// ---------------------------------------------------------------------------

export async function addSubject(name: string, credits: Credits) {
  const trimmed = name.trim();
  const id = await db.subjects.add({ name: trimmed, credits, createdAt: Date.now() });
  await logAudit(
    'add',
    'subject',
    trimmed,
    `Added subject "${trimmed}" (${credits} credit${credits > 1 ? 's' : ''})`
  );
  return id;
}

export async function deleteSubject(subject: Subject) {
  const [recordCount, slotCount] = await Promise.all([
    db.attendance.where('subjectId').equals(subject.id!).count(),
    db.timetable.where('subjectId').equals(subject.id!).count(),
  ]);

  // Logged before the delete transaction runs, per spec — the audit trail
  // survives even though the subject and its records do not.
  await logAudit(
    'delete',
    'subject',
    subject.name,
    `Deleted subject "${subject.name}" along with ${recordCount} attendance record(s) and ${slotCount} timetable slot(s)`
  );

  await db.transaction('rw', db.subjects, db.attendance, db.timetable, async () => {
    await db.attendance.where('subjectId').equals(subject.id!).delete();
    await db.timetable.where('subjectId').equals(subject.id!).delete();
    await db.subjects.delete(subject.id!);
  });
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function addAttendanceRecord(
  subject: Subject,
  status: AttendanceStatus,
  classDate: string | null,
  source: AttendanceRecord['source']
) {
  await db.attendance.add({ subjectId: subject.id!, status, classDate, addedAt: Date.now(), source });
  const dateLabel = classDate ?? 'undated entry';
  await logAudit('add', 'attendance', subject.name, `Marked ${status} for "${subject.name}" — ${dateLabel}`);
}

export async function addBulkAttendance(
  subject: Subject,
  entries: { status: AttendanceStatus; classDate: string | null }[],
  source: AttendanceRecord['source']
) {
  if (entries.length === 0) return;
  const now = Date.now();
  await db.attendance.bulkAdd(
    entries.map((e) => ({ subjectId: subject.id!, status: e.status, classDate: e.classDate, addedAt: now, source }))
  );
  const presentCount = entries.filter((e) => e.status === 'present').length;
  const absentCount = entries.length - presentCount;
  await logAudit(
    'add',
    'attendance',
    subject.name,
    `Bulk added ${entries.length} record(s) for "${subject.name}" (${presentCount} present, ${absentCount} absent)`
  );
}

function describeRecord(record: Pick<AttendanceRecord, 'status' | 'classDate'>): string {
  return `${record.status}${record.classDate ? ` on ${record.classDate}` : ' (undated)'}`;
}

export async function updateAttendanceRecord(
  record: AttendanceRecord,
  subjectName: string,
  changes: Partial<Pick<AttendanceRecord, 'status' | 'classDate'>>
) {
  const oldValue = describeRecord(record);
  const updated = { ...record, ...changes };
  const newValue = describeRecord(updated);
  await db.attendance.update(record.id!, changes);
  if (oldValue !== newValue) {
    await logAudit('edit', 'attendance', subjectName, `Edited an attendance entry for "${subjectName}"`, oldValue, newValue);
  }
}

export async function deleteAttendanceRecord(record: AttendanceRecord, subjectName: string) {
  const oldValue = describeRecord(record);
  await db.attendance.delete(record.id!);
  await logAudit('delete', 'attendance', subjectName, `Deleted an attendance entry for "${subjectName}"`, oldValue);
}

/** Re-insert a deleted record (used by the "Undo" action on delete toasts). Does not re-log audit history. */
export async function restoreAttendanceRecord(record: AttendanceRecord) {
  const { id: _id, ...rest } = record;
  await db.attendance.add(rest);
}

// ---------------------------------------------------------------------------
// Timetable
// ---------------------------------------------------------------------------

export async function addTimetableSlot(subject: Subject, dayOfWeek: number, startTime: string) {
  await db.timetable.add({ subjectId: subject.id!, dayOfWeek, startTime });
  await logAudit(
    'add',
    'timetable',
    subject.name,
    `Added "${subject.name}" to the timetable — ${DAY_NAMES[dayOfWeek]} at ${formatTime12h(startTime)}`
  );
}

export async function updateTimetableSlot(slot: TimetableSlot, subject: Subject, dayOfWeek: number, startTime: string) {
  await db.timetable.update(slot.id!, { subjectId: subject.id!, dayOfWeek, startTime });
  await logAudit(
    'edit',
    'timetable',
    subject.name,
    `Updated a timetable slot for "${subject.name}" — now ${DAY_NAMES[dayOfWeek]} at ${formatTime12h(startTime)}`
  );
}

export async function deleteTimetableSlot(slot: TimetableSlot, subjectName: string) {
  await db.timetable.delete(slot.id!);
  await logAudit(
    'delete',
    'timetable',
    subjectName,
    `Removed "${subjectName}" from the timetable — ${DAY_NAMES[slot.dayOfWeek]} at ${formatTime12h(slot.startTime)}`
  );
}

export async function restoreTimetableSlot(slot: TimetableSlot) {
  const { id: _id, ...rest } = slot;
  await db.timetable.add(rest);
}

// ---------------------------------------------------------------------------
// Backup (export/import) — see README for why this exists
// ---------------------------------------------------------------------------

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  subjects: Subject[];
  attendance: AttendanceRecord[];
  timetable: TimetableSlot[];
  auditLog: AuditLogEntry[];
}

export async function exportAllData(): Promise<BackupPayload> {
  const [subjects, attendance, timetable, auditLog] = await Promise.all([
    db.subjects.toArray(),
    db.attendance.toArray(),
    db.timetable.toArray(),
    db.auditLog.toArray(),
  ]);
  return { version: 1, exportedAt: new Date().toISOString(), subjects, attendance, timetable, auditLog };
}

export async function importAllData(payload: BackupPayload) {
  await db.transaction('rw', db.subjects, db.attendance, db.timetable, db.auditLog, async () => {
    await Promise.all([db.subjects.clear(), db.attendance.clear(), db.timetable.clear(), db.auditLog.clear()]);
    await db.subjects.bulkAdd(payload.subjects);
    await db.attendance.bulkAdd(payload.attendance);
    await db.timetable.bulkAdd(payload.timetable);
    await db.auditLog.bulkAdd(payload.auditLog);
  });
  await logAudit('add', 'backup', 'All data', `Restored all data from a backup file (exported ${payload.exportedAt})`);
}
