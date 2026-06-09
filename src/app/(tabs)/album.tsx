import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../store';
import { getStickerData } from '../../data/stickers';
import { Bar } from '../../components/Bar';
import { Crest } from '../../components/Crest';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

export default function AlbumScreen() {
  const { teamStat, groupStat, owned: ownedMap } = useStore();
  const WC = React.useMemo(() => getStickerData(), []);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ letter?: string }>();
  const [q, setQ] = useState('');
  const [letter, setLetter] = useState(params.letter ?? 'All');

  const query = q.trim().toLowerCase();
  const matchTeam = (t: { name: string; code: string }) =>
    !query || t.name.toLowerCase().includes(query) || t.code.toLowerCase().includes(query);
  const visibleGroups = WC.groups.filter(g => letter === 'All' || g.letter === letter);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 116 }}>

      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 34, color: colors.ink }}>Album</Text>
        <TouchableOpacity onPress={() => router.push('/scan')} style={s.scanBtn}>
          <Icon name="scan" size={16} strokeWidth={2.4} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: fonts.ui }}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* search */}
      <View style={[s.searchRow, shadows.sm]}>
        <Icon name="search" size={18} strokeWidth={2.4} color={colors.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search team or sticker"
          placeholderTextColor={colors.muted}
          style={{ flex: 1, fontSize: 15, fontFamily: fonts.ui, color: colors.ink }} />
        {q ? <TouchableOpacity onPress={() => setQ('')}>
          <Icon name="x" size={16} strokeWidth={2.6} color={colors.muted} />
        </TouchableOpacity> : null}
      </View>

      {/* group letter filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 7, paddingHorizontal: 18, paddingBottom: 16 }}>
        {['All', ...WC.groupsLetters].map(L => {
          const active = letter === L;
          return (
            <TouchableOpacity key={L} onPress={() => setLetter(L)} activeOpacity={0.7}
              style={[s.letterChip, active ? s.letterActive : s.letterInactive, !active && shadows.sm]}>
              <Text style={{ fontSize: 13.5, fontWeight: '800', fontFamily: fonts.ui,
                color: active ? '#06301c' : colors.inkSoft }}>
                {L}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* group rows */}
      {visibleGroups.map(g => {
        const gs = groupStat(g.letter);
        const teams = g.teamIds.map(id => WC.teams[id]).filter(matchTeam);
        if (!teams.length) return null;
        return (
          <View key={g.letter} style={[s.groupCard, shadows.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Anton', fontSize: 26, color: colors.ink, flex: 1 }}>Group {g.letter}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>{gs.percent}%</Text>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Bar percent={gs.percent} height={5} />
            </View>
            <View style={{ paddingVertical: 6 }}>
              {teams.map((t, i) => {
                const st = teamStat(t.id);
                return (
                  <TouchableOpacity key={t.id} onPress={() => router.push(`/team/${t.id}`)} activeOpacity={0.7}
                    style={[s.teamRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.lineSoft }]}>
                    <Crest team={t} size={36} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{t.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
                        <View style={{ flex: 1, maxWidth: 120 }}>
                          <Bar percent={st.percent} height={5} color={st.complete ? colors.pitch : colors.pitchDeep} />
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted }}>{st.own}/{st.total}</Text>
                      </View>
                    </View>
                    {st.complete
                      ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Icon name="check" size={13} strokeWidth={3} color={colors.pitchDeep} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.pitchDeep }}>Done</Text>
                        </View>
                      : <Text style={{ fontSize: 11, fontWeight: '800', color: colors.magenta }}>−{st.missing}</Text>
                    }
                    <Icon name="chevron" size={16} strokeWidth={2.4} color={colors.faint} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* specials */}
      {letter === 'All' && !query && (
        <>
          <View style={{ paddingHorizontal: 18, paddingVertical: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', textTransform: 'uppercase', fontFamily: fonts.ui, color: colors.ink }}>
              Special pages
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 18 }}>
            {WC.specials.map(sp => {
              const own = sp.stickers.filter(ss => ownedMap[ss.n]).length;
              const total = sp.stickers.length;
              const isLeg = sp.type === 'legend';
              return (
                <TouchableOpacity key={sp.title}
                  onPress={() => router.push(`/special/${encodeURIComponent(sp.title)}`)}
                  activeOpacity={0.8}
                  style={[s.specialCard, shadows.md, { backgroundColor: isLeg ? '#3a3320' : colors.blue }]}>
                  <Icon name={isLeg ? 'star' : 'pin'} size={22}
                    fill={isLeg ? colors.gold : 'none'} color={isLeg ? colors.gold : '#fff'} strokeWidth={2.2} />
                  <View>
                    <Text style={{ fontFamily: 'Anton', fontSize: 15, color: '#fff' }}>{sp.title}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                      {own}/{total} collected
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scanBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 11, backgroundColor: colors.ink },
  searchRow:    { flexDirection: 'row', alignItems: 'center', gap: 9, height: 42, paddingHorizontal: 13, borderRadius: 13, marginHorizontal: 18, marginBottom: 12, backgroundColor: colors.surface },
  letterChip:   { minWidth: 38, height: 34, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  letterActive: { backgroundColor: colors.pitch },
  letterInactive: { backgroundColor: colors.surface },
  groupCard:    { marginHorizontal: 18, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' },
  teamRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 9 },
  specialCard:  { flex: 1, borderRadius: 18, padding: 16, gap: 10 },
});
