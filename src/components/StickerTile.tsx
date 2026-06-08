import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { StickerArt } from './StickerArt';
import { Icon } from './Icon';
import type { Sticker } from '../types';
import { colors, shadows } from '../constants/theme';

interface Props {
  s: Sticker;
  owned: boolean;
  count?: number;
  onPress?: () => void;
}

export function StickerTile({ s, owned, count = 0, onPress }: Props) {
  const label = s.type === 'player' ? s.name : (s.sub || s.name);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flexDirection: 'column' }}>
      <View style={{ position: 'relative', width: '100%', aspectRatio: 0.74, borderRadius: 13,
        backgroundColor: '#fff', ...(owned ? shadows.sm : {}) }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 13, overflow: 'hidden' }}>
          <StickerArt s={s} owned={owned} />
        </View>
        {owned && count > 1 && (
          <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 22, height: 22, paddingHorizontal: 5,
            borderRadius: 11, backgroundColor: colors.magenta, borderWidth: 2, borderColor: '#fff',
            alignItems: 'center', justifyContent: 'center', ...shadows.sm }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>×{count}</Text>
          </View>
        )}
      </View>
      <View style={{ marginTop: 6, paddingLeft: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 12, color: owned ? colors.ink : colors.faint }}>{s.n}</Text>
          {owned && <Icon name="check" size={11} strokeWidth={3.2} color={colors.pitchDeep} />}
        </View>
        <Text numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '600', marginTop: 1,
          color: owned ? colors.inkSoft : colors.faint }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
