import React from 'react';
import { View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  percent: number;
  height?: number;
  color?: string;
  track?: string;
  radius?: number;
}

export function Bar({ percent, height = 7, color = colors.pitchDeep, track = 'rgba(0,0,0,0.08)', radius = 99 }: Props) {
  const w = `${Math.max(2, Math.min(100, percent))}%` as `${number}%`;
  return (
    <View style={{ height, backgroundColor: track, borderRadius: radius, overflow: 'hidden', width: '100%' }}>
      <View style={{ height, width: w, backgroundColor: color, borderRadius: radius }} />
    </View>
  );
}
