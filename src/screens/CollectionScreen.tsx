import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { getStickerData } from '../data/stickers';
import { Bar } from '../components/Bar';
import { Crest } from '../components/Crest';
import { Icon } from '../components/Icon';
import { StickerTile } from '../components/StickerTile';
import { colors, fonts, shadows } from '../constants/theme';

interface Props {
  kind: 'team' | 'special';
  id: string;
}

export function CollectionScreen({ kind, id }: Props) {
  const { owned } = useStore();
  const WC = useMemo(() => getStickerData(), []);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'missing' | 'got'>('all');

  let title: string, subtitle: string, bgColor: string, crestTeam: any, stickers: any[], iconName: string | null;

  if (kind === 'team') {
    const t = WC.teams[id];
    title = t.name;
    subtitle = `Group ${t.group}`;
    bgColor = t.colors[0];
    crestTeam = t;
    stickers = t.stickers;
    iconName = null;
  } else {
    const sp = WC.specials.find(s => s.title === id)!;
    title = sp.title;
    subtitle = sp.sub;
    stickers = sp.stickers;
    crestTeam = null;
    bgColor = sp.type === 'legend' ? '#b8902f' : colors.blue;
    iconName = sp.type === 'legend' ? 'star' : 'pin';
  }

  const own = stickers.filter(s => owned[s.n]).length;
  const total = stickers.length;
  const swaps = stickers.filter(s => (owned[s.n] ?? 0) > 1).length;
  const percent = total > 0 ? Math.round((own / total) * 100) : 0;

  const shown = stickers.filter(s =>
    filter === 'all' ? true : filter === 'missing' ? !owned[s.n] : !!owned[s.n],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* back bar */}
      <View style={[cs.backBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={cs.iconBtn}>
          <Icon name="back" size={20} strokeWidth={2.6} color={colors.inkSoft} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/scan')} style={cs.iconBtn}>
          <Icon name="scan" size={19} strokeWidth={2.4} color={colors.inkSoft} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* banner */}
        <View style={[cs.banner, { backgroundColor: bgColor }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {crestTeam
              ? <Crest team={crestTeam} size={56} />
              : <View style={cs.iconBox}>
                  <Icon name={iconName!} size={28}
                    fill={iconName === 'star' ? colors.gold : 'none'}
                    color={iconName === 'star' ? colors.gold : '#fff'} />
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 26, color: '#fff' }}>{title}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>{subtitle}</Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 7 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 30, color: '#fff' }}>{own}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>/ {total}</Text>
              <Text style={{ marginLeft: 'auto' as any, fontSize: 13, fontWeight: '800', color: '#fff' }}>{percent}%</Text>
            </View>
            <Bar percent={percent} height={7} color="#fff" track="rgba(255,255,255,0.28)" />
          </View>
        </View>

        {/* filter chips */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingBottom: 14 }}>
          {(['all', 'missing', 'got'] as const).map(k => {
            const active = filter === k;
            const count = k === 'all' ? total : k === 'missing' ? total - own : own;
            const label = k.charAt(0).toUpperCase() + k.slice(1);
            return (
              <TouchableOpacity key={k} onPress={() => setFilter(k)} activeOpacity={0.7}
                style={[cs.chip, active ? cs.chipActive : cs.chipInactive, !active && shadows.sm]}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', fontFamily: fonts.ui,
                  color: active ? '#fff' : colors.inkSoft }}>
                  {label} <Text style={{ opacity: 0.6 }}>{count}</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
          {swaps > 0 && (
            <View style={{ marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="swap" size={14} strokeWidth={2.6} color={colors.magenta} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.magenta }}>{swaps}</Text>
            </View>
          )}
        </View>

        {/* sticker grid */}
        <View style={cs.grid}>
          {shown.map(sticker => (
            <View key={sticker.n} style={{ width: '30%' }}>
              <StickerTile s={sticker} owned={!!owned[sticker.n]} count={owned[sticker.n] ?? 0}
                onPress={() => router.push(`/sticker/${sticker.n}`)} />
            </View>
          ))}
        </View>
        {shown.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.muted, fontSize: 13, fontWeight: '600', padding: 40 }}>
            Nothing here for this filter.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const cs = StyleSheet.create({
  backBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8, backgroundColor: colors.bg },
  iconBtn:  { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  banner:   { marginHorizontal: 14, borderRadius: 22, padding: 18, marginBottom: 16 },
  iconBox:  { width: 56, height: 56, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  chip:     { height: 32, paddingHorizontal: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipActive:   { backgroundColor: colors.ink },
  chipInactive: { backgroundColor: colors.surface },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 18 },
});
