import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Category, Subscription } from '@/lib/database.types';
import { buildSubscriptionsCsv } from '@/lib/utils/buildCsv';

// Native — see exportCsv.web.ts for the browser counterpart.
export async function exportSubscriptionsCsv(subscriptions: Subscription[], categories: Category[]): Promise<void> {
  const csv = buildSubscriptionsCsv(subscriptions, categories);

  const file = new File(Paths.cache, 'abonelikler.csv');
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Abonelikleri Dışa Aktar' });
  }
}
