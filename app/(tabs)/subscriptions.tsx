import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Stub — the full sortable/filterable list (docs/04_Screens_and_Features.md
// Screen 6) isn't built until subscriptions exist to list, later in the
// build order. Exists now only so the tab bar has all 3 tabs wired up.
export default function Subscriptions() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.centerFill}>
        <ThemedText themeColor="textSecondary">Abonelikler listesi yakında</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
