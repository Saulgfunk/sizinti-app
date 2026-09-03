import { differenceInCalendarDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useDeleteSubscription, useSubscription, useUpdateSubscription } from '@/lib/queries/useSubscriptions';
import { formatCurrency } from '@/lib/utils/formatCurrency';

const BILLING_CYCLE_LABELS: Record<string, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
  custom: 'Özel',
};

// Flow D (docs/02_User_Flow.md): full detail view + lifetime spent + mini
// timeline, with Düzenle/İptal Et/Sil actions.
export default function SubscriptionDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { data: subscription, isLoading, isError } = useSubscription(id);
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();
  const [isBusy, setIsBusy] = useState(false);

  const handleCancel = () => {
    if (!subscription) return;
    Alert.alert('Aboneliği iptal et', `${subscription.name} aboneliğini iptal etmek istediğine emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          setIsBusy(true);
          try {
            await updateSubscription.mutateAsync({
              id: subscription.id,
              edits: { status: 'cancelled', cancelled_at: format(new Date(), 'yyyy-MM-dd') },
            });
          } finally {
            setIsBusy(false);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!subscription || !session) return;
    Alert.alert(
      'Aboneliği sil',
      `${subscription.name} aboneliğini tamamen silmek istediğine emin misin? Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setIsBusy(true);
            try {
              await deleteSubscription.mutateAsync({ id: subscription.id, userId: session.user.id });
              router.replace('/(tabs)/dashboard');
            } finally {
              setIsBusy(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerFill}>
          <ActivityIndicator />
        </View>
      </ThemedView>
    );
  }

  if (isError || !subscription) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerFill}>
          <ThemedText themeColor="textSecondary">Abonelik bulunamadı</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const daysUntilRenewal = differenceInCalendarDays(new Date(subscription.next_renewal_date), new Date());
  const categoryLabel = CATEGORIES.find((c) => c.value === subscription.category)?.label ?? subscription.category;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ThemedText type="link">{'‹ Geri'}</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">{subscription.name}</ThemedText>
        {subscription.status === 'cancelled' && (
          <View style={styles.cancelledBadge}>
            <ThemedText type="small" style={styles.cancelledBadgeText}>
              İptal edildi
            </ThemedText>
          </View>
        )}

        <View style={styles.lifetimeBox}>
          <ThemedText type="small" themeColor="textSecondary">
            Bu abonelikte toplam harcama
          </ThemedText>
          <ThemedText type="title" style={styles.lifetimeAmount}>
            {formatCurrency(subscription.lifetime_spent, subscription.currency)}
          </ThemedText>
        </View>

        <View style={styles.timeline}>
          <ThemedText type="small" themeColor="textSecondary">
            Başlangıç: {format(new Date(subscription.start_date), 'd MMMM yyyy', { locale: tr })}
          </ThemedText>
          {subscription.status === 'active' && (
            <ThemedText type="small" themeColor="textSecondary">
              Sonraki yenileme: {format(new Date(subscription.next_renewal_date), 'd MMMM yyyy', { locale: tr })} (
              {daysUntilRenewal >= 0 ? `${daysUntilRenewal} gün sonra` : 'gecikti'})
            </ThemedText>
          )}
          {subscription.status === 'cancelled' && subscription.cancelled_at && (
            <ThemedText type="small" themeColor="textSecondary">
              İptal tarihi: {format(new Date(subscription.cancelled_at), 'd MMMM yyyy', { locale: tr })}
            </ThemedText>
          )}
        </View>

        <View style={styles.fieldsBox}>
          <DetailRow label="Kategori" value={categoryLabel} />
          <DetailRow label="Tutar" value={formatCurrency(subscription.price, subscription.currency)} />
          <DetailRow label="Ödeme sıklığı" value={BILLING_CYCLE_LABELS[subscription.billing_cycle]} />
          <DetailRow label="Hatırlatma" value={`${subscription.reminder_lead_days ?? 3} gün önce`} />
        </View>

        {subscription.status === 'active' && (
          <View style={styles.actions}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push({ pathname: '/subscription/[id]/edit', params: { id: subscription.id } })}>
              <ThemedText style={styles.secondaryButtonText}>Düzenle</ThemedText>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleCancel} disabled={isBusy}>
              <ThemedText style={styles.secondaryButtonText}>Aboneliği İptal Et</ThemedText>
            </Pressable>
          </View>
        )}
        <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={isBusy}>
          <ThemedText style={styles.deleteButtonText}>Sil</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cancelledBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  cancelledBadgeText: { color: '#6B7280' },
  lifetimeBox: { alignItems: 'center', paddingVertical: Spacing.three },
  lifetimeAmount: { textAlign: 'center' },
  timeline: { gap: Spacing.one },
  fieldsBox: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actions: { gap: Spacing.two },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '500' },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#D64545', fontWeight: '600', fontSize: 16 },
});
