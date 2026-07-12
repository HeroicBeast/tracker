import Dexie, { type Table } from 'dexie';
import type { Subject, AttendanceRecord, TimetableSlot, AuditLogEntry } from './types';

export class AttendanceDB extends Dexie {
  subjects!: Table<Subject, number>;
  attendance!: Table<AttendanceRecord, number>;
  timetable!: Table<TimetableSlot, number>;
  auditLog!: Table<AuditLogEntry, number>;

  constructor() {
    super('CollegeAttendanceDB');
    this.version(1).stores({
      subjects: '++id, name',
      attendance: '++id, subjectId, classDate, addedAt',
      timetable: '++id, subjectId, dayOfWeek',
      auditLog: '++id, timestamp',
    });
  }
}

export const db = new AttendanceDB();
