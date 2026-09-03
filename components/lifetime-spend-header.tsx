import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Currency, FxRate, Subscription } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { fxConvert } from '@/lib/utils/fxConvert';
import { normalizeToMonthly } from '@/lib/utils/normalizeToMonthly';

type Props = {
  subscriptions: Subscription[];
  baseCurrency: Currency;
  rates: FxRate[];
};

// Flow C: lifetime total (the "emotional hook" number) + monthly/yearly
// toggle for current recurring spend. Converts everything to base currency
// via fxConvert — a subscription only gets excluded from the totals if no
// rate is available for its pair yet (expected today: fetch-fx-rates isn't
// deployed, so fx_rates is empty; every subscription will fall into that
// bucket until it is).
export function LifetimeSpendHeader({ subscriptions, baseCurrency, rates }: Props) {
  const [cadence, setCadence] = useState<'monthly' | 'yearly'>('monthly');

  const convertedSubs = subscriptions
    .map((s) => ({
      sub: s,
      lifetime: s.currency === baseCurrency ? s.lifetime_spent : fxConvert(s.lifetime_spent, s.currency, baseCurrency, rates),
      price: s.currency === baseCurrency ? s.price : fxConvert(s.price, s.currency, baseCurrency, rates),
    }))
    .filter((c) => c.lifetime !== null);

  const unconvertedCount = subscriptions.length - convertedSubs.length;

  // Lifetime total includes cancelled subscriptions — their spend is frozen,
  // not erased (docs/03_Flowchart.md §5).
  const lifetimeTotal = convertedSubs.reduce((sum, c) => sum + (c.lifetime ?? 0), 0);

  const recurringMonthly = convertedSubs
    .filter((c) => c.sub.status === 'active' && c.price !== null)
    .reduce((sum, c) => sum + normalizeToMonthly(c.price!, c.sub.billing_cycle, c.sub.custom_cycle_days), 0);
  const recurringTotal = cadence === 'monthly' ? recurringMonthly : recurringMonthly * 12;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Toplam harcama
      </ThemedText>
      <ThemedText type="title" style={styles.lifetimeNumber}>
        {formatCurrency(lifetimeTotal, baseCurrency)}
      </ThemedText>
      {unconvertedCount > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          + {unconvertedCount} abonelik için kur bilgisi henüz yok
        </ThemedText>
      )}

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleChip, cadence === 'monthly' && styles.toggleChipActive]}
          onPress={() => setCadence('monthly')}>
          <ThemedText style={[styles.toggleText, cadence === 'monthly' && styles.toggleTextActive]}>Aylık</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.toggleChip, cadence === 'yearly' && styles.toggleChipActive]}
          onPress={() => setCadence('yearly')}>
          <ThemedText style={[styles.toggleText, cadence === 'yearly' && styles.toggleTextActive]}>Yıllık</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="subtitle">{formatCurrency(recurringTotal, baseCurrency)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.four },
  lifetimeNumber: { textAlign: 'center' },
  toggleRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  toggleChip: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  toggleChipActive: { backgroundColor: '#3c87f7', borderColor: '#3c87f7' },
  toggleText: { fontSize: 14, fontWeight: '500' },
  toggleTextActive: { color: '#ffffff' },
});
