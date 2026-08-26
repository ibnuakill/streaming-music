import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../src/store/player';
import { useLibrary } from '../src/store/library';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { ytApi } from '../src/api/yt';
import { useQuery } from '@tanstack/react-query';

const { width: WW } = Dimensions.get('window');

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { queue, index, current } = usePlayer();
  const song = queue[index] || current;
  const playSong = usePlayer((s) => s.playSong);
  const nextTrack = usePlayer((s) => s.nextTrack);
  const prevTrack = usePlayer((s) => s.prevTrack);
  const toggleFav = useLibrary((s) => s.toggleFav);
  const isFav = useLibrary((s) => s.isFav(song?.videoId));
  const [playing, setPlaying] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // Reset play state when song changes – fixes silent next track
  useEffect(() => {
    if (song?.videoId) {
      setPlaying(true);
      setYtError(null);
    }
  }, [song?.videoId]);

  // Fetch next queue + lyrics
  const { data: nextData } = useQuery({
    queryKey: ['next', song?.videoId],
    queryFn: () => ytApi.next(song.videoId),
    enabled: !!song?.videoId,
  });

  const { data: lyrics } = useQuery({
    queryKey: ['lyrics', song?.title, song?.artist],
    queryFn: () => ytApi.lyrics(song.title, song.artist || '', 0, nextData?.lyricsBrowseId || ''),
    enabled: !!song?.title,
  });

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') nextTrack();
    if (state === 'playing') setPlaying(true);
    if (state === 'paused') setPlaying(false);
    if (state === 'unstarted') setPlaying(true);
  }, [nextTrack]);

  const handleDownload = async () => {
    if (!song?.videoId || downloading) return;
    setDownloading(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) throw new Error('Permission denied');
      const start = await ytApi.downloadStart(song.videoId);
      if (!start.progressUrl) throw new Error('No progress url');
      let url: string | null = null;
      for (let i = 0; i < 60; i++) {
        if (i) await new Promise((r) => setTimeout(r, 2500));
        const p = await ytApi.downloadProgress(start.progressUrl);
        if (p.done && p.url) { url = p.url; break; }
      }
      if (!url) throw new Error('Timeout');
      const filename = `${(song.artist || 'track').replace(/[/\\?%*:|"<>]/g, '')} - ${song.title.replace(/[/\\?%*:|"<>]/g, '')}.mp3`.slice(0, 80);
      const fileUri = FileSystem.documentDirectory + filename;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Downloaded', filename);
    } catch (e: any) {
      Alert.alert('Download failed', e.message);
    } finally {
      setDownloading(false);
    }
  };

  if (!song) return <View style={[styles.center, { paddingTop: insets.top }]}><Text style={{ color: '#fff' }}>No song – play from Home/Search</Text></View>;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* YouTube player – invisible but laid out (no height:0) */}
      <View style={styles.hiddenPlayer}>
        <YoutubePlayer
          key={song.videoId}
          height={220}
          width={WW}
          videoId={song.videoId}
          play={playing}
          onChangeState={onStateChange}
          onError={(e: any) => setYtError(String(e || 'YouTube error'))}
          forceAndroidAutoplay
          webViewProps={{
            allowsBackgroundMediaPlayback: true,
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            javaScriptEnabled: true,
            domStorageEnabled: true,
          }}
          initialPlayerParams={{
            modestbranding: true,
            playsinline: 1,
            rel: 0,
            controls: 0,
          }}
        />
      </View>

      {ytError && (
        <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {ytError}</Text></View>
      )}

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: song.thumbnail || undefined }} style={[styles.art, { width: Math.min(280, WW * 0.72), height: Math.min(280, WW * 0.72) }]} />
        <Text style={styles.title}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>

        <View style={styles.controlsRow}>
          <Pressable onPress={prevTrack} style={styles.ctrlBtn}><Feather name="skip-back" size={22} color="#fff" /></Pressable>
          <Pressable onPress={() => setPlaying((p) => !p)} style={styles.playBtn}><Feather name={playing ? 'pause' : 'play'} size={24} color="#000" /></Pressable>
          <Pressable onPress={nextTrack} style={styles.ctrlBtn}><Feather name="skip-forward" size={22} color="#fff" /></Pressable>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => toggleFav(song)} style={[styles.pill, isFav && styles.pillActive]}><Feather name="heart" size={16} color={isFav ? '#000' : '#fff'} /><Text style={[styles.pillText, isFav && styles.pillTextActive]}>{isFav ? 'Favorited' : 'Favorite'}</Text></Pressable>
          <Pressable onPress={handleDownload} disabled={downloading} style={[styles.pill, downloading && { opacity: 0.5 }]}><Feather name="download" size={16} color="#fff" /><Text style={styles.pillText}>{downloading ? 'Downloading…' : 'Download MP3'}</Text></Pressable>
        </View>

        {/* Queue preview */}
        {queue.length > 1 && (
          <View style={{ width: '100%', marginTop: 24 }}>
            <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Queue ({queue.length})</Text>
            {queue.slice(index + 1, index + 6).map((q, i) => (
              <Pressable key={q.videoId + i} onPress={() => playSong(q, queue, index + 1 + i)} style={{ flexDirection: 'row', paddingVertical: 6, alignItems: 'center' }}>
                <Image source={{ uri: q.thumbnail || undefined }} style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: '#222' }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 13 }} numberOfLines={1}>{q.title}</Text>
                  <Text style={{ color: '#999', fontSize: 11 }}>{q.artist}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Lyrics */}
        <View style={{ width: '100%', marginTop: 24 }}>
          <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>Lyrics {lyrics?.source ? `· ${lyrics.source}` : ''}</Text>
          {lyrics?.synced ? (
            <Text style={{ color: '#ccc', lineHeight: 22 }}>{lyrics.synced.replace(/\[.*?\]/g, '').slice(0, 2000)}</Text>
          ) : lyrics?.plain ? (
            <Text style={{ color: '#ccc', lineHeight: 22 }}>{lyrics.plain.slice(0, 2000)}</Text>
          ) : (
            <Text style={{ color: '#666' }}>{lyrics ? 'No lyrics found' : 'Loading lyrics…'}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  hiddenPlayer: { position: 'absolute', left: -9999, top: 0, width: 1, height: 1, opacity: 0 },
  scrollContent: { padding: 16, alignItems: 'center', flexGrow: 1 },
  art: { borderRadius: 12, backgroundColor: '#222', aspectRatio: 1 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  artist: { color: '#999', marginTop: 6, textAlign: 'center' },
  controlsRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center', gap: 12 } as any,
  ctrlBtn: { backgroundColor: '#222', padding: 14, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  playBtn: { backgroundColor: '#1DB954', padding: 16, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', marginTop: 16, flexWrap: 'wrap', justifyContent: 'center', gap: 10 } as any,
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#222', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 } as any,
  pillActive: { backgroundColor: '#1DB954' },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#000' },
  errorBox: { backgroundColor: '#331111', padding: 8, margin: 12, borderRadius: 8 },
  errorText: { color: '#ff8888', fontSize: 12 },
});
