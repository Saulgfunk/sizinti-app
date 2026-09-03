import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Subscription } from '@/lib/database.types';
import { useLogCheckin } from '@/lib/queries/useCheckins';
import { formatCurrency } from '@/lib/utils/formatCurrency';

type Props = {
  subscription: Subscription;
  userId: string;
};

// Flow F (docs/02_User_Flow.md) — the core "leak found" metric event
// (PRD §5). "Evet, kullanıyorum" resolves right here; "Hayır / Emin değilim"
// hands off to the detail screen (fromCheckin param), since the actual
// checkin_event can't be logged until we know whether they went on to
// cancel or just dismissed — see lib/queries/useCheckins.ts.
export function CheckinCard({ subscription, userId }: Props) {
  const logCheckin = useLogCheckin();
  const [isBusy, setIsBusy] = useState(false);

  const handleStillUsing = async () => {
    setIsBusy(true);
    try {
      await logCheckin.mutateAsync({
        subscriptionId: subscription.id,
        userId,
        response: 'still_using',
        resultedInCancellation: false,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleNotSure = () => {
    router.push({ pathname: '/subscription/[id]', params: { id: subscription.id, fromCheckin: '1' } });
  };

  return (
    <View style={styles.card}>
      <ThemedText style={styles.message}>
        {subscription.name}&apos;i hâlâ kullanıyor musun? Şu ana kadar{' '}
        {formatCurrency(subscription.lifetime_spent, subscription.currency)} harcadın.
      </ThemedText>
      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={handleNotSure} disabled={isBusy}>
          <ThemedText style={styles.secondaryButtonText}>Hayır / Emin değilim</ThemedText>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleStillUsing} disabled={isBusy}>
          <ThemedText style={styles.primaryButtonText}>Evet, kullanıyorum</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  message: { color: '#1F2937' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3c87f7',
    borderRadius: 12,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
});
