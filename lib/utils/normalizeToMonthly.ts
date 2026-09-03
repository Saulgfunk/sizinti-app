import type { BillingCycle } from '@/lib/database.types';

const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365.25;

// Used by the Dashboard's monthly/yearly toggle and category chart to put
// subscriptions on different billing cycles on a common footing.
export function normalizeToMonthly(price: number, billingCycle: BillingCycle, customCycleDays: number | null): number {
  switch (billingCycle) {
    case 'weekly':
      return (price * DAYS_PER_YEAR) / 7 / 12;
    case 'monthly':
      return price;
    case 'yearly':
      return price / 12;
    case 'custom':
      return (price * DAYS_PER_MONTH) / (customCycleDays ?? 30);
  }
}

export function normalizeToYearly(price: number, billingCycle: BillingCycle, customCycleDays: number | null): number {
  return normalizeToMonthly(price, billingCycle, customCycleDays) * 12;
}
