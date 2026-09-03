import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthForm } from '@/components/auth-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function Login() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.five }]}>
      <ThemedText type="subtitle" style={styles.title}>
        Giriş Yap
      </ThemedText>

      <AuthForm mode="login" />

      <View style={styles.toggleRow}>
        <ThemedText type="small">Hesabın yok mu? </ThemedText>
        <Link href="/(auth)/signup" replace>
          <ThemedText type="link" themeColor="text" style={styles.toggleLink}>
            Kayıt ol
          </ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.three },
  title: { marginBottom: Spacing.four },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.four },
  toggleLink: { textDecorationLine: 'underline', fontWeight: '600' },
});
