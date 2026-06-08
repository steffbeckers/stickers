import React from 'react';
import { ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
  pad?: number;
}

export function HScroll({ children, pad = 22 }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingHorizontal: pad, paddingVertical: 2 }}
    >
      {children}
    </ScrollView>
  );
}
