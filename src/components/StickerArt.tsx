import React from 'react';
import { Text, View } from 'react-native';
import { PortraitGhost } from './PortraitGhost';
import { Icon } from './Icon';
import { Crest } from './Crest';
import type { Sticker } from '../types';
import { colors } from '../constants/theme';

interface Props {
  s: Sticker;
  owned: boolean;
}

export function StickerArt({ s, owned }: Props) {
  if (!owned) {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f1f3f7',
        alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#b0bdb6' }}>{s.n}</Text>
        <Text style={{ fontFamily: 'Roboto', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#b0bdb6', fontWeight: '700' }}>
          Missing
        </Text>
      </View>
    );
  }

  const bg = s.colors[0] ?? '#888';

  if (s.type === 'badge') {
    const badgeBg = s.colors[0] || '#888';
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: badgeBg, alignItems: 'center', justifyContent: 'center' }}>
        <Crest team={{ colors: s.colors, code: s.code }} size={48} radius={11} />
      </View>
    );
  }

  if (s.type === 'legend') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#14141a', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="star" size={34} fill={colors.gold} color={colors.gold} />
      </View>
    );
  }

  if (s.type === 'stadium') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="pin" size={30} strokeWidth={2.2} color="#fff" />
      </View>
    );
  }

  if (s.type === 'photo') {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg }}>
        <View style={{ position: 'absolute', bottom: 6, left: 6, right: 6, flexDirection: 'row', gap: 2 }}>
          {[0,1,2,3,4].map(i => (
            <View key={i} style={{ flex: 1, maxWidth: 9 }}>
              <PortraitGhost size={28} id={`photo-${s.n}-${i}`} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // player
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bg, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: '14%' }}>
        <PortraitGhost />
      </View>
      {s.shirt != null && (
        <Text style={{ position: 'absolute', top: 5, right: 7, fontFamily: 'Anton', fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>
          {s.shirt}
        </Text>
      )}
      {s.captain && (
        <View style={{ position: 'absolute', top: 7, left: 7, width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>C</Text>
        </View>
      )}
    </View>
  );
}
