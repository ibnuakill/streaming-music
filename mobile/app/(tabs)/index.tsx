import { useQuery } from '@tanstack/react-query';
import { FlatList, Text, View, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ytApi } from '../../src/api/yt';
import { usePlayer } from '../../src/store/player';
import { useLibrary } from '../../src/store/library';
import { useAuth } from '../../src/store/auth';
import { useRouter } from 'expo-router';

function Section({ title, items, onPressItem }: any) {
  if (!items?.length) return null;
  return (
    <View style={{ marginVertical: 10 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 16, marginBottom: 8 }}>{title}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(it, i) => (it.videoId || it.browseId || it.title) + i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressItem(item)}
            style={{ width: 140, marginHorizontal: 4 }}
          >
            <Image source={{ uri: item.thumbnail || undefined }} style={{ width: 140, height: 140, borderRadius: 8, backgroundColor: '#222' }} />
            <Text numberOfLines={1} style={{ color: '#fff', marginTop: 6, fontSize: 13 }}>{item.title}</Text>
            <Text numberOfLines={1} style={{ color: '#999', fontSize: 11 }}>{item.subtitle || item.artist || ''}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['home'], queryFn: ytApi.home });
  const playSong = usePlayer((s) => s.playSong);
  const router = useRouter();
  const history = useLibrary((s) => s.history);
  const favorites = useLibrary((s) => s.favorites);
  const stats = useLibrary((s) => s.stats);
  const profile = useAuth((s) => s.profile);
  const user = useAuth((s) => s.user);

  const topHistory = history.slice(0, 10);
  const lastPlayed = history[0];

  const { data: reco } = useQuery({
    queryKey: ['home-reco', lastPlayed?.videoId],
    queryFn: () => ytApi.next(lastPlayed.videoId),
    enabled: !!lastPlayed?.videoId,
  });

  const mostPlayed = Object.entries(stats as any)
    .sort((a: any, b: any) => (b[1].plays || 0) - (a[1].plays || 0))
    .slice(0, 10)
    .map(([videoId, v]: any) => ({ videoId, title: v.title, subtitle: v.artist, thumbnail: v.thumbnail }));

  const onPressItem = (item: any) => {
    if (item.videoId) {
      playSong({ videoId: item.videoId, title: item.title, artist: item.subtitle || item.artist, thumbnail: item.thumbnail, duration: item.duration || '' });
      router.push('/player');
    } else if (item.browseId) {
      router.push(`/browse/${encodeURIComponent(item.browseId)}`);
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 19) return 'Selamat sore';
    return 'Selamat malam';
  })();

  if (isLoading) return <View style={styles.center}><ActivityIndicator color="#1DB954" /></View>;
  if (error) return <View style={styles.center}><Text style={{ color: '#fff' }}>{String(error)}</Text><Pressable onPress={() => refetch()}><Text style={{ color: '#1DB954', marginTop: 12 }}>Retry</Text></Pressable></View>;

  const sections = data?.sections || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 80 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#1DB954', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>MUSERA</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 }}>{greeting}</Text>
          <Text style={{ color: '#999', fontSize: 12, marginTop: 2 }}>Rekomendasi khusus untuk kamu</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile' as any)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#1DB954', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginLeft: 12, borderWidth: 2, borderColor: '#222' }}>
          {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: 38, height: 38 }} /> : user ? <Text style={{ color: '#000', fontWeight: '800', fontSize: 16 }}>{(profile?.display_name || user?.email || 'U')[0].toUpperCase()}</Text> : <Feather name="user" size={18} color="#000" />}
        </Pressable>
      </View>

      {topHistory.length > 0 && (
        <Section title="▶ Putar lagi" items={topHistory.map((h: any) => ({ videoId: h.videoId, title: h.title, subtitle: h.artist, thumbnail: h.thumbnail }))} onPressItem={onPressItem} />
      )}

      {mostPlayed.length > 0 && (
        <Section title="♫ Sering diputar" items={mostPlayed} onPressItem={onPressItem} />
      )}

      {favorites.length > 0 && (
        <Section title="❤ Lagu disukai" items={favorites.slice(0, 10).map((f: any) => ({ videoId: f.videoId, title: f.title, subtitle: f.artist, thumbnail: f.thumbnail }))} onPressItem={onPressItem} />
      )}

      {reco?.queue?.length > 0 && lastPlayed && (
        <Section title={`Karena kamu memutar "${lastPlayed.title.slice(0, 22)}"`} items={reco.queue.slice(0, 10).map((q: any) => ({ videoId: q.videoId, title: q.title, subtitle: q.artist, thumbnail: q.thumbnail }))} onPressItem={onPressItem} />
      )}

      {sections.map((sec: any, si: number) => (
        <Section key={si} title={sec.title} items={sec.items} onPressItem={onPressItem} />
      ))}

      {topHistory.length === 0 && mostPlayed.length === 0 && sections.length === 0 && (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <Text style={{ color: '#666', textAlign: 'center' }}>Mulai dengarkan lagu, rekomendasi akan muncul di sini seperti YT Music</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
