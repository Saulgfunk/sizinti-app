import { differenceInCalendarDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useLogCheckin } from '@/lib/queries/useCheckins';
import { useDeleteSubscription, useSubscription, useUpdateSubscription } from '@/lib/queries/useSubscriptions';
import { formatCurrency } from '@/lib/utils/formatCurrency';

const BILLING_CYCLE_LABELS: Record<string, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
  custom: 'Özel',
};

// Flow D (docs/02_User_Flow.md): full detail view + lifetime spent + mini
// timeline, with Düzenle/İptal Et/Sil actions. Also handles Flow F's
// "Hayır / Emin değilim" hand-off (fromCheckin param) — the deferred
// checkin_event fires here once the outcome (cancel or dismiss) is known.
export default function SubscriptionDetail() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { id, fromCheckin } = useLocalSearchParams<{ id: string; fromCheckin?: string }>();
  const isFromCheckin = fromCheckin === '1';
  const { session } = useAuth();
  const { data: subscription, isLoading, isError } = useSubscription(id);
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();
  const logCheckin = useLogCheckin();
  const [isBusy, setIsBusy] = useState(false);
  const hasResolvedCheckinRef = useRef(false);

  // Backstop for leaving via swipe-back/hardware back rather than the
  // explicit Geri link below — counts as "dismissed, still using" per
  // docs/03_Flowchart.md §3 box L.
  useEffect(() => {
    return () => {
      if (isFromCheckin && !hasResolvedCheckinRef.current && session && subscription) {
        hasResolvedCheckinRef.current = true;
        logCheckin.mutate({
          subscriptionId: subscription.id,
          userId: session.user.id,
          response: 'not_sure_or_no',
          resultedInCancellation: false,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFromCheckin, session, subscription?.id]);

  const handleBack = () => {
    if (isFromCheckin && !hasResolvedCheckinRef.current && session && subscription) {
      hasResolvedCheckinRef.current = true;
      logCheckin.mutate({
        subscriptionId: subscription.id,
        userId: session.user.id,
        response: 'not_sure_or_no',
        resultedInCancellation: false,
      });
    }
    router.back();
  };

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
            if (isFromCheckin && !hasResolvedCheckinRef.current && session) {
              hasResolvedCheckinRef.current = true;
              await logCheckin.mutateAsync({
                subscriptionId: subscription.id,
                userId: session.user.id,
                response: 'not_sure_or_no',
                resultedInCancellation: true,
              });
            }
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
        <Pressable onPress={handleBack} hitSlop={12}>
          <ThemedText type="link">{'‹ Geri'}</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">{subscription.name}</ThemedText>
        {subscription.status === 'cancelled' && (
          <View style={[styles.cancelledBadge, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary">
              İptal edildi
            </ThemedText>
          </View>
        )}

        {isFromCheckin && subscription.status === 'active' && (
          <View style={styles.checkinNudge}>
            <ThemedText type="small" style={styles.checkinNudgeText}>
              Kullanmıyorsan, aşağıdan iptal edebilirsin.
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
            <Pressable
              style={[styles.secondaryButton, isFromCheckin && styles.cancelButtonHighlighted]}
              onPress={handleCancel}
              disabled={isBusy}>
              <ThemedText style={[styles.secondaryButtonText, isFromCheckin && styles.cancelButtonHighlightedText]}>
                Aboneliği İptal Et
              </ThemedText>
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
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  checkinNudge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: Spacing.two,
  },
  checkinNudgeText: { color: '#1F2937' },
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
  cancelButtonHighlighted: { backgroundColor: '#D64545', borderColor: '#D64545' },
  cancelButtonHighlightedText: { color: '#ffffff' },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#D64545', fontWeight: '600', fontSize: 16 },
});
