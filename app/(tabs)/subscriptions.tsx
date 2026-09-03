import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubscriptionCard } from '@/components/subscription-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import type { Currency } from '@/lib/database.types';
import { useFxRates } from '@/lib/queries/useFxRates';
import { useProfile } from '@/lib/queries/useProfile';
import { useSubscriptions } from '@/lib/queries/useSubscriptions';

const VALID_CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'GBP'];

// Screen 6 (docs/04_Screens_and_Features.md): "same card list as Dashboard,
// list-first view." Sort/filter controls aren't built yet — this is the
// same query the Dashboard uses (already sorted by next_renewal_date).
export default function Subscriptions() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { data: subscriptions, isLoading, isError } = useSubscriptions(session?.user.id);
  const { data: rates } = useFxRates();

  const baseCurrency: Currency =
    profile?.base_currency && (VALID_CURRENCIES as string[]).includes(profile.base_currency)
      ? (profile.base_currency as Currency)
      : 'TRY';

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View style={styles.centerFill}>
          <ThemedText themeColor="textSecondary">Abonelikler yüklenemedi</ThemedText>
        </View>
      ) : (subscriptions?.length ?? 0) === 0 ? (
        <View style={styles.centerFill}>
          <ThemedText themeColor="textSecondary">Henüz abonelik eklemedin</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {subscriptions!.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} baseCurrency={baseCurrency} rates={rates ?? []} />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.three, gap: Spacing.three },
});
