import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Crest } from './Crest';
import { Icon } from './Icon';
import { getStickerData } from '../data/stickers';
import { colors, fonts, shadows } from '../constants/theme';

interface Props {
  current: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
}

export function FavTeamPicker({ current, onPick, onClose }: Props) {
  const WC = getStickerData();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const teams = Object.values(WC.teams).filter(t =>
    !query || t.name.toLowerCase().includes(query) || t.code.toLowerCase().includes(query),
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(12,16,14,0.55)' }} onPress={onClose} activeOpacity={1} />
      <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, maxHeight: '82%', ...shadows.md }}>
        <View style={{ width: 40, height: 5, borderRadius: 9, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 12 }} />
        <View style={{ paddingHorizontal: 18, paddingBottom: 12 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 22, color: colors.ink }}>Pick your team</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, height: 42, paddingHorizontal: 13, borderRadius: 13, marginTop: 12, backgroundColor: colors.surface, ...shadows.sm }}>
            <Icon name="search" size={18} strokeWidth={2.4} color={colors.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search 48 nations"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, fontSize: 15, fontFamily: fonts.ui, color: colors.ink }}
            />
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 28 }}>
          {teams.map(t => {
            const active = t.id === current;
            return (
              <TouchableOpacity key={t.id} onPress={() => onPick(t.id)} activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 13,
                  backgroundColor: active ? 'rgba(22,179,100,0.12)' : 'transparent' }}>
                <Crest team={t} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>{t.name}</Text>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: colors.muted }}>Group {t.group}</Text>
                </View>
                {active && <Icon name="check" size={18} strokeWidth={3} color={colors.pitchDeep} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
