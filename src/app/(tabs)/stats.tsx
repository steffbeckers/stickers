import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { ProgressRing } from '../../components/ProgressRing';
import { Bar } from '../../components/Bar';
import { StickerArt } from '../../components/StickerArt';
import { SectionHeader } from '../../components/SectionHeader';
import { HScroll } from '../../components/HScroll';
import { colors, shadows } from '../../constants/theme';

export default function StatsScreen() {
  const { stats, groupStat } = useStore();
  const WC = useMemo(() => getStickerData(), []);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const swaps = useMemo(() => stats.swaps.slice().sort((a, b) => b.count - a.count), [stats.swaps]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 116 }}>

      <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 34, color: colors.ink }}>Stats</Text>
      </View>

      {/* hero */}
      <View style={[ss.hero, shadows.md]}>
        <ProgressRing percent={stats.percent} size={86} stroke={9} color={colors.pitch} track="rgba(255,255,255,0.16)">
          <Text style={{ fontFamily: 'Anton', fontSize: 25, color: '#fff' }}>
            {Math.floor(stats.percent)}<Text style={{ fontSize: 12 }}>%</Text>
          </Text>
        </ProgressRing>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
            Total progress
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 34, color: '#fff' }}>{stats.distinct}</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>/ {stats.total}</Text>
          </View>
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
            {stats.missing} still missing
          </Text>
        </View>
      </View>

      {/* stat boxes */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingBottom: 22 }}>
        {([
          { value: stats.distinct,  label: 'Collected', color: colors.pitchDeep },
          { value: stats.missing,   label: 'Missing',   color: colors.blue },
          { value: stats.dupeTotal, label: 'Spares',    color: colors.magenta },
        ] as const).map(b => (
          <View key={b.label} style={[ss.statBox, shadows.sm]}>
            <Text style={{ fontFamily: 'Anton', fontSize: 26, color: b.color }}>{b.value}</Text>
            <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.muted, marginTop: 2 }}>
              {b.label}
            </Text>
          </View>
        ))}
      </View>

      {/* completion by group */}
      <SectionHeader title="Completion by group" />
      <View style={[ss.groupList, shadows.sm]}>
        {WC.groups.map((g, i) => {
          const st = groupStat(g.letter);
          return (
            <TouchableOpacity key={g.letter}
              onPress={() => router.push({ pathname: '/(tabs)/album', params: { letter: g.letter } })}
              activeOpacity={0.7}
              style={[ss.groupRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.lineSoft }]}>
              <Text style={{ fontFamily: 'Anton', fontSize: 17, width: 22, color: colors.ink }}>{g.letter}</Text>
              <View style={{ flex: 1 }}>
                <Bar percent={st.percent} height={7} color={st.percent === 100 ? colors.pitch : colors.pitchDeep} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted, width: 38, textAlign: 'right' }}>
                {st.percent}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 22 }} />

      {/* swaps */}
      <SectionHeader title={`Your swaps · ${stats.dupeTotal}`} />
      {swaps.length > 0 ? (
        <HScroll>
          {swaps.map(({ s: sticker, count }) => (
            <TouchableOpacity key={sticker.n} onPress={() => router.push(`/sticker/${sticker.n}`)}
              activeOpacity={0.8} style={{ width: 96 }}>
              <View style={{ width: '100%', aspectRatio: 0.74, borderRadius: 12, overflow: 'hidden',
                borderWidth: 2, borderColor: colors.magenta }}>
                <StickerArt s={sticker} owned />
              </View>
              <View style={{ position: 'absolute', top: -7, right: -7, minWidth: 24, height: 24, borderRadius: 12,
                backgroundColor: colors.magenta, borderWidth: 2, borderColor: colors.bg,
                alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>×{count}</Text>
              </View>
              <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: colors.inkSoft, marginTop: 6 }}>
                {sticker.type === 'player' ? sticker.name : (sticker.sub || sticker.name)}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.magenta }}>{count} spare</Text>
            </TouchableOpacity>
          ))}
        </HScroll>
      ) : (
        <View style={[ss.emptySwaps, shadows.sm]}>
          <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 13, fontWeight: '600' }}>
            No duplicate stickers yet.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const ss = StyleSheet.create({
  hero:      { marginHorizontal: 18, marginBottom: 16, borderRadius: 22, padding: 18, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', gap: 18 },
  statBox:   { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 13 },
  groupList: { marginHorizontal: 18, marginBottom: 22, backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6 },
  groupRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  emptySwaps: { marginHorizontal: 18, padding: 24, backgroundColor: colors.surface, borderRadius: 16 },
});
