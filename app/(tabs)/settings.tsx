import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

// Stub — the full Settings screen (docs/04_Screens_and_Features.md Screen 10:
// notification prefs, base currency, category management, CSV export) is
// build order step 10. Sign out is carried over from the old
// dashboard-placeholder.tsx (Phase 2) since it's the documented home for it
// (Flow G: "Profile — email, sign out, delete account").
export default function Settings() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>

        <Pressable style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
          <ThemedText type="link" themeColor="text">
            Çıkış Yap
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  signOutButton: { marginTop: Spacing.three },
});
