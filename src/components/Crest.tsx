import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  team: { colors: string[]; code: string };
  size?: number;
  radius?: number;
}

export function Crest({ team, size = 38, radius }: Props) {
  const c = team.colors;
  const r = radius ?? Math.round(size * 0.26);
  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', backgroundColor: c[0], flexShrink: 0 }}>
      {c[1] && (
        <View style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.65, height: size, backgroundColor: c[1],
          borderTopLeftRadius: size * 0.4 }} />
      )}
      {c[2] && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: size * 0.35, backgroundColor: c[2], opacity: 0.92 }} />
      )}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Anton', fontSize: size * 0.34, color: '#fff', textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
          {team.code}
        </Text>
      </View>
    </View>
  );
}
