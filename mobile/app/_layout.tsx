import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Audio } from 'expo-av';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useLibrary } from '../src/store/library';
import { useAuth } from '../src/store/auth';
import GlobalAudio from '../src/components/GlobalAudio';
import BackgroundNotification from '../src/components/BackgroundNotification';
import PermissionGate from '../src/components/PermissionGate';

const qc = new QueryClient();

export default function RootLayout() {
  const loadAll = useLibrary((s) => s.loadAll);
  const initAuth = useAuth((s) => s.init);

  useEffect(() => {
    loadAll();
    initAuth();
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeAndroid: 1,
    }).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <GlobalAudio />
        <BackgroundNotification />
        <PermissionGate />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#000' },
            headerTintColor: '#fff',
            contentStyle: { backgroundColor: '#000' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
          <Stack.Screen name="browse/[id]" options={{ title: 'Browse', headerBackTitle: 'Back' }} />
          <Stack.Screen name="player" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
