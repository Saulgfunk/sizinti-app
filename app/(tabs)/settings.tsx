import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import type { Currency } from '@/lib/database.types';
import { useCategories, useCreateCategory, useRenameCategory } from '@/lib/queries/useCategories';
import { useProfile, useUpdateProfile } from '@/lib/queries/useProfile';
import { useSubscriptions } from '@/lib/queries/useSubscriptions';
import { supabase } from '@/lib/supabase';
import { ThemeOverride, useThemeOverride } from '@/lib/theme-context';
import { exportSubscriptionsCsv } from '@/lib/utils/exportCsv';

const CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'GBP'];
const REMINDER_OPTIONS = [1, 3, 7];
const CHECKIN_INTERVAL_OPTIONS = [60, 75, 90];
const THEME_OPTIONS: { value: ThemeOverride; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
];

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

// Flow G (docs/02_User_Flow.md). Görünüm (dark mode toggle), Kategoriler
// (rename/add), Verilerini Dışa Aktar (CSV export), and a working Hesabı
// Sil were all originally scoped out — dark mode and CSV export are
// P1/v0.2 per docs/04 and docs/08, category management had no backing
// table, and delete-account needed an undeployed Edge Function. Built
// anyway at the user's explicit request to override that phasing.
export default function Settings() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const { data: categories } = useCategories(session?.user.id);
  const { data: subscriptions } = useSubscriptions(session?.user.id);
  const updateProfile = useUpdateProfile();
  const renameCategory = useRenameCategory();
  const createCategory = useCreateCategory();
  const { override, setOverride } = useThemeOverride();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEditingCategory = (id: string, currentLabel: string) => {
    setEditingCategoryId(id);
    setEditingLabel(currentLabel);
  };

  const saveCategory = async () => {
    if (!editingCategoryId || !editingLabel.trim()) return;
    await renameCategory.mutateAsync({ id: editingCategoryId, label: editingLabel.trim() });
    setEditingCategoryId(null);
  };

  const addCategory = async () => {
    if (!session || !newCategoryLabel.trim()) return;
    const palette = ['#3c87f7', '#10A37F', '#F97316', '#8B5CF6', '#EAB308', '#EC4899', '#14B8A6'];
    const color = palette[(categories?.length ?? 0) % palette.length];
    await createCategory.mutateAsync({ userId: session.user.id, label: newCategoryLabel.trim(), color });
    setNewCategoryLabel('');
  };

  const handleExportCsv = async () => {
    if (!subscriptions || !categories) return;
    setIsExporting(true);
    try {
      await exportSubscriptionsCsv(subscriptions, categories);
    } catch {
      Alert.alert('Hata', 'Dışa aktarma başarısız oldu.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı sil',
      'Bu işlem geri alınamaz. Tüm aboneliklerin ve verilerin kalıcı olarak silinecek. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: async () => {
            if (!session || !SUPABASE_URL) return;
            setIsDeleting(true);
            try {
              const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              if (!res.ok) throw new Error();
              await supabase.auth.signOut();
            } catch {
              Alert.alert('Hata', 'Hesap silinemedi. Daha sonra tekrar dene.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
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
          <Pressable style={styles.linkButton} onPress={handleDeleteAccount} disabled={isDeleting}>
            <ThemedText type="link" style={styles.dangerText}>
              {isDeleting ? 'Siliniyor…' : 'Hesabı Sil'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Görünüm
          </ThemedText>
          <View style={styles.chipRow}>
            {THEME_OPTIONS.map((t) => (
              <Pressable
                key={t.value}
                style={[styles.chip, override === t.value && styles.chipActive]}
                onPress={() => setOverride(t.value)}>
                <ThemedText style={[styles.chipText, override === t.value && styles.chipTextActive]}>
                  {t.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
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

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Kategoriler
          </ThemedText>
          {(categories ?? []).map((c) =>
            editingCategoryId === c.id ? (
              <View key={c.id} style={styles.categoryEditRow}>
                <TextInput
                  style={[styles.categoryInput, { color: theme.text }]}
                  value={editingLabel}
                  onChangeText={setEditingLabel}
                  autoFocus
                />
                <Pressable onPress={saveCategory} hitSlop={8}>
                  <ThemedText type="link">Kaydet</ThemedText>
                </Pressable>
                <Pressable onPress={() => setEditingCategoryId(null)} hitSlop={8}>
                  <ThemedText type="small" themeColor="textSecondary">
                    İptal
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable key={c.id} style={styles.categoryRow} onPress={() => startEditingCategory(c.id, c.label)}>
                <View style={styles.categoryRowLeft}>
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <ThemedText>{c.label}</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Düzenle
                </ThemedText>
              </Pressable>
            )
          )}

          <View style={styles.categoryEditRow}>
            <TextInput
              style={[styles.categoryInput, { color: theme.text }]}
              placeholder="Yeni kategori"
              placeholderTextColor={theme.textSecondary}
              value={newCategoryLabel}
              onChangeText={setNewCategoryLabel}
            />
            <Pressable onPress={addCategory} disabled={createCategory.isPending} hitSlop={8}>
              <ThemedText type="link">Ekle</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Veri
          </ThemedText>
          <Pressable style={styles.linkButton} onPress={handleExportCsv} disabled={isExporting}>
            <ThemedText type="link">{isExporting ? 'Hazırlanıyor…' : 'Verilerini Dışa Aktar (CSV)'}</ThemedText>
          </Pressable>
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
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D2D8',
  },
  categoryRowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryEditRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  categoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 15,
  },
});
