export type Credits = 1 | 2 | 3 | 4;

export interface Subject {
  id?: number;
  name: string;
  credits: Credits;
  createdAt: number;
}

export type AttendanceStatus = 'present' | 'absent';

// Where a record came from — purely informational, used to drive the
// "already marked today" shortcut on the Today tab and shown in the audit log.
export type AttendanceSource = 'today' | 'manual' | 'bulk-dated' | 'bulk-undated';

export interface AttendanceRecord {
  id?: number;
  subjectId: number;
  status: AttendanceStatus;
  /** ISO date 'YYYY-MM-DD', or null for an undated bulk entry (count only, no class date). */
  classDate: string | null;
  /** Epoch ms — when this record was created/added, independent of classDate. */
  addedAt: number;
  source: AttendanceSource;
}

export interface TimetableSlot {
  id?: number;
  subjectId: number;
  /** 0 = Sunday … 6 = Saturday, matches JS Date#getDay(). */
  dayOfWeek: number;
  /** 24-hour 'HH:MM'. All classes are fixed at 1 hour long. */
  startTime: string;
}

export type AuditAction = 'add' | 'edit' | 'delete';
export type AuditEntity = 'subject' | 'attendance' | 'timetable' | 'backup';

export interface AuditLogEntry {
  id?: number;
  /** Epoch ms — when the action was performed (not the class date). */
  timestamp: number;
  action: AuditAction;
  entity: AuditEntity;
  subjectName: string;
  summary: string;
  oldValue?: string;
  newValue?: string;
}
