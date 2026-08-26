import { useQuery } from '@tanstack/react-query';
import { FlatList, Text, View, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ytApi } from '../../src/api/yt';
import { usePlayer } from '../../src/store/player';
import { useRouter } from 'expo-router';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['home'], queryFn: ytApi.home });
  const playSong = usePlayer((s) => s.playSong);
  const router = useRouter();

  if (isLoading) return <View style={styles.center}><ActivityIndicator color="#1DB954" /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: '#fff' }}>{String(error)}</Text><Pressable onPress={() => refetch()}><Text style={{ color: '#1DB954', marginTop: 12 }}>Retry</Text></Pressable></View>;

  const sections = data?.sections || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
      {sections.map((sec, si) => (
        <View key={si} style={{ marginVertical: 12 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 16, marginBottom: 8 }}>{sec.title}</Text>
          <FlatList
            horizontal
            data={sec.items}
            keyExtractor={(it, i) => (it.videoId || it.browseId || it.title) + i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  if (item.videoId) {
                    playSong({ videoId: item.videoId, title: item.title, artist: item.subtitle, thumbnail: item.thumbnail });
                    router.push('/player');
                  } else if (item.browseId) {
                    router.push(`/browse/${encodeURIComponent(item.browseId)}`);
                  }
                }}
                style={{ width: 140, marginHorizontal: 4 }}
              >
                <Image source={{ uri: item.thumbnail || undefined }} style={{ width: 140, height: 140, borderRadius: 8, backgroundColor: '#222' }} />
                <Text numberOfLines={1} style={{ color: '#fff', marginTop: 6, fontSize: 13 }}>{item.title}</Text>
                <Text numberOfLines={1} style={{ color: '#999', fontSize: 11 }}>{item.subtitle}</Text>
              </Pressable>
            )}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
