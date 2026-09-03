import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import type { Currency } from '@/lib/database.types';
import { useProfile, useUpdateProfile } from '@/lib/queries/useProfile';
import { supabase } from '@/lib/supabase';

const CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'GBP'];
const REMINDER_OPTIONS = [1, 3, 7];
const CHECKIN_INTERVAL_OPTIONS = [60, 75, 90];

// Flow G (docs/02_User_Flow.md). Two items from that flow are intentionally
// not here: CSV export is explicitly P1/v0.2 in
// docs/04_Screens_and_Features.md's priority list, not v0.1. Category
// management (rename/add) has no backing table in docs/05_Data_Model.md —
// categories are just free text on subscriptions.category today, so a
// "manage categories" CRUD screen would mean inventing schema the docs
// don't specify, not filling a UI-only gap.
export default function Settings() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const updateProfile = useUpdateProfile();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı sil',
      'Hesap silme henüz desteklenmiyor — bu özellik sunucu tarafında ek bir işlem gerektiriyor.',
      [{ text: 'Tamam' }]
    );
  };

  if (!profile || !session) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerFill}>
          <ActivityIndicator />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="subtitle" style={styles.title}>
          Ayarlar
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Hesap
          </ThemedText>
          <ThemedText style={styles.email}>{session.user.email}</ThemedText>
          <Pressable style={styles.linkButton} onPress={() => supabase.auth.signOut()}>
            <ThemedText type="link">Çıkış Yap</ThemedText>
          </Pressable>
          <Pressable style={styles.linkButton} onPress={handleDeleteAccount}>
            <ThemedText type="link" style={styles.dangerText}>
              Hesabı Sil
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Ana para birimi
          </ThemedText>
          <View style={styles.chipRow}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, profile.base_currency === c && styles.chipActive]}
                onPress={() => updateProfile.mutate({ id: profile.id, base_currency: c })}>
                <ThemedText style={[styles.chipText, profile.base_currency === c && styles.chipTextActive]}>
                  {c}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Varsayılan hatırlatma (kaç gün önce)
          </ThemedText>
          <View style={styles.chipRow}>
            {REMINDER_OPTIONS.map((d) => (
              <Pressable
                key={d}
                style={[styles.chip, profile.default_reminder_lead_days === d && styles.chipActive]}
                onPress={() => updateProfile.mutate({ id: profile.id, default_reminder_lead_days: d })}>
                <ThemedText
                  style={[styles.chipText, profile.default_reminder_lead_days === d && styles.chipTextActive]}>
                  {d} gün
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            &quot;Hâlâ kullanıyor musun?&quot; sıklığı
          </ThemedText>
          <View style={styles.chipRow}>
            {CHECKIN_INTERVAL_OPTIONS.map((d) => (
              <Pressable
                key={d}
                style={[styles.chip, profile.checkin_interval_days === d && styles.chipActive]}
                onPress={() => updateProfile.mutate({ id: profile.id, checkin_interval_days: d })}>
                <ThemedText style={[styles.chipText, profile.checkin_interval_days === d && styles.chipTextActive]}>
                  {d} gün
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.five },
  title: { marginBottom: Spacing.two },
  section: { gap: Spacing.two },
  email: { fontSize: 16 },
  linkButton: { marginTop: Spacing.one },
  dangerText: { color: '#D64545' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipActive: { backgroundColor: '#3c87f7', borderColor: '#3c87f7' },
  chipText: { fontSize: 15, fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
});
