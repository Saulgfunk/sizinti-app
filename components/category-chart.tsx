import { Pressable, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { CATEGORIES, type CategoryValue } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import type { Currency, FxRate, Subscription } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { fxConvert } from '@/lib/utils/fxConvert';
import { normalizeToMonthly } from '@/lib/utils/normalizeToMonthly';

type Props = {
  subscriptions: Subscription[];
  baseCurrency: Currency;
  rates: FxRate[];
  selectedCategory: CategoryValue | null;
  onSelectCategory: (category: CategoryValue | null) => void;
};

// Flow C: "Category chart: tap to filter list by category." Converts each
// subscription to base currency via fxConvert — one without an available
// rate just doesn't contribute to its category's slice yet (see
// lib/utils/fxConvert.ts for why that's expected today).
export function CategoryChart({ subscriptions, baseCurrency, rates, selectedCategory, onSelectCategory }: Props) {
  const totalsByCategory = CATEGORIES.map((cat) => {
    const total = subscriptions
      .filter((s) => s.status === 'active' && s.category === cat.value)
      .reduce((sum, s) => {
        const priceInBase = s.currency === baseCurrency ? s.price : fxConvert(s.price, s.currency, baseCurrency, rates);
        if (priceInBase === null) return sum;
        return sum + normalizeToMonthly(priceInBase, s.billing_cycle, s.custom_cycle_days);
      }, 0);
    return { ...cat, total };
  }).filter((c) => c.total > 0);

  if (totalsByCategory.length === 0) return null;

  const pieData = totalsByCategory.map((c) => ({
    value: c.total,
    color: c.color,
    focused: selectedCategory === c.value,
  }));

  return (
    <View style={styles.chartRow}>
      <PieChart data={pieData} radius={70} donut innerRadius={40} />
      <View style={styles.legend}>
        {totalsByCategory.map((c) => (
          <Pressable
            key={c.value}
            style={styles.legendItem}
            onPress={() => onSelectCategory(selectedCategory === c.value ? null : c.value)}>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <ThemedText type="small" style={selectedCategory === c.value ? styles.legendActive : undefined}>
              {c.label} · {formatCurrency(c.total, baseCurrency)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  legend: { flex: 1, gap: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendActive: { fontWeight: '700' },
});
