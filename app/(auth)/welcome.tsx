import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const SLIDES = [
  'Unuttuğun abonelikler bütçeni eritiyor',
  'Tek bakışta tüm harcamaların',
  'Hâlâ kullanıyor musun diye sana soracağız',
];

const { width } = Dimensions.get('window');

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const goToAuth = () => router.replace('/(auth)/signup');

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.skipRow}>
        <Pressable onPress={goToAuth} hitSlop={12}>
          <ThemedText type="link">Atla</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}>
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <ThemedText type="subtitle" style={styles.slideText}>
              {slide}
            </ThemedText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={[styles.bottomRow, { paddingBottom: insets.bottom + Spacing.three }]}>
        {activeIndex === SLIDES.length - 1 ? (
          <Pressable style={styles.primaryButton} onPress={goToAuth}>
            <Text style={styles.primaryButtonText}>Başla</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.primaryButton}
            onPress={() => scrollRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true })}>
            <Text style={styles.primaryButtonText}>İleri</Text>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.five },
  slideText: { textAlign: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.one, paddingVertical: Spacing.three },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D0D2D8' },
  dotActive: { backgroundColor: '#3c87f7' },
  bottomRow: { paddingHorizontal: Spacing.three },
  primaryButton: { backgroundColor: '#3c87f7', borderRadius: 12, paddingVertical: Spacing.three, alignItems: 'center' },
  primaryButtonText: { fontWeight: '600', color: '#ffffff', fontSize: 16 },
});
