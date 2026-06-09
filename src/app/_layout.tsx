import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoreProvider, useStore } from '../store';

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { user } = useStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Anton: require('../../assets/fonts/Anton-Regular.ttf'),
    Roboto: require('../../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Bold': require('../../assets/fonts/Roboto-Bold.ttf'),
    'Roboto-Medium': require('../../assets/fonts/Roboto-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scan" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
          <Stack.Screen name="team/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="special/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="sticker/[n]" options={{ animation: 'fade', presentation: 'transparentModal' }} />
          <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style="auto" />
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
