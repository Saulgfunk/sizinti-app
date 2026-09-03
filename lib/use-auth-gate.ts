import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/queries/useProfile';

const MIN_SPLASH_MS = 1500;
const AUTH_ROUTES = ['/welcome', '/login', '/signup'];
const ONBOARDING_ROUTES = ['/preferences'];

// Lives at the root layout (always mounted) rather than on the Splash screen
// itself, so it keeps redirecting correctly even after Splash has unmounted —
// e.g. routing back to Welcome when the user signs out from deep in the app.
export function useAuthGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(session?.user.id);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minTimeElapsed || authLoading) return;

    const inAuthRoute = AUTH_ROUTES.includes(pathname);
    const inOnboardingRoute = ONBOARDING_ROUTES.includes(pathname);

    if (!session) {
      if (!inAuthRoute) router.replace('/(auth)/welcome');
      return;
    }

    if (profileLoading || !profile) return;

    if (!profile.onboarding_completed_at) {
      if (!inOnboardingRoute) router.replace('/(onboarding)/preferences');
    } else if (inAuthRoute || inOnboardingRoute || pathname === '/') {
      router.replace('/(tabs)/dashboard');
    }
  }, [minTimeElapsed, authLoading, session, profileLoading, profile, pathname, router]);
}
