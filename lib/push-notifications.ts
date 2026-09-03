import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Controls how a notification is presented while the app is in the
// foreground — without this, foreground notifications are silently
// swallowed on iOS.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Flow E (docs/02_User_Flow.md): renewal reminders are sent by a scheduled
// Edge Function, which needs somewhere to send them — this fetches an Expo
// push token (if permission is already granted) and saves it to
// profiles.push_token.
//
// Expo Go no longer supports registering for *remote* push notifications
// (deprecated starting SDK 53) — this will throw there. Only a custom dev
// client or a production/TestFlight build can get a real token; that's a
// platform limitation, not a bug in this function.
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  } catch {
    // See platform-limitation note above — not fatal.
  }
}
