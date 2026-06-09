import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { colors, fonts, shadows } from '../../constants/theme';

const TAB_ITEMS = [
  { key: 'index',  icon: 'home',  label: 'Home'  },
  { key: 'album',  icon: 'album', label: 'Album' },
  { key: 'scan',   icon: 'scan',  label: 'Scan'  },
  { key: 'stats',  icon: 'stats', label: 'Stats' },
] as const;

function MaterialTabBar({ state, navigation }: any) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start',
      paddingTop: 10, paddingBottom: 22, paddingHorizontal: 8,
      backgroundColor: '#fafaf7', borderTopWidth: 1, borderTopColor: colors.lineSoft, ...shadows.sm }}>
      {TAB_ITEMS.map(item => {
        const isScan = item.key === 'scan';
        const tabIdx = state.routes.findIndex((r: any) => r.name === item.key);
        const active = !isScan && tabIdx === state.index;

        const onPress = () => {
          if (isScan) { router.push('/scan'); return; }
          const event = navigation.emit({ type: 'tabPress', target: state.routes[tabIdx]?.key, canPreventDefault: true });
          if (!event.defaultPrevented) navigation.navigate(item.key);
        };

        return (
          <TouchableOpacity key={item.key} onPress={onPress} activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 }}>
            <View style={{ width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
              backgroundColor: active ? 'rgba(22,179,100,0.2)' : 'transparent' }}>
              <Icon name={item.icon} size={22} strokeWidth={active ? 2.5 : 2}
                color={active ? colors.pitchDark : colors.inkSoft} />
            </View>
            <Text style={{ fontSize: 11.5, fontWeight: active ? '700' : '600', fontFamily: fonts.ui,
              color: active ? colors.ink : colors.muted }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <MaterialTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="album" />
      <Tabs.Screen name="stats" />
    </Tabs>
  );
}
