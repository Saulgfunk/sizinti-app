import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useSubscriptions } from '@/lib/queries/useSubscriptions';

// Empty state + FAB (docs/07_Project_Structure.md build order step 4), plus
// a bare-bones list once subscriptions exist so the screen doesn't look
// broken now that Add Subscription (step 5) can actually create rows.
// Totals, category chart, and the real card design are step 6.
export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: subscriptions, isLoading, isError } = useSubscriptions(session?.user.id);
  const params = useLocalSearchParams<{ added?: string }>();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!params.added) return;
    setShowToast(true);
    router.setParams({ added: undefined });
    const timer = setTimeout(() => setShowToast(false), 2500);
    return () => clearTimeout(timer);
  }, [params.added]);

  const goToAdd = () => router.push('/subscription/add');
  const isEmpty = (subscriptions?.length ?? 0) === 0;

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
        <ScrollView contentContainerStyle={styles.list}>
          {subscriptions!.map((sub) => (
            <View key={sub.id} style={styles.row}>
              <ThemedText>{sub.name}</ThemedText>
              <ThemedText themeColor="textSecondary">
                {sub.price} {sub.currency}
              </ThemedText>
            </View>
          ))}
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
  list: { padding: Spacing.three, gap: Spacing.three },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    padding: Spacing.three,
  },
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
