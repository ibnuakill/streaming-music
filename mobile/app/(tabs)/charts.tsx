import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, Image, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ytApi } from '../../src/api/yt';
import { usePlayer } from '../../src/store/player';
import { useRouter } from 'expo-router';

export default function Charts() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery({ queryKey: ['charts'], queryFn: ytApi.charts });
  const playSong = usePlayer((s) => s.playSong);
  const router = useRouter();

  if (isLoading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1DB954" /></View>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
      {(data?.sections || []).map((sec, i) => (
        <View key={i} style={{ marginVertical: 12 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 16, marginBottom: 8 }}>{sec.title}</Text>
          <FlatList
            horizontal
            data={sec.items}
            keyExtractor={(it, idx) => (it.videoId || it.browseId || it.title) + idx}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  if (item.videoId) { playSong({ videoId: item.videoId, title: item.title, artist: item.subtitle, thumbnail: item.thumbnail }); router.push('/player'); }
                  else if (item.browseId) router.push(`/browse/${encodeURIComponent(item.browseId)}`);
                }}
                style={{ width: 140, marginHorizontal: 4 }}
              >
                <Image source={{ uri: item.thumbnail || undefined }} style={{ width: 140, height: 140, borderRadius: 8, backgroundColor: '#222' }} />
                <Text numberOfLines={1} style={{ color: '#fff', marginTop: 6 }}>{item.title}</Text>
                <Text numberOfLines={1} style={{ color: '#999', fontSize: 11 }}>{item.subtitle}</Text>
              </Pressable>
            )}
          />
        </View>
      ))}
    </ScrollView>
  );
}
