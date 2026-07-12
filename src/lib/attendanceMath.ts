import type { Credits } from '../db/types';

export type SubjectStatus = 'safe' | 'borderline' | 'below' | 'no-data';

export interface AttendanceStats {
  totalClasses: number;
  present: number;
  absent: number;
  /** 0–100. */
  percentage: number;
  /** The fixed leave cap implied by the subject's credit value. */
  maxLeavesAllowed: number;
  /** maxLeavesAllowed − absent. Can go negative once you're already below 80%. */
  leavesRemaining: number;
  /** How many more classes you can miss in a row and stay ≥ 80%, assuming the total keeps growing. */
  safeToBunk: number;
  /** Only meaningful when below 80% — classes you'd need to attend in a row to get back to exactly 80%. */
  classesNeededToRecover: number;
  status: SubjectStatus;
}

const THRESHOLD = 80;
// 80–84.99% reads as "borderline" (yellow); the spec asked for "near 80%"
// without pinning an exact band, so this is the assumption in play.
const BORDERLINE_BAND = 5;

export function computeAttendanceStats(present: number, absent: number, credits: Credits): AttendanceStats {
  const totalClasses = present + absent;
  const fixedLeaveCap = Math.floor(targetClassesForCredits(credits) / 5);

  if (totalClasses === 0) {
    return {
      totalClasses: 0,
      present: 0,
      absent: 0,
      percentage: 0,
      maxLeavesAllowed: fixedLeaveCap,
      leavesRemaining: fixedLeaveCap,
      safeToBunk: 0,
      classesNeededToRecover: 0,
      status: 'no-data',
    };
  }

  const percentage = (present / totalClasses) * 100;
  const maxLeavesAllowed = fixedLeaveCap;
  const leavesRemaining = maxLeavesAllowed - absent;

  // Max N such that present / (totalClasses + N) >= 0.8, all N future classes missed.
  // present/(T+N) >= 0.8  =>  N <= 1.25*present - T  =>  N <= (5*present - 4*T) / 4
  const liveSafeToBunk = Math.max(0, Math.floor((5 * present - 4 * totalClasses) / 4));
  const safeToBunk = Math.max(0, Math.min(liveSafeToBunk, fixedLeaveCap - absent));

  // Min N such that (present + N) / (totalClasses + N) >= 0.8, all N future classes attended.
  // present+N >= 0.8*(T+N)  =>  N >= 4*totalClasses - 5*present
  const classesNeededToRecover =
    percentage >= THRESHOLD ? 0 : Math.max(0, 4 * totalClasses - 5 * present);

  let status: SubjectStatus;
  if (percentage < THRESHOLD) status = 'below';
  else if (percentage < THRESHOLD + BORDERLINE_BAND) status = 'borderline';
  else status = 'safe';

  return {
    totalClasses,
    present,
    absent,
    percentage,
    maxLeavesAllowed,
    leavesRemaining,
    safeToBunk,
    classesNeededToRecover,
    status,
  };
}

/** Reference baseline only — actual required totals are live-calculated, never hardcoded as limits. */
export function targetClassesForCredits(credits: 1 | 2 | 3 | 4): number {
  return { 1: 15, 2: 30, 3: 45, 4: 60 }[credits];
}

export const STATUS_COLOR: Record<SubjectStatus, string> = {
  safe: '#34d399',
  borderline: '#fbbf24',
  below: '#f87171',
  'no-data': '#5b6789',
};
