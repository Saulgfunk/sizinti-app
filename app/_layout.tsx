import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth, AuthProvider } from '@/lib/auth-context';
import { registerPushToken } from '@/lib/push-notifications';
import { ThemeOverrideProvider, useThemeOverride } from '@/lib/theme-context';
import { useAuthGate } from '@/lib/use-auth-gate';

const queryClient = new QueryClient();

function Navigation() {
  useAuthGate();

  const { session } = useAuth();
  useEffect(() => {
    if (session) registerPushToken(session.user.id);
  }, [session]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="subscription/add" />
    </Stack>
  );
}

function ThemedApp() {
  const { resolvedScheme } = useThemeOverride();

  return (
    <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Navigation />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeOverrideProvider>
          <SafeAreaProvider>
            <ThemedApp />
          </SafeAreaProvider>
        </ThemeOverrideProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
