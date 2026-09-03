import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { CATEGORIES, type CategoryValue } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import type { BillingCycle, Currency, Subscription } from '@/lib/database.types';
import { useCreateSubscription, useUpdateSubscription } from '@/lib/queries/useSubscriptions';
import { calculateLifetimeSpend } from '@/lib/utils/calculateLifetimeSpend';
import { calculateNextRenewalDate } from '@/lib/utils/calculateNextRenewalDate';

const CURRENCIES: Currency[] = ['TRY', 'USD', 'EUR', 'GBP'];
const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'yearly', label: 'Yıllık' },
  { value: 'custom', label: 'Özel' },
];
const REMINDER_OPTIONS = [1, 3, 7];

const nameAndPriceSchema = z.object({
  name: z.string().trim().min(1, 'İsim gerekli'),
  price: z.coerce.number({ message: 'Geçerli bir tutar gir' }).positive('Geçerli bir tutar gir'),
});

export type SubscriptionFormPrefill = {
  name?: string;
  category?: CategoryValue;
  icon_key?: string;
};

type Props = {
  prefill?: SubscriptionFormPrefill;
  editingSubscription?: Subscription;
  onBack: () => void;
  onSaved: () => void;
};

// Flow D: "Düzenle (edit any field)" reuses this same form, pre-filled from
// the existing row, updating instead of inserting — pass editingSubscription
// rather than prefill. lifetime_spent is deliberately left untouched on
// edit; it's only seeded once at creation (see calculateLifetimeSpend) and
// otherwise maintained server-side per docs/05_Data_Model.md.
export function SubscriptionForm({ prefill, editingSubscription, onBack, onSaved }: Props) {
  const theme = useTheme();
  const { session } = useAuth();
  const isEditing = !!editingSubscription;
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const isSaving = createSubscription.isPending || updateSubscription.isPending;

  const [name, setName] = useState(editingSubscription?.name ?? prefill?.name ?? '');
  const [category, setCategory] = useState<CategoryValue>(
    (editingSubscription?.category as CategoryValue | undefined) ?? prefill?.category ?? 'other'
  );
  const [price, setPrice] = useState(editingSubscription ? String(editingSubscription.price) : '');
  const [currency, setCurrency] = useState<Currency>(editingSubscription?.currency ?? 'TRY');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(editingSubscription?.billing_cycle ?? 'monthly');
  const [customCycleDays, setCustomCycleDays] = useState(
    editingSubscription?.custom_cycle_days ? String(editingSubscription.custom_cycle_days) : '30'
  );
  const [startDate, setStartDate] = useState(editingSubscription?.start_date ?? format(new Date(), 'yyyy-MM-dd'));
  const [nextRenewalDate, setNextRenewalDate] = useState(
    editingSubscription?.next_renewal_date ??
      format(calculateNextRenewalDate(new Date(), 'monthly'), 'yyyy-MM-dd')
  );
  const [reminderLeadDays, setReminderLeadDays] = useState(editingSubscription?.reminder_lead_days ?? 3);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculated from start date + cycle, but still user-editable — see
  // the DateField below. Skips its first run so an edit's existing
  // next_renewal_date isn't immediately overwritten just by opening the
  // form; it only recalculates once start date or cycle actually changes.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (isEditing) return;
    }
    const start = new Date(startDate);
    const days = billingCycle === 'custom' ? parseInt(customCycleDays, 10) || 30 : undefined;
    setNextRenewalDate(format(calculateNextRenewalDate(start, billingCycle, days), 'yyyy-MM-dd'));
  }, [startDate, billingCycle, customCycleDays, isEditing]);

  const handleSave = async () => {
    setError(null);

    const parsed = nameAndPriceSchema.safeParse({ name, price });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (billingCycle === 'custom' && (!parseInt(customCycleDays, 10) || parseInt(customCycleDays, 10) <= 0)) {
      setError('Geçerli bir gün sayısı gir');
      return;
    }
    if (!session) return;

    try {
      if (isEditing) {
        await updateSubscription.mutateAsync({
          id: editingSubscription.id,
          edits: {
            name: parsed.data.name,
            category,
            price: parsed.data.price,
            currency,
            billing_cycle: billingCycle,
            custom_cycle_days: billingCycle === 'custom' ? parseInt(customCycleDays, 10) : null,
            start_date: startDate,
            next_renewal_date: nextRenewalDate,
            reminder_lead_days: reminderLeadDays,
          },
        });
      } else {
        await createSubscription.mutateAsync({
          user_id: session.user.id,
          name: parsed.data.name,
          category,
          icon_key: prefill?.icon_key ?? null,
          price: parsed.data.price,
          currency,
          billing_cycle: billingCycle,
          custom_cycle_days: billingCycle === 'custom' ? parseInt(customCycleDays, 10) : null,
          start_date: startDate,
          next_renewal_date: nextRenewalDate,
          reminder_lead_days: reminderLeadDays,
          lifetime_spent: calculateLifetimeSpend(
            new Date(startDate),
            parsed.data.price,
            billingCycle,
            billingCycle === 'custom' ? parseInt(customCycleDays, 10) : null
          ),
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
    }
  };

  return (
    <View style={styles.form}>
      <Pressable onPress={onBack} hitSlop={12}>
        <ThemedText type="link">{'‹ Geri'}</ThemedText>
      </Pressable>

      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="İsim"
        placeholderTextColor={theme.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <ThemedText type="small" themeColor="textSecondary">
        Kategori
      </ThemedText>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.value}
            style={[styles.chip, category === c.value && styles.chipActive]}
            onPress={() => setCategory(c.value)}>
            <ThemedText style={[styles.chipText, category === c.value && styles.chipTextActive]}>
              {c.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.priceInput, { color: theme.text }]}
          placeholder="Tutar"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />
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
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Ödeme sıklığı
      </ThemedText>
      <View style={styles.chipRow}>
        {BILLING_CYCLES.map((c) => (
          <Pressable
            key={c.value}
            style={[styles.chip, billingCycle === c.value && styles.chipActive]}
            onPress={() => setBillingCycle(c.value)}>
            <ThemedText style={[styles.chipText, billingCycle === c.value && styles.chipTextActive]}>
              {c.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {billingCycle === 'custom' && (
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Kaç günde bir?"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={customCycleDays}
          onChangeText={setCustomCycleDays}
        />
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Başlangıç tarihi
      </ThemedText>
      <DateField value={startDate} onChange={setStartDate} />

      <ThemedText type="small" themeColor="textSecondary">
        Sonraki yenileme tarihi
      </ThemedText>
      <DateField value={nextRenewalDate} onChange={setNextRenewalDate} />

      <ThemedText type="small" themeColor="textSecondary">
        Hatırlatma (kaç gün önce)
      </ThemedText>
      <View style={styles.chipRow}>
        {REMINDER_OPTIONS.map((d) => (
          <Pressable
            key={d}
            style={[styles.chip, reminderLeadDays === d && styles.chipActive]}
            onPress={() => setReminderLeadDays(d)}>
            <ThemedText style={[styles.chipText, reminderLeadDays === d && styles.chipTextActive]}>
              {d} gün
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>{isEditing ? 'Güncelle' : 'Kaydet'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two },
  row: { gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  priceInput: { marginBottom: Spacing.one },
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
  error: { color: '#D64545' },
  saveButton: {
    backgroundColor: '#3c87f7',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});
