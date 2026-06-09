import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { getStickerData } from '../data/stickers';
import { StickerArt } from '../components/StickerArt';
import { Icon } from '../components/Icon';
import { colors, fonts, shadows } from '../constants/theme';
import type { ScanResult } from '../types';

const { width: SW, height: SH } = Dimensions.get('window');
const VIEWFINDER_W = SW * 0.88;
const VIEWFINDER_H = VIEWFINDER_W * 1.42;

type Phase = 'idle' | 'scanning' | 'done' | 'error';

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { owned, actions } = useStore();
  const WC = React.useMemo(() => getStickerData(), []);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const apiOrigin: string =
    (Constants.expoConfig?.extra as any)?.apiOrigin ?? 'https://stickers.expo.app';

  const scan = useCallback(async () => {
    if (!cameraRef.current || phase === 'scanning') return;
    setPhase('scanning');
    setResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
      if (!photo?.uri) throw new Error('No photo captured');

      // resize to ≤800px wide, JPEG 0.80
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.80, format: SaveFormat.JPEG, base64: true },
      );
      if (!manipResult.base64) throw new Error('Failed to encode image');

      const response = await fetch(`${apiOrigin}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: manipResult.base64 }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error((errBody as any)?.error ?? `HTTP ${response.status}`);
      }

      const data = await response.json() as { found: number[] };
      const found = (data.found ?? []).filter(n => WC.byNumber[n]);
      const scanResult = actions.applyScan(found);
      setResult(scanResult);
      setPhase('done');
    } catch (e: any) {
      console.error('[scan]', e);
      setErrorMsg(e.message ?? 'Scan failed');
      setPhase('error');
    }
  }, [phase, apiOrigin, WC, actions]);

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setErrorMsg('');
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={[sc.permContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.pitch} size="large" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[sc.permContainer, { paddingTop: insets.top }]}>
        <Icon name="scan" size={52} strokeWidth={1.6} color={colors.muted} />
        <Text style={sc.permTitle}>Camera access needed</Text>
        <Text style={sc.permBody}>
          To scan your sticker pages, Stickerbook needs permission to use your camera.
        </Text>
        <TouchableOpacity onPress={requestPermission} activeOpacity={0.85} style={sc.permBtn}>
          <Text style={sc.permBtnText}>Grant permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 14 }}>Not now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* camera fills screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flashOn ? 'on' : 'off'}
      />

      {/* scrim */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* top scrim */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: (SH - VIEWFINDER_H) / 2, backgroundColor: 'rgba(0,0,0,0.54)' }} />
        {/* bottom scrim */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: (SH - VIEWFINDER_H) / 2 + 40, backgroundColor: 'rgba(0,0,0,0.54)' }} />
        {/* left scrim */}
        <View style={{ position: 'absolute', top: (SH - VIEWFINDER_H) / 2, left: 0, width: (SW - VIEWFINDER_W) / 2, height: VIEWFINDER_H, backgroundColor: 'rgba(0,0,0,0.54)' }} />
        {/* right scrim */}
        <View style={{ position: 'absolute', top: (SH - VIEWFINDER_H) / 2, right: 0, width: (SW - VIEWFINDER_W) / 2, height: VIEWFINDER_H, backgroundColor: 'rgba(0,0,0,0.54)' }} />
        {/* viewfinder border */}
        <View style={{
          position: 'absolute',
          top: (SH - VIEWFINDER_H) / 2,
          left: (SW - VIEWFINDER_W) / 2,
          width: VIEWFINDER_W,
          height: VIEWFINDER_H,
          borderRadius: 22,
          borderWidth: 2.5,
          borderColor: phase === 'scanning' ? colors.pitch : 'rgba(255,255,255,0.75)',
        }} />
        {/* corner ticks */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
          const isTop = pos === 'tl' || pos === 'tr';
          const isLeft = pos === 'tl' || pos === 'bl';
          return (
            <View key={pos} style={{
              position: 'absolute',
              top: isTop ? (SH - VIEWFINDER_H) / 2 - 2 : undefined,
              bottom: !isTop ? (SH - VIEWFINDER_H) / 2 - 2 : undefined,
              left: isLeft ? (SW - VIEWFINDER_W) / 2 - 2 : undefined,
              right: !isLeft ? (SW - VIEWFINDER_W) / 2 - 2 : undefined,
              width: 26,
              height: 26,
              borderTopWidth: isTop ? 4 : 0,
              borderBottomWidth: !isTop ? 4 : 0,
              borderLeftWidth: isLeft ? 4 : 0,
              borderRightWidth: !isLeft ? 4 : 0,
              borderColor: colors.pitch,
              borderTopLeftRadius: pos === 'tl' ? 6 : 0,
              borderTopRightRadius: pos === 'tr' ? 6 : 0,
              borderBottomLeftRadius: pos === 'bl' ? 6 : 0,
              borderBottomRightRadius: pos === 'br' ? 6 : 0,
            }} />
          );
        })}
      </View>

      {/* top bar */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }}>
        <TouchableOpacity onPress={() => router.back()} style={sc.topBtn}>
          <Icon name="x" size={20} strokeWidth={2.8} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Anton', fontSize: 17, color: '#fff', letterSpacing: 0.5 }}>Scan page</Text>
        <TouchableOpacity onPress={() => setFlashOn(v => !v)} style={sc.topBtn}>
          <Icon name={flashOn ? 'flash' : 'flash-off'} size={20} strokeWidth={2.2} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* guide label */}
      <Text style={{
        position: 'absolute',
        bottom: (SH - VIEWFINDER_H) / 2 - 40,
        alignSelf: 'center',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12.5,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
      }}>
        {phase === 'idle' && 'Point at a sticker page'}
        {phase === 'scanning' && 'Analysing…'}
        {phase === 'error' && 'Try again'}
        {phase === 'done' && `Found ${result?.added?.length ?? 0} new · ${result?.dupes?.length ?? 0} dupes`}
      </Text>

      {/* capture button */}
      {(phase === 'idle' || phase === 'error') && (
        <TouchableOpacity onPress={scan} activeOpacity={0.85}
          style={{ position: 'absolute', bottom: insets.bottom + 48, alignSelf: 'center', width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' }} />
        </TouchableOpacity>
      )}

      {/* scanning spinner */}
      {phase === 'scanning' && (
        <View style={{ position: 'absolute', bottom: insets.bottom + 56, alignSelf: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={colors.pitch} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Scanning…</Text>
        </View>
      )}

      {/* results sheet */}
      {phase === 'done' && result && (
        <View style={[sc.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={sc.pill} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 24, color: colors.ink }}>
              Scan complete
            </Text>
            <TouchableOpacity onPress={reset} style={sc.closeBtn}>
              <Icon name="x" size={18} strokeWidth={2.6} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>

          {/* stat row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {([
              { icon: 'check', label: 'New',   count: result.added.length,  color: colors.pitchDeep },
              { icon: 'swap',  label: 'Dupes',  count: result.dupes.length,  color: colors.magenta },
              { icon: 'album', label: 'Total',  count: result.found.length,  color: colors.blue },
            ] as const).map(b => (
              <View key={b.label} style={[sc.statPill, shadows.sm]}>
                <Icon name={b.icon} size={14} strokeWidth={2.8} color={b.color} />
                <Text style={{ fontFamily: 'Anton', fontSize: 21, color: colors.ink }}>{b.count}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: colors.muted }}>
                  {b.label}
                </Text>
              </View>
            ))}
          </View>

          {/* sticker row */}
          {result.found.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', gap: 10, paddingHorizontal: 2, paddingBottom: 4 }}>
              {result.found.map(n => {
                const s = WC.byNumber[n];
                if (!s) return null;
                const isNew = result.added.includes(n);
                return (
                  <TouchableOpacity key={n} onPress={() => { reset(); setTimeout(() => router.push(`/sticker/${n}`), 50); }}
                    activeOpacity={0.8} style={{ width: 76 }}>
                    <View style={{ width: '100%', aspectRatio: 0.74, borderRadius: 10, overflow: 'hidden', borderWidth: 2,
                      borderColor: isNew ? colors.pitchDeep : colors.magenta }}>
                      <StickerArt s={s} owned />
                    </View>
                    {isNew
                      ? <View style={[sc.newBadge, { borderColor: colors.bg }]}>
                          <Icon name="check" size={10} strokeWidth={3} color="#fff" />
                        </View>
                      : <View style={[sc.newBadge, { backgroundColor: colors.magenta, borderColor: colors.bg }]}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 10 }}>×</Text>
                        </View>
                    }
                    <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: colors.inkSoft, marginTop: 4 }}>
                      {s.type === 'player' ? s.name : (s.sub || s.name)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Icon name="search" size={32} strokeWidth={1.8} color={colors.faint} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                No stickers recognised.{'\n'}Try better lighting or a flatter page.
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={reset} activeOpacity={0.85} style={[sc.scanAgainBtn, shadows.md]}>
            <Icon name="scan" size={17} strokeWidth={2.4} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5, fontFamily: fonts.ui }}>Scan another page</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* error sheet */}
      {phase === 'error' && (
        <View style={[sc.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={sc.pill} />
          <View style={{ alignItems: 'center', padding: 16 }}>
            <Icon name="bolt" size={32} strokeWidth={2} color={colors.amber} />
            <Text style={{ fontFamily: 'Anton', fontSize: 21, color: colors.ink, marginTop: 10 }}>Scan failed</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 7, textAlign: 'center' }}>
              {errorMsg}
            </Text>
            <TouchableOpacity onPress={reset} activeOpacity={0.85} style={[sc.scanAgainBtn, shadows.md, { marginTop: 18 }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5, fontFamily: fonts.ui }}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  permContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 36, gap: 14 },
  permTitle:     { fontFamily: 'Anton', fontSize: 26, color: colors.ink, textAlign: 'center' },
  permBody:      { fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center' },
  permBtn:       { height: 52, paddingHorizontal: 28, borderRadius: 15, backgroundColor: colors.pitchDeep, alignItems: 'center', justifyContent: 'center' },
  permBtnText:   { color: '#fff', fontWeight: '800', fontSize: 16, fontFamily: fonts.ui },
  topBtn:        { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  sheet:         { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  pill:          { width: 40, height: 5, borderRadius: 9, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 10 },
  closeBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  statPill:      { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 11, gap: 2, alignItems: 'flex-start' },
  newBadge:      { position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.pitchDeep, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  scanAgainBtn:  { height: 50, marginTop: 14, borderRadius: 15, backgroundColor: colors.pitchDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
