import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubscriptionForm, type SubscriptionFormPrefill } from '@/components/forms/subscription-form';
import { QuickAddGrid } from '@/components/quick-add-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { QuickAddService } from '@/constants/quickAddServices';

// Flow B (docs/02_User_Flow.md): Quick-pick grid → Subscription detail form.
// docs/07_Project_Structure.md's suggested layout lists a single add.tsx
// route (not two), so this implements the 2-step flow as one screen with
// internal wizard state rather than a second route.
export default function AddSubscription() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'grid' | 'form'>('grid');
  const [prefill, setPrefill] = useState<SubscriptionFormPrefill>({});

  const handleSelectService = (service: QuickAddService) => {
    setPrefill({ name: service.name, category: service.category, icon_key: service.key });
    setStep('form');
  };

  const handleManual = () => {
    setPrefill({});
    setStep('form');
  };

  const handleSaved = () => {
    router.replace({ pathname: '/(tabs)/dashboard', params: { added: '1' } });
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedText type="subtitle" style={styles.title}>
          {step === 'grid' ? 'Abonelik Ekle' : 'Detaylar'}
        </ThemedText>

        {step === 'grid' ? (
          <QuickAddGrid onSelect={handleSelectService} onManual={handleManual} />
        ) : (
          <SubscriptionForm prefill={prefill} onBack={() => setStep('grid')} onSaved={handleSaved} />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  title: { marginBottom: Spacing.four },
});
