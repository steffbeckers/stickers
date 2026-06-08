import React from 'react';
import { View } from 'react-native';

interface Props {
  colors: string[];
  w?: number;
  h?: number;
  radius?: number;
}

export function FlagChip({ colors, w = 26, h = 18, radius = 4 }: Props) {
  return (
    <View style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden', flexDirection: 'row' }}>
      {colors.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  );
}
