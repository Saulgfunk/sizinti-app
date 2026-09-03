import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Currency, Subscription } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { normalizeToMonthly } from '@/lib/utils/normalizeToMonthly';

type Props = {
  subscriptions: Subscription[];
  baseCurrency: Currency;
};

// Flow C: lifetime total (the "emotional hook" number) + monthly/yearly
// toggle for current recurring spend. Both sums are scoped to the profile's
// base currency for now — cross-currency totals need the fx_rates table
// populated, which is Polish pass (docs/07_Project_Structure.md step 11),
// not this one.
export function LifetimeSpendHeader({ subscriptions, baseCurrency }: Props) {
  const [cadence, setCadence] = useState<'monthly' | 'yearly'>('monthly');

  const baseCurrencySubs = subscriptions.filter((s) => s.currency === baseCurrency);
  const otherCurrencyCount = subscriptions.length - baseCurrencySubs.length;

  // Lifetime total includes cancelled subscriptions — their spend is frozen,
  // not erased (docs/03_Flowchart.md §5).
  const lifetimeTotal = baseCurrencySubs.reduce((sum, s) => sum + s.lifetime_spent, 0);

  const recurringMonthly = baseCurrencySubs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + normalizeToMonthly(s.price, s.billing_cycle, s.custom_cycle_days), 0);
  const recurringTotal = cadence === 'monthly' ? recurringMonthly : recurringMonthly * 12;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Toplam harcama
      </ThemedText>
      <ThemedText type="title" style={styles.lifetimeNumber}>
        {formatCurrency(lifetimeTotal, baseCurrency)}
      </ThemedText>
      {otherCurrencyCount > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          + {otherCurrencyCount} farklı para biriminde abonelik (yakında dahil edilecek)
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
