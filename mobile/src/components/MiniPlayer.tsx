import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePlayer } from '../store/player';

export default function MiniPlayer() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const togglePlaying = usePlayer((s) => s.togglePlaying);
  const nextTrack = usePlayer((s) => s.nextTrack);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const router = useRouter();
  const pathname = usePathname();

  const song = queue[index] || current;
  if (!song) return null;
  if (pathname === '/player') return null;

  const pct = duration ? Math.min(1, Math.max(0, position / duration)) : 0;

  return (
    <View style={styles.wrapOuter}>
      <Pressable onPress={() => router.push('/player')} style={styles.wrap}>
        <Image source={{ uri: song.thumbnail || undefined }} style={styles.art} />
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>{song.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{song.artist || ''}</Text>
        </View>
        <Pressable onPress={(e) => { e.stopPropagation(); togglePlaying(); }} style={styles.btn}>
          <Feather name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
        </Pressable>
        <Pressable onPress={(e) => { e.stopPropagation(); nextTrack(); }} style={styles.btn}>
          <Feather name="skip-forward" size={20} color="#fff" />
        </Pressable>
      </Pressable>
      <View style={styles.track}><View style={[styles.fill, { width: `${pct * 100}%` }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapOuter: { position: 'absolute', bottom: 60, left: 8, right: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1c1c1e', elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, zIndex: 99 },
  wrap: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  art: { width: 48, height: 48, borderRadius: 4, backgroundColor: '#333' },
  meta: { flex: 1, marginLeft: 10, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 13, fontWeight: '700' },
  artist: { color: '#aaa', fontSize: 11, marginTop: 2 },
  btn: { padding: 10, marginLeft: 2 },
  track: { height: 2, backgroundColor: '#333' },
  fill: { height: 2, backgroundColor: '#1DB954' },
});
