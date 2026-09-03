import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const credentialsSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi gir'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

type Mode = 'login' | 'signup';

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return;

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    const { data, error: authError } =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === 'signup' && !data.session) {
      setInfo('Hesabını onaylamak için e-postana gönderdiğimiz bağlantıya tıkla.');
    }
    // On a session being set, onAuthStateChange (lib/auth-context) picks it up
    // and lib/use-auth-gate.ts handles routing — no explicit navigation here.
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    const redirectTo = Linking.createURL('/');

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (oauthError) {
      setError(oauthError.message);
      return;
    }
    if (!data?.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      try {
        await createSessionFromUrl(result.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Giriş başarısız oldu');
      }
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="E-posta"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="Şifre"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {info ? <ThemedText style={styles.info}>{info}</ThemedText> : null}

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>{mode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
        )}
      </Pressable>

      <View style={styles.divider} />

      <Pressable style={styles.oauthButton} onPress={() => handleOAuth('google')}>
        <ThemedText style={styles.oauthButtonText}>Google ile devam et</ThemedText>
      </Pressable>
      <Pressable style={styles.oauthButton} onPress={() => handleOAuth('apple')}>
        <ThemedText style={styles.oauthButtonText}>Apple ile devam et</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  error: { color: '#D64545' },
  info: { color: '#3c87f7' },
  primaryButton: {
    backgroundColor: '#3c87f7',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: Spacing.three },
  oauthButton: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  oauthButtonText: { fontSize: 16, fontWeight: '500' },
});
