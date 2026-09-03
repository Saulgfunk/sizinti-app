import { differenceInCalendarDays } from 'date-fns';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Subscription } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils/formatCurrency';

type Props = {
  subscription: Subscription;
};

// Flow C (docs/02_User_Flow.md): "name, price, days-until-renewal,
// lifetime-spent-on-this-one".
export function SubscriptionCard({ subscription }: Props) {
  const daysUntilRenewal = differenceInCalendarDays(new Date(subscription.next_renewal_date), new Date());

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: subscription.id } })}>
      <View style={styles.row}>
        <ThemedText type="smallBold">{subscription.name}</ThemedText>
        <ThemedText type="smallBold">{formatCurrency(subscription.price, subscription.currency)}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          {daysUntilRenewal >= 0 ? `${daysUntilRenewal} gün sonra yenilenir` : 'Yenileme tarihi geçti'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Toplam: {formatCurrency(subscription.lifetime_spent, subscription.currency)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
