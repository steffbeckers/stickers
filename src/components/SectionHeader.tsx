import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts } from '../constants/theme';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 12 }}>
      <Text style={{ fontFamily: fonts.ui, fontSize: 14, fontWeight: '800', letterSpacing: 0.14, textTransform: 'uppercase', color: colors.ink }}>
        {title}
      </Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontFamily: fonts.ui, fontSize: 12.5, fontWeight: '700', color: colors.pitchDeep }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
