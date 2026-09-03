import type { Category, Subscription } from '@/lib/database.types';
import { buildSubscriptionsCsv } from '@/lib/utils/buildCsv';

// Web counterpart to exportCsv.ts — expo-file-system/expo-sharing are
// native-only, so this triggers a plain browser download instead.
export async function exportSubscriptionsCsv(subscriptions: Subscription[], categories: Category[]): Promise<void> {
  const csv = buildSubscriptionsCsv(subscriptions, categories);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'abonelikler.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
