import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View, Text, Image, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ytApi } from '../../src/api/yt';
import { usePlayer } from '../../src/store/player';

export default function Browse() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const decoded = decodeURIComponent(String(id || ''));
  const router = useRouter();
  const playSong = usePlayer((s) => s.playSong);

  const { data, isLoading } = useQuery({ queryKey: ['browse', decoded], queryFn: () => ytApi.browse(decoded) });

  if (isLoading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1DB954" /></View>;

  const { header, tracks, sections } = data || {};

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
      {header && (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Image source={{ uri: header.thumbnail || undefined }} style={{ width: 180, height: 180, borderRadius: 8, backgroundColor: '#222' }} />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12, textAlign: 'center' }}>{header.title}</Text>
          <Text style={{ color: '#999', marginTop: 4, textAlign: 'center' }}>{header.subtitle}</Text>
        </View>
      )}

      {tracks?.length ? (
        <View style={{ paddingHorizontal: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Tracks</Text>
          {tracks.map((t: any, i: number) => (
            <Pressable key={t.videoId + i} onPress={() => { playSong({ videoId: t.videoId, title: t.title, artist: t.artist || t.subtitle, thumbnail: t.thumbnail }, tracks, i); router.push('/player'); }} style={{ flexDirection: 'row', paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: '#666', width: 24 }}>{i + 1}</Text>
              <Image source={{ uri: t.thumbnail || undefined }} style={{ width: 48, height: 48, borderRadius: 4, backgroundColor: '#222' }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: '#fff' }} numberOfLines={1}>{t.title}</Text>
                <Text style={{ color: '#999', fontSize: 12 }}>{t.artist || t.subtitle}</Text>
              </View>
              <Text style={{ color: '#666', fontSize: 12 }}>{t.duration}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {(sections || []).map((sec: any, si: number) => (
        <View key={si} style={{ marginTop: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 12, marginBottom: 8 }}>{sec.title}</Text>
          <FlatList horizontal data={sec.items} keyExtractor={(it, idx) => (it.browseId || it.videoId || it.title) + idx} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }} renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/browse/${encodeURIComponent(item.browseId || item.videoId)}`)} style={{ width: 130, marginRight: 8 }}>
              <Image source={{ uri: item.thumbnail || undefined }} style={{ width: 130, height: 130, borderRadius: 8, backgroundColor: '#222' }} />
              <Text numberOfLines={1} style={{ color: '#fff', marginTop: 6, fontSize: 12 }}>{item.title}</Text>
            </Pressable>
          )} />
        </View>
      ))}
    </ScrollView>
  );
}
