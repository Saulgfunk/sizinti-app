import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Currency } from '@/lib/database.types';
import { useAuth } from '@/lib/auth-context';
import { useUpdateProfile } from '@/lib/queries/useProfile';

const CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'GBP'];

export default function Preferences() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const updateProfile = useUpdateProfile();

  const [currency, setCurrency] = useState<Currency>('TRY');
  const [notificationsAsked, setNotificationsAsked] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const requestNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsGranted(status === 'granted');
    } catch {
      // Permission API unsupported in this environment — not fatal, renewal
      // reminders just won't fire until the user enables it from OS settings.
    } finally {
      setNotificationsAsked(true);
    }
  };

  const handleContinue = async () => {
    if (!session) return;
    await updateProfile.mutateAsync({
      id: session.user.id,
      base_currency: currency,
      onboarding_completed_at: new Date().toISOString(),
    });
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.five }]}>
      <View>
        <ThemedText type="subtitle" style={styles.title}>
          Tercihlerini ayarla
        </ThemedText>

        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Ana para birimi
        </ThemedText>
        <View style={styles.chipRow}>
          {CURRENCIES.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, currency === c && styles.chipActive]}
              onPress={() => setCurrency(c)}>
              <ThemedText style={[styles.chipText, currency === c && styles.chipTextActive]}>{c}</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Bildirimler
        </ThemedText>
        <Pressable style={styles.secondaryButton} onPress={requestNotifications}>
          <ThemedText style={styles.secondaryButtonText}>
            {notificationsAsked
              ? notificationsGranted
                ? 'Bildirimlere izin verildi ✓'
                : "İzin verilmedi — Ayarlar'dan değiştirebilirsin"
              : 'Bildirimlere izin ver'}
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryButton, { marginBottom: insets.bottom + Spacing.three }]}
        onPress={handleContinue}
        disabled={updateProfile.isPending}>
        <ThemedText style={styles.primaryButtonText}>
          {updateProfile.isPending ? 'Kaydediliyor…' : 'Devam Et'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.three, justifyContent: 'space-between' },
  title: { marginBottom: Spacing.four },
  label: { marginBottom: Spacing.two, marginTop: Spacing.four },
  chipRow: { flexDirection: 'row', gap: Spacing.two },
  chip: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: { backgroundColor: '#3c87f7', borderColor: '#3c87f7' },
  chipText: { fontSize: 16, fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '500' },
  primaryButton: {
    backgroundColor: '#3c87f7',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});
