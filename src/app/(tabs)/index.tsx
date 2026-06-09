import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { ProgressRing } from '../../components/ProgressRing';
import { Bar } from '../../components/Bar';
import { FlagChip } from '../../components/FlagChip';
import { Crest } from '../../components/Crest';
import { StickerArt } from '../../components/StickerArt';
import { SectionHeader } from '../../components/SectionHeader';
import { HScroll } from '../../components/HScroll';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

export default function HomeScreen() {
  const { stats, teamStat, groupStat, recent, owned } = useStore();
  const WC = useMemo(() => getStickerData(), []);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const almost = useMemo(() =>
    Object.values(WC.teams)
      .map(t => ({ t, st: teamStat(t.id) }))
      .filter(x => x.st.missing > 0)
      .sort((a, b) => a.st.missing - b.st.missing)
      .slice(0, 8),
  [WC, teamStat]);

  const recentStickers = useMemo(() =>
    recent.map(n => WC.byNumber[n]).filter(Boolean).slice(0, 12),
  [recent, WC]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 116 }}>

      {/* header */}
      <View style={s.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={s.wordmark}>Stickerbook</Text>
            <View style={s.badge}><Text style={s.badgeText}>'26</Text></View>
          </View>
          <Text style={s.sub}>World Cup · 48 Nations</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}
          style={[s.pillBtn, { backgroundColor: colors.ink, borderRadius: 19 }]}>
          <Icon name="sparkle" size={18} strokeWidth={2} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* hero */}
      <View style={[s.hero, shadows.md]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing percent={stats.percent} size={92} stroke={9} color="#fff" track="rgba(255,255,255,0.28)">
            <Text style={{ fontFamily: 'Anton', fontSize: 27, color: '#fff' }}>
              {Math.floor(stats.percent)}<Text style={{ fontSize: 13 }}>%</Text>
            </Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
              Album complete
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 38, color: '#fff' }}>{stats.distinct}</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>/ {stats.total}</Text>
            </View>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
              {stats.missing} stickers to go
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/scan')} style={s.scanBtn}>
          <Icon name="scan" size={19} strokeWidth={2.4} color={colors.pitchDark} />
          <Text style={{ fontWeight: '800', fontSize: 15, color: colors.pitchDark, fontFamily: fonts.ui }}>Scan a page</Text>
        </TouchableOpacity>
      </View>

      {/* stat pills */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingBottom: 22 }}>
        {([
          { icon: 'check', value: stats.distinct, label: 'Collected', color: colors.pitchDeep },
          { icon: 'album', value: stats.missing,  label: 'Missing',   color: colors.blue },
          { icon: 'swap',  value: stats.dupeTotal, label: 'Swaps',    color: colors.magenta },
        ] as const).map(p => (
          <View key={p.label} style={[s.pill, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={p.icon} size={15} strokeWidth={2.6} color={p.color} />
              <Text style={{ fontFamily: 'Anton', fontSize: 23, color: colors.ink }}>{p.value}</Text>
            </View>
            <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted }}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>

      {/* almost complete */}
      <SectionHeader title="Almost complete" action="Album" onAction={() => router.push('/(tabs)/album')} />
      <HScroll>
        {almost.map(({ t, st }) => (
          <TouchableOpacity key={t.id} onPress={() => router.push(`/team/${t.id}`)} activeOpacity={0.8}
            style={[s.almostCard, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Crest team={t} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>{t.name}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.4 }}>GROUP {t.group}</Text>
              </View>
            </View>
            <Bar percent={st.percent} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.muted }}>{st.own}/{st.total}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: colors.magenta }}>{st.missing} to go</Text>
            </View>
          </TouchableOpacity>
        ))}
      </HScroll>

      <View style={{ height: 22 }} />

      {/* group stage */}
      <SectionHeader title="Group stage" action="See all" onAction={() => router.push('/(tabs)/album')} />
      <HScroll>
        {WC.groups.map(g => {
          const gs = groupStat(g.letter);
          return (
            <TouchableOpacity key={g.letter}
              onPress={() => router.push({ pathname: '/(tabs)/album', params: { letter: g.letter } })}
              activeOpacity={0.8} style={[s.groupCard, shadows.md]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Anton', fontSize: 30, lineHeight: 30, color: '#fff' }}>{g.letter}</Text>
                <ProgressRing percent={gs.percent} size={34} stroke={4.5} color={colors.pitch} track="rgba(255,255,255,0.18)">
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>{gs.percent}</Text>
                </ProgressRing>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {g.teamIds.map(id => <FlagChip key={id} colors={WC.teams[id].colors} w={20} h={13} radius={3} />)}
              </View>
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.4 }}>
                {gs.own}/{gs.total} STICKERS
              </Text>
            </TouchableOpacity>
          );
        })}
      </HScroll>

      <View style={{ height: 22 }} />

      {/* recently added */}
      {recentStickers.length > 0 && (
        <>
          <SectionHeader title="Recently added" />
          <HScroll>
            {recentStickers.map(sticker => (
              <TouchableOpacity key={sticker.n} onPress={() => router.push(`/sticker/${sticker.n}`)}
                activeOpacity={0.8} style={{ width: 92 }}>
                <View style={{ width: '100%', aspectRatio: 0.74, borderRadius: 12, overflow: 'hidden',
                  borderWidth: 2, borderColor: '#fff', ...shadows.sm }}>
                  <StickerArt s={sticker} owned />
                </View>
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, marginTop: 5 }}>
                  {sticker.type === 'player' ? sticker.name : (sticker.sub || sticker.name)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.muted }}>
                  {sticker.teamName || sticker.special}
                </Text>
              </TouchableOpacity>
            ))}
          </HScroll>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 16 },
  wordmark:   { fontFamily: 'Anton', fontSize: 26, color: colors.ink },
  badge:      { backgroundColor: colors.pitch, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText:  { fontFamily: 'Anton', fontSize: 13, color: colors.pitchDark },
  sub:        { fontSize: 11.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginTop: 3 },
  pillBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  hero:       { marginHorizontal: 22, borderRadius: 24, padding: 20, marginBottom: 16, backgroundColor: colors.pitchDeep },
  scanBtn:    { marginTop: 16, height: 46, borderRadius: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pill:       { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 12, gap: 2 },
  almostCard: { width: 150, flexShrink: 0, backgroundColor: colors.surface, borderRadius: 18, padding: 14, gap: 11 },
  groupCard:  { width: 116, flexShrink: 0, borderRadius: 18, padding: 15, gap: 12, backgroundColor: colors.ink },
});
