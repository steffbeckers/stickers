import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

interface Props {
  tone?: string;
  size?: number;
  id?: string;
}

export function PortraitGhost({ tone = 'rgba(255,255,255,0.28)', size = 64, id = 'default' }: Props) {
  const clipId = `pg-${id}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <ClipPath id={clipId}>
          <Rect width="64" height="64" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`} fill={tone}>
        <Circle cx="32" cy="25" r="12.5" />
        <Path d="M9 64c0-13 10.5-21 23-21s23 8 23 21z" />
      </G>
    </Svg>
  );
}
