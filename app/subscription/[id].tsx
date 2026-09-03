import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Stub — full detail view + edit/cancel/delete (Flow D) is build order
// step 7. Exists so tapping a SubscriptionCard has somewhere to go.
export default function SubscriptionDetail() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <ThemedText themeColor="textSecondary">Detay ekranı yakında</ThemedText>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText type="link" themeColor="text">
            Geri
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  backButton: { marginTop: Spacing.two },
});
