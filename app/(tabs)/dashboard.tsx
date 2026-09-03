import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChart } from '@/components/category-chart';
import { CheckinCard } from '@/components/checkin-card';
import { LifetimeSpendHeader } from '@/components/lifetime-spend-header';
import { SubscriptionCard } from '@/components/subscription-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES, type CategoryValue } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import type { Currency } from '@/lib/database.types';
import { useFxRates } from '@/lib/queries/useFxRates';
import { useProfile } from '@/lib/queries/useProfile';
import { useSubscriptions } from '@/lib/queries/useSubscriptions';
import { selectCheckinCandidate } from '@/lib/utils/selectCheckinCandidate';

const VALID_CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'GBP'];

// docs/07_Project_Structure.md build order step 6: totals, category chart,
// subscription card list, now that Add Subscription (step 5) can create
// rows. Check-in card and bell icon are steps 8/9, not this one.
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { data: subscriptions, isLoading, isError } = useSubscriptions(session?.user.id);
  const { data: rates } = useFxRates();
  const params = useLocalSearchParams<{ added?: string }>();
  const [showToast, setShowToast] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue | null>(null);

  useEffect(() => {
    if (!params.added) return;
    setShowToast(true);
    router.setParams({ added: undefined });
    const timer = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(timer);
  }, [params.added]);

  const goToAdd = () => router.push('/subscription/add');
  const isEmpty = (subscriptions?.length ?? 0) === 0;

  const baseCurrency: Currency =
    profile?.base_currency && (VALID_CURRENCIES as string[]).includes(profile.base_currency)
      ? (profile.base_currency as Currency)
      : 'TRY';

  const visibleSubscriptions = selectedCategory
    ? (subscriptions ?? []).filter((s) => s.category === selectedCategory)
    : subscriptions;

  const checkinCandidate =
    subscriptions && profile ? selectCheckinCandidate(subscriptions, profile.checkin_interval_days) : null;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {showToast && (
        <View style={styles.toast}>
          <ThemedText style={styles.toastText}>Eklendi ✓</ThemedText>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View style={styles.centerFill}>
          <ThemedText themeColor="textSecondary">Abonelikler yüklenemedi</ThemedText>
        </View>
      ) : isEmpty ? (
        <View style={styles.centerFill}>
          <ThemedText type="subtitle" style={styles.emptyText}>
            Henüz abonelik eklemedin
          </ThemedText>
          <Pressable style={styles.ctaButton} onPress={goToAdd}>
            <ThemedText style={styles.ctaButtonText}>+ Abonelik Ekle</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {checkinCandidate && session && <CheckinCard subscription={checkinCandidate} userId={session.user.id} />}

          <LifetimeSpendHeader subscriptions={subscriptions!} baseCurrency={baseCurrency} rates={rates ?? []} />

          <CategoryChart
            subscriptions={subscriptions!}
            baseCurrency={baseCurrency}
            rates={rates ?? []}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {selectedCategory && (
            <View style={styles.filterBar}>
              <ThemedText type="small" themeColor="textSecondary">
                Filtre: {CATEGORIES.find((c) => c.value === selectedCategory)?.label}
              </ThemedText>
              <Pressable onPress={() => setSelectedCategory(null)}>
                <ThemedText type="link">Temizle</ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.list}>
            {visibleSubscriptions!.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} baseCurrency={baseCurrency} rates={rates ?? []} />
            ))}
          </View>
        </ScrollView>
      )}

      <Pressable style={[styles.fab, { bottom: insets.bottom + Spacing.four }]} onPress={goToAdd}>
        <ThemedText style={styles.fabText}>+</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four, paddingHorizontal: Spacing.five },
  emptyText: { textAlign: 'center' },
  ctaButton: {
    backgroundColor: '#3c87f7',
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  ctaButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  scrollContent: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { gap: Spacing.three },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
  },
  fabText: { color: '#ffffff', fontSize: 28, fontWeight: '400', lineHeight: 32 },
  toast: {
    position: 'absolute',
    top: Spacing.four,
    alignSelf: 'center',
    backgroundColor: '#1F9D55',
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    zIndex: 10,
  },
  toastText: { color: '#ffffff', fontWeight: '600' },
});
