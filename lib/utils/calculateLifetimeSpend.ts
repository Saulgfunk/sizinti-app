import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
} from 'date-fns';

import type { BillingCycle } from '@/lib/database.types';

// docs/03_Flowchart.md §5: "elapsed_periods * price". Elapsed periods here
// counts the payment made at start_date itself (+1), not just full cycles
// crossed since then — a subscription added as "started today" has already
// been paid for once, so it should read as spend already incurred, not ₺0.
export function calculateLifetimeSpend(
  startDate: Date,
  price: number,
  billingCycle: BillingCycle,
  customCycleDays: number | null,
  asOf: Date = new Date()
): number {
  let elapsedFullPeriods: number;
  switch (billingCycle) {
    case 'weekly':
      elapsedFullPeriods = differenceInCalendarWeeks(asOf, startDate);
      break;
    case 'monthly':
      elapsedFullPeriods = differenceInCalendarMonths(asOf, startDate);
      break;
    case 'yearly':
      elapsedFullPeriods = differenceInCalendarYears(asOf, startDate);
      break;
    case 'custom':
      elapsedFullPeriods = Math.floor(differenceInCalendarDays(asOf, startDate) / (customCycleDays ?? 30));
      break;
  }

  const periodsPaid = Math.max(elapsedFullPeriods, 0) + 1;
  return Math.round(periodsPaid * price * 100) / 100;
}
