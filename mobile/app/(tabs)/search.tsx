import { useState } from 'react';
import { View, TextInput, FlatList, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ytApi } from '../../src/api/yt';
import { usePlayer } from '../../src/store/player';
import { useRouter } from 'expo-router';

export default function Search() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const router = useRouter();
  const playSong = usePlayer((s) => s.playSong);

  const { data, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => ytApi.search(query),
    enabled: !!query,
  });

  const sections = data?.sections || [];
  const flat = sections.flatMap((s) => s.items);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 12, paddingTop: insets.top + 12, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', backgroundColor: '#222', borderRadius: 8, paddingHorizontal: 12, alignItems: 'center' }}>
        <TextInput
          placeholder="What do you want to play?"
          placeholderTextColor="#888"
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => setQuery(q.trim())}
          style={{ flex: 1, color: '#fff', paddingVertical: 12 }}
          returnKeyType="search"
        />
        {isFetching && <ActivityIndicator color="#1DB954" />}
      </View>

      <FlatList
        data={flat}
        keyExtractor={(it, i) => (it.videoId || it.browseId || String(i)) + i}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.videoId) {
                playSong({ videoId: item.videoId, title: item.title, artist: item.subtitle, thumbnail: item.thumbnail, duration: item.duration || '' });
                router.push('/player');
              } else if (item.browseId) router.push(`/browse/${encodeURIComponent(item.browseId)}`);
            }}
            style={{ flexDirection: 'row', paddingVertical: 8, alignItems: 'center' }}
          >
            <Image source={{ uri: item.thumbnail || undefined }} style={{ width: 56, height: 56, borderRadius: 4, backgroundColor: '#222' }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: '#fff' }} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: '#999', fontSize: 12 }} numberOfLines={1}>{item.subtitle}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', marginTop: 32 }}>{query ? 'No results' : 'Type and press search'}</Text>}
      />
    </View>
  );
}
