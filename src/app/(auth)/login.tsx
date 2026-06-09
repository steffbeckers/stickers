import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import { StickerArt } from '../../components/StickerArt';
import { Icon } from '../../components/Icon';
import { getStickerData } from '../../data/stickers';
import { colors, fonts } from '../../constants/theme';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
});

const FAN_TEAMS = ['BRA', 'ARG', 'FRA'] as const;
const ROTS = [-16, -4, 9];
const DYS = [18, 4, 14];

export default function LoginScreen() {
  const WC = useMemo(() => getStickerData(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fan = useMemo(() => [
    WC.teams['BRA'].stickers[4],
    WC.teams['ARG'].stickers[0],
    WC.teams['FRA'].stickers[6],
  ], [WC]);

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token returned');
      const { error: sbError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (sbError) throw sbError;
    } catch (e: any) {
      setError(e.message ?? 'Sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* brand */}
      <View style={s.brand}>
        <Text style={s.wordmark}>Stickerbook</Text>
        <View style={s.badge}><Text style={s.badgeText}>'26</Text></View>
      </View>
      <Text style={s.sub}>World Cup 2026 · 48 Nations</Text>

      {/* fanned sticker pack */}
      <View style={s.fanContainer}>
        <View style={s.fanGlow} />
        <View style={s.fanRow}>
          {fan.map((sticker, i) => (
            <View key={sticker.n} style={[s.fanCard, {
              transform: [{ rotate: `${ROTS[i]}deg` }, { translateY: DYS[i] }],
              zIndex: i === 1 ? 6 : 4,
              left: i === 0 ? 20 : i === 1 ? 90 : 160,
            }]}>
              <View style={s.fanInner}>
                <StickerArt s={sticker} owned />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* sign-in card */}
      <View style={s.card}>
        <Text style={s.headline}>Collect every{'\n'}sticker. Anywhere.</Text>
        <Text style={s.body}>
          Track your album, scan new pages and line up swaps — all {WC.total} stickers across 48 nations, synced to your account.
        </Text>

        <TouchableOpacity onPress={signIn} disabled={busy} activeOpacity={0.85} style={s.button}>
          {busy
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Icon name="sparkle" size={18} strokeWidth={2} color="#fff" />
                <Text style={s.buttonText}>Sign in with Google</Text>
              </>
          }
        </TouchableOpacity>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        <View style={s.privacy}>
          <Icon name="lock" size={13} strokeWidth={2.2} color={colors.faint} />
          <Text style={s.privacyText}>Secured by Google Sign-In</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1a3a2a' },
  brand:        { flexDirection: 'row', alignItems: 'center', gap: 9, alignSelf: 'center', marginTop: 74 },
  wordmark:     { fontFamily: 'Anton', fontSize: 30, color: '#fff' },
  badge:        { backgroundColor: colors.pitch, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  badgeText:    { fontFamily: 'Anton', fontSize: 15, color: colors.pitchDark },
  sub:          { alignSelf: 'center', fontSize: 11.5, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  fanContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fanGlow:      { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(22,179,100,0.18)' },
  fanRow:       { width: 280, height: 180, position: 'relative' },
  fanCard:      { position: 'absolute', bottom: 0 },
  fanInner:     { width: 90, height: 122, borderRadius: 12, overflow: 'hidden', borderWidth: 3, borderColor: '#fff' },
  card:         { backgroundColor: colors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  headline:     { fontFamily: 'Anton', fontSize: 30, lineHeight: 32, color: colors.ink, marginBottom: 10 },
  body:         { fontSize: 14, lineHeight: 20, color: colors.muted, marginBottom: 22 },
  button:       { height: 54, borderRadius: 15, backgroundColor: colors.pitchDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText:   { color: '#fff', fontSize: 16.5, fontWeight: '700', fontFamily: fonts.ui },
  errorText:    { color: colors.magenta, fontSize: 13, marginTop: 10, textAlign: 'center' },
  privacy:      { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 16 },
  privacyText:  { fontSize: 12, fontWeight: '600', color: colors.faint },
});
