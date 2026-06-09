import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { getStickerData } from '../data/stickers';
import { Bar } from '../components/Bar';
import { Crest } from '../components/Crest';
import { FavTeamPicker } from '../components/FavTeamPicker';
import { Icon } from '../components/Icon';
import { colors, fonts, shadows } from '../constants/theme';

function SettingRow({ icon, iconColor, label, detail, onPress }: {
  icon: string; iconColor: string; label: string; detail?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={ps.settingRow}>
      <View style={[ps.settingIcon, { backgroundColor: `${iconColor}22` }]}>
        <Icon name={icon} size={17} strokeWidth={2.4} color={iconColor} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink, fontFamily: fonts.ui }}>{label}</Text>
      {detail && <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>{detail}</Text>}
      <Icon name="chevron" size={16} strokeWidth={2.4} color={colors.faint} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, auth, favoriteTeam, teamStat } = useStore();
  const WC = React.useMemo(() => getStickerData(), []);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [picking, setPicking] = useState(false);

  if (!user) return null;

  const fav = favoriteTeam ? WC.teams[favoriteTeam] : null;
  const favStat = fav ? teamStat(fav.id) : null;
  const displayName = user.email?.split('@')[0] ?? 'Collector';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* back bar */}
      <View style={[ps.backBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={ps.iconBtn}>
          <Icon name="back" size={20} strokeWidth={2.6} color={colors.inkSoft} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.inkSoft, fontFamily: fonts.ui }}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 44 }}>
        {/* identity */}
        <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 22 }}>
          <View style={ps.avatarRing}>
            <View style={ps.avatar}>
              <Icon name="sparkle" size={48} color={colors.pitch} />
            </View>
          </View>
          <Text style={{ fontFamily: 'Anton', fontSize: 27, color: colors.ink, marginTop: 14 }}>{displayName}</Text>
          <View style={[ps.providerBadge, shadows.sm]}>
            <Icon name="star" size={14} strokeWidth={2} color={colors.inkSoft} />
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.muted, fontFamily: fonts.ui }}>
              Signed in with Google
            </Text>
          </View>
        </View>

        {/* favorite team */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <Text style={ps.sectionTitle}>Favorite team</Text>
        </View>
        <View style={{ marginHorizontal: 18, marginBottom: 24 }}>
          {fav && favStat ? (
            <View style={[ps.favCard, shadows.sm]}>
              <View style={[ps.favBanner, { backgroundColor: fav.colors[0] }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flex: 1 }}>
                  <Crest team={fav} size={50} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Anton', fontSize: 23, color: '#fff' }}>{fav.name}</Text>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Group {fav.group}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPicking(true)} activeOpacity={0.8}
                    style={{ height: 32, paddingHorizontal: 13, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)',
                      alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 12.5, color: colors.ink, fontFamily: fonts.ui }}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push(`/team/${fav.id}`)} activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 7 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, flex: 1 }}>Your collection</Text>
                    <Text style={{ fontSize: 12.5, fontWeight: '800', color: favStat.complete ? colors.pitchDeep : colors.inkSoft }}>
                      {favStat.own}/{favStat.total}
                    </Text>
                  </View>
                  <Bar percent={favStat.percent} height={7} color={favStat.complete ? colors.pitch : colors.pitchDeep} />
                </View>
                <Icon name="chevron" size={17} strokeWidth={2.4} color={colors.faint} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setPicking(true)} activeOpacity={0.8}
              style={[ps.chooseTeam, shadows.sm]}>
              <Icon name="plus" size={18} strokeWidth={2.6} color={colors.pitchDeep} />
              <Text style={{ fontWeight: '700', fontSize: 14.5, color: colors.pitchDeep, fontFamily: fonts.ui }}>
                Choose your team
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* settings */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <Text style={ps.sectionTitle}>Settings</Text>
        </View>
        <View style={[ps.settingGroup, shadows.sm]}>
          <SettingRow icon="lock"  iconColor={colors.blue}   label="Account & security" detail="Google" />
          <View style={ps.divider} />
          <SettingRow icon="bolt"  iconColor={colors.amber}  label="Notifications"      detail="On" />
          <View style={ps.divider} />
          <SettingRow icon="swap"  iconColor={colors.magenta} label="Swap preferences" />
        </View>
        <View style={[ps.settingGroup, shadows.sm]}>
          <SettingRow icon="share"   iconColor={colors.pitchDeep} label="Invite friends" />
          <View style={ps.divider} />
          <SettingRow icon="star"    iconColor={colors.gold}       label="Rate Stickerbook" />
          <View style={ps.divider} />
          <SettingRow icon="sparkle" iconColor={colors.blue}       label="What's new" />
        </View>

        {/* sign out */}
        <View style={{ paddingHorizontal: 18 }}>
          <TouchableOpacity onPress={() => auth.signOut()} activeOpacity={0.8} style={[ps.signOut, shadows.sm]}>
            <Icon name="x" size={17} strokeWidth={2.8} color={colors.magenta} />
            <Text style={{ fontWeight: '800', fontSize: 14.5, color: colors.magenta, fontFamily: fonts.ui }}>Sign out</Text>
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.faint, marginTop: 16 }}>
            Stickerbook '26 · v1.0 · Android
          </Text>
        </View>
      </ScrollView>

      {picking && (
        <FavTeamPicker
          current={favoriteTeam}
          onPick={id => { auth.setFavoriteTeam(id); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      )}
    </View>
  );
}

const ps = StyleSheet.create({
  backBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 8 },
  iconBtn:      { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  avatarRing:   { padding: 4, borderRadius: 999, backgroundColor: colors.pitchDeep, ...shadows.md },
  avatar:       { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  providerBadge:{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, backgroundColor: colors.surface },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase', color: colors.ink, fontFamily: fonts.ui },
  favCard:      { borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface },
  favBanner:    { padding: 16 },
  chooseTeam:   { height: 64, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  settingGroup: { marginHorizontal: 18, marginBottom: 16, backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' },
  settingRow:   { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, paddingHorizontal: 14 },
  settingIcon:  { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  divider:      { height: 1, backgroundColor: colors.lineSoft, marginLeft: 59 },
  signOut:      { height: 50, borderRadius: 15, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
