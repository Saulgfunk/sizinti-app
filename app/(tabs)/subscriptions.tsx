import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubscriptionCard } from '@/components/subscription-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useSubscriptions } from '@/lib/queries/useSubscriptions';

// Screen 6 (docs/04_Screens_and_Features.md): "same card list as Dashboard,
// list-first view." Sort/filter controls aren't built yet — this is the
// same query the Dashboard uses (already sorted by next_renewal_date).
export default function Subscriptions() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: subscriptions, isLoading, isError } = useSubscriptions(session?.user.id);

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
            <SubscriptionCard key={sub.id} subscription={sub} />
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
