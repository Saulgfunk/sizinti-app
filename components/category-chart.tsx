import { Pressable, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { ThemedText } from '@/components/themed-text';
import { CATEGORIES, type CategoryValue } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import type { Currency, Subscription } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { normalizeToMonthly } from '@/lib/utils/normalizeToMonthly';

type Props = {
  subscriptions: Subscription[];
  baseCurrency: Currency;
  selectedCategory: CategoryValue | null;
  onSelectCategory: (category: CategoryValue | null) => void;
};

// Flow C: "Category chart: tap to filter list by category." Only counts
// active subscriptions in the profile's base currency — cross-currency
// aggregation is deferred to Polish pass (docs/07_Project_Structure.md step
// 11, "FX display formatting"), same as LifetimeSpendHeader.
export function CategoryChart({ subscriptions, baseCurrency, selectedCategory, onSelectCategory }: Props) {
  const totalsByCategory = CATEGORIES.map((cat) => {
    const total = subscriptions
      .filter((s) => s.status === 'active' && s.currency === baseCurrency && s.category === cat.value)
      .reduce((sum, s) => sum + normalizeToMonthly(s.price, s.billing_cycle, s.custom_cycle_days), 0);
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
