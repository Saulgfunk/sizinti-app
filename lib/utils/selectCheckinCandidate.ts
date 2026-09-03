import type { Subscription } from '@/lib/database.types';

// docs/03_Flowchart.md §3: subscriptions where last_checkin_date is null OR
// older than the check-in interval are due. Screen 5 lists "check-in card"
// as a single conditional component, so this surfaces one at a time (most
// overdue first) rather than several at once — matches the PRD's own
// concern about nag fatigue.
export function selectCheckinCandidate(
  subscriptions: Subscription[],
  checkinIntervalDays: number
): Subscription | null {
  const now = Date.now();

  const due = subscriptions.filter((s) => {
    if (s.status !== 'active') return false;
    if (!s.last_checkin_date) return true;
    const daysSince = (now - new Date(s.last_checkin_date).getTime()) / 86_400_000;
    return daysSince >= checkinIntervalDays;
  });

  if (due.length === 0) return null;

  due.sort((a, b) => {
    if (!a.last_checkin_date) return -1;
    if (!b.last_checkin_date) return 1;
    return new Date(a.last_checkin_date).getTime() - new Date(b.last_checkin_date).getTime();
  });

  return due[0];
}
