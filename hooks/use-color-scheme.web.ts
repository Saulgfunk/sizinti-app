import { useThemeOverride } from '@/lib/theme-context';

export function useColorScheme() {
  return useThemeOverride().resolvedScheme;
}
