import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { QUICK_ADD_SERVICES, type QuickAddService } from '@/constants/quickAddServices';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  onSelect: (service: QuickAddService) => void;
  onManual: () => void;
};

export function QuickAddGrid({ onSelect, onManual }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const filtered = QUICK_ADD_SERVICES.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.search, { color: theme.text }]}
        placeholder="Servis ara"
        placeholderTextColor={theme.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      <View style={styles.grid}>
        {filtered.map((service) => (
          <Pressable key={service.key} style={styles.item} onPress={() => onSelect(service)}>
            <View style={[styles.badge, { backgroundColor: service.color }]}>
              <Text style={styles.badgeText}>{service.name.charAt(0)}</Text>
            </View>
            <ThemedText type="small" style={styles.itemLabel} numberOfLines={1}>
              {service.name}
            </ThemedText>
          </Pressable>
        ))}

        <Pressable style={styles.item} onPress={onManual}>
          <View style={[styles.badge, styles.manualBadge]}>
            <Text style={styles.badgeText}>+</Text>
          </View>
          <ThemedText type="small" style={styles.itemLabel}>
            Diğer / Manuel
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  search: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  item: { width: 80, alignItems: 'center', gap: Spacing.one },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  manualBadge: { backgroundColor: '#9CA3AF' },
  badgeText: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  itemLabel: { textAlign: 'center' },
});
