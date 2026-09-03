import { addDays, addMonths, addWeeks, addYears } from 'date-fns';

import type { BillingCycle } from '@/lib/database.types';

export function calculateNextRenewalDate(
  startDate: Date,
  billingCycle: BillingCycle,
  customCycleDays?: number | null
): Date {
  switch (billingCycle) {
    case 'weekly':
      return addWeeks(startDate, 1);
    case 'monthly':
      return addMonths(startDate, 1);
    case 'yearly':
      return addYears(startDate, 1);
    case 'custom':
      return addDays(startDate, customCycleDays ?? 30);
  }
}
