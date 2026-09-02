import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import MiniPlayer from '../../src/components/MiniPlayer';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#121212', borderTopColor: '#222', height: 60, paddingBottom: 6, paddingTop: 6 },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} /> }} />
      <Tabs.Screen name="charts" options={{ title: 'Charts', tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: ({ color, size }) => <Feather name="music" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }} />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
