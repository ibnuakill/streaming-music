import { View, Text, FlatList, Image, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibrary } from '../../src/store/library';
import { usePlayer } from '../../src/store/player';
import { useRouter } from 'expo-router';

export default function Library() {
  const insets = useSafeAreaInsets();
  const { favorites, playlists, history } = useLibrary();
  const playSong = usePlayer((s) => s.playSong);
  const router = useRouter();

  const renderSong = ({ item }: any) => (
    <Pressable onPress={() => { playSong(item); router.push('/player'); }} style={{ flexDirection: 'row', padding: 8, alignItems: 'center' }}>
      <Image source={{ uri: item.thumbnail || undefined }} style={{ width: 52, height: 52, borderRadius: 4, backgroundColor: '#222' }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: '#fff' }} numberOfLines={1}>{item.title}</Text>
        <Text style={{ color: '#999', fontSize: 12 }}>{item.artist || item.subtitle}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 12, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Favorites ({favorites.length})</Text>
      {favorites.length === 0 ? <Text style={{ color: '#666', marginBottom: 16 }}>No favorites yet – heart a song</Text> : <FlatList data={favorites} keyExtractor={(i) => i.videoId} renderItem={renderSong} scrollEnabled={false} />}

      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 }}>History ({history.length})</Text>
      <FlatList data={history.slice(0, 20)} keyExtractor={(i, idx) => i.videoId + idx} renderItem={renderSong} scrollEnabled={false} />

      <Text style={{ color: '#666', fontSize: 12, marginTop: 16 }}>Playlists: {playlists.length} • Stored locally on device (AsyncStorage)</Text>
    </ScrollView>
  );
}
