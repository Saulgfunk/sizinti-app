import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Purely visual — routing is decided by lib/use-auth-gate.ts, which is
// mounted at the root layout so it works from any screen, not just this one.
export default function Splash() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sızıntı</ThemedText>
      <ActivityIndicator style={styles.spinner} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  spinner: { marginTop: 8 },
});
