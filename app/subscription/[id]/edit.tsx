import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubscriptionForm } from '@/components/forms/subscription-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSubscription } from '@/lib/queries/useSubscriptions';

// Flow D step 3: "Edit → same form as Flow B, pre-filled → Save → returns
// to detail view."
export default function EditSubscription() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subscription, isLoading, isError } = useSubscription(id);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle" style={styles.title}>
          Düzenle
        </ThemedText>

        {isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator />
          </View>
        ) : isError || !subscription ? (
          <ThemedText themeColor="textSecondary">Abonelik bulunamadı</ThemedText>
        ) : (
          <SubscriptionForm
            editingSubscription={subscription}
            onBack={() => router.back()}
            onSaved={() => router.back()}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  title: { marginBottom: Spacing.four },
  centerFill: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.six },
});
