import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { StickerArt } from '../../components/StickerArt';
import { Crest } from '../../components/Crest';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

export default function DetailScreen() {
  const { n: nStr } = useLocalSearchParams<{ n: string }>();
  const n = Number(nStr);
  const { owned, actions } = useStore();
  const WC = React.useMemo(() => getStickerData(), []);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const s = WC.byNumber[n];
  if (!s) return null;

  const count = owned[n] ?? 0;
  const isOwned = count > 0;
  const team = s.teamId ? WC.teams[s.teamId] : null;
  const typeLabel: Record<string, string> = {
    player: s.pos ?? '',
    badge: 'Team Badge',
    photo: 'Squad Photo',
    legend: 'Legend',
    stadium: 'Host City',
  };

  const go = (delta: number) => {
    const nn = Math.min(WC.total, Math.max(1, n + delta));
    router.replace(`/sticker/${nn}` as any);
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,16,14,0.55)' }}
        onPress={() => router.back()}
      />
      <View style={[ds.sheet, { paddingBottom: insets.bottom + 32 }]}>
        <View style={ds.pill} />

        {/* number row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 16, color: colors.muted }}>
            No. {n} <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: colors.faint }}>of {WC.total}</Text>
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={ds.closeBtn}>
            <Icon name="x" size={18} strokeWidth={2.6} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* hero sticker + prev/next */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
          <TouchableOpacity onPress={() => go(-1)} disabled={n <= 1}
            style={[ds.arrowBtn, { opacity: n <= 1 ? 0.3 : 1 }]}>
            <Icon name="back" size={20} strokeWidth={2.6} color={colors.inkSoft} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 178 }}>
              <View style={[{ width: '100%', aspectRatio: 0.74, borderRadius: 18, overflow: 'hidden' }, isOwned && shadows.md]}>
                <StickerArt s={s} owned={isOwned} />
              </View>
              {count > 1 && (
                <View style={ds.countBadge}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>×{count}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => go(1)} disabled={n >= WC.total}
            style={[ds.arrowBtn, { opacity: n >= WC.total ? 0.3 : 1 }]}>
            <Icon name="chevron" size={20} strokeWidth={2.6} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* title */}
        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            {s.captain && (
              <View style={ds.captainBadge}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Captain</Text>
              </View>
            )}
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.pitchDeep }}>
              {typeLabel[s.type]}{s.shirt != null ? ` · #${s.shirt}` : ''}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Anton', fontSize: 28, color: colors.ink, textAlign: 'center' }}>{s.name}</Text>
          {s.special && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 4 }}>
              {s.special} · {s.sub}
            </Text>
          )}
        </View>

        {/* team row */}
        {team && (
          <TouchableOpacity
            onPress={() => { router.back(); setTimeout(() => router.push(`/team/${team.id}`), 50); }}
            activeOpacity={0.7} style={[ds.teamRow, shadows.sm]}>
            <Crest team={team} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{team.name}</Text>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.muted }}>Group {team.group} · View team page</Text>
            </View>
            <Icon name="chevron" size={17} strokeWidth={2.4} color={colors.faint} />
          </TouchableOpacity>
        )}

        {/* actions */}
        {!isOwned ? (
          <TouchableOpacity onPress={() => actions.add(n)} activeOpacity={0.85} style={[ds.primaryBtn, shadows.md]}>
            <Icon name="check" size={20} strokeWidth={3} color="#fff" />
            <Text style={ds.primaryBtnText}>Mark as collected</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={ds.ownedCard}>
              <Icon name="check" size={20} strokeWidth={3} color={colors.pitchDeep} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: colors.pitchDark }}>In your collection</Text>
                <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.pitchDeep }}>
                  {count > 1 ? `${count - 1} spare for swaps` : 'No spares yet'}
                </Text>
              </View>
              <View style={[ds.stepper, shadows.sm]}>
                <TouchableOpacity onPress={() => actions.remove(n)} style={ds.stepBtn}>
                  <Icon name="minus" size={16} strokeWidth={3} color={colors.inkSoft} />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Anton', minWidth: 22, textAlign: 'center', fontSize: 18, color: colors.ink }}>
                  {count}
                </Text>
                <TouchableOpacity onPress={() => actions.add(n)} style={ds.stepBtn}>
                  <Icon name="plus" size={16} strokeWidth={3} color={colors.inkSoft} />
                </TouchableOpacity>
              </View>
            </View>
            {count > 1 && (
              <View style={ds.swapBtn}>
                <Icon name="swap" size={18} strokeWidth={2.6} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14.5, fontFamily: fonts.ui }}>
                  Offer {count - 1} for swap
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  sheet:       { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  pill:        { width: 40, height: 5, borderRadius: 9, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 6 },
  closeBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  arrowBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  countBadge:  { position: 'absolute', top: -10, right: -10, minWidth: 30, height: 30, paddingHorizontal: 7, borderRadius: 15, backgroundColor: colors.magenta, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  captainBadge:{ backgroundColor: colors.ink, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  teamRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 15, backgroundColor: colors.surface, marginBottom: 14 },
  primaryBtn:  { height: 54, borderRadius: 16, backgroundColor: colors.pitchDeep, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, fontFamily: fonts.ui },
  ownedCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 15, backgroundColor: 'rgba(22,179,100,0.1)', borderWidth: 1, borderColor: 'rgba(22,179,100,0.22)' },
  stepper:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 12, padding: 4 },
  stepBtn:     { width: 32, height: 32, borderRadius: 9, backgroundColor: '#f4f4f6', alignItems: 'center', justifyContent: 'center' },
  swapBtn:     { height: 48, borderRadius: 15, backgroundColor: colors.magenta, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
