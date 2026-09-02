import { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlayer } from '../src/store/player';
import { useLibrary } from '../src/store/library';
import { ytApi } from '../src/api/yt';
import { useQuery } from '@tanstack/react-query';

const W = Dimensions.get('window').width;
function parseDuration(s: string): number {
  if (!s) return 0;
  const parts = String(s).trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}
function fmt(s: number) {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { queue, index, current } = usePlayer();
  const song = queue[index] || current;
  const nextTrack = usePlayer((s) => s.nextTrack);
  const prevTrack = usePlayer((s) => s.prevTrack);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const togglePlaying = usePlayer((s) => s.togglePlaying);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const toggleRepeat = usePlayer((s) => s.toggleRepeat);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const isLoading = usePlayer((s) => s.isLoading);
  const error = usePlayer((s) => s.error);
  const seekTo = usePlayer((s) => s.seekTo as any);
  const playSong = usePlayer((s) => s.playSong);
  const toggleFav = useLibrary((s) => s.toggleFav);
  const isFav = useLibrary((s) => s.isFav(song?.videoId));
  const playlists = useLibrary((s) => s.playlists);
  const addToPlaylist = useLibrary((s) => s.addToPlaylist);
  const [showLyrics, setShowLyrics] = useState(false);
  const [plModal, setPlModal] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);

  const { data: nextData } = useQuery({
    queryKey: ['next', song?.videoId],
    queryFn: () => ytApi.next(song.videoId),
    enabled: !!song?.videoId,
  });
  const durationSec = parseDuration(song?.duration || '');
  const { data: lyrics, isFetching: lyricsLoading } = useQuery({
    queryKey: ['lyrics', song?.videoId, song?.title, song?.artist, durationSec, nextData?.lyricsBrowseId],
    queryFn: () => ytApi.lyrics(song.title, song.artist || '', durationSec, nextData?.lyricsBrowseId || ''),
    enabled: !!song?.videoId && !!song?.title,
    staleTime: 1000 * 60 * 10,
  });
  const hasLyrics = !!(lyrics?.synced || lyrics?.plain);
  const lyricsText = lyrics?.synced ? lyrics.synced.replace(/\[.*?\]/g, '').trim() : (lyrics?.plain || '').trim();
  const effDuration = duration > 0 ? duration : (durationSec > 0 ? durationSec : 0);
  const sliderMax = effDuration > 0 ? effDuration : 100;
  const sliderVal = effDuration > 0 ? Math.min(position, effDuration) : position;

  if (!song) return <View style={[styles.center, { paddingTop: insets.top }]}><Text style={{ color: '#fff' }}>No song</Text></View>;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.hBtn}><Feather name="chevron-down" size={24} color="#fff" /></Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.hTop}>PLAYING FROM PLAYLIST</Text>
          <Text style={styles.hTitle} numberOfLines={1}>{queue.length > 1 ? `Antrian • ${queue.length}` : 'Musera'}</Text>
        </View>
        <Pressable onPress={() => setShowQueue(!showQueue)} style={styles.hBtn}><Feather name="more-vertical" size={20} color="#fff" /></Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.artWrap}>
          <Image source={{ uri: song.thumbnail || undefined }} style={styles.art} />
          {isLoading && <View style={styles.loading}><Text style={{ color: '#fff', fontWeight: '700' }}>● Loading</Text></View>}
        </View>

        <View style={styles.infoRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
          </View>
          <Pressable onPress={() => toggleFav(song)} hitSlop={10}>
            <Feather name="heart" size={22} color={isFav ? '#1DB954' : '#fff'} style={isFav ? { opacity: 1 } : { opacity: 0.9 }} />
          </Pressable>
        </View>

        {error && <Text style={styles.error}>⚠️ {error}</Text>}

        <View style={styles.progressWrap}>
          <Slider
            style={{ width: '100%', height: 28 }}
            minimumValue={0}
            maximumValue={sliderMax}
            value={seeking ? seekVal : sliderVal}
            onSlidingStart={(v) => { setSeeking(true); setSeekVal(v); }}
            onValueChange={(v) => { if (seeking) setSeekVal(v); }}
            onSlidingComplete={(v) => { setSeeking(false); seekTo?.(v); }}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#fff"
            disabled={effDuration === 0}
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{fmt(seeking ? seekVal : position)}</Text>
            <Text style={styles.time}>{effDuration > 0 ? fmt(effDuration) : '--:--'}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={toggleShuffle} style={[styles.cSmall, shuffle && styles.cActive]}>
            <MaterialIcons name="shuffle" size={20} color={shuffle ? '#1DB954' : '#fff'} />
          </Pressable>
          <Pressable onPress={prevTrack} style={styles.cMid}><Feather name="skip-back" size={28} color="#fff" /></Pressable>
          <Pressable onPress={togglePlaying} style={styles.playBtn}>
            <Feather name={isPlaying ? 'pause' : 'play'} size={32} color="#000" style={isPlaying ? {} : { marginLeft: 3 }} />
          </Pressable>
          <Pressable onPress={nextTrack} style={styles.cMid}><Feather name="skip-forward" size={28} color="#fff" /></Pressable>
          <Pressable onPress={toggleRepeat} style={[styles.cSmall, repeat !== 0 && styles.cActive]}>
            <MaterialIcons name={repeat === 2 ? 'repeat-one' : 'repeat'} size={20} color={repeat !== 0 ? '#1DB954' : '#fff'} />
          </Pressable>
        </View>

        <View style={styles.bottomBar}>
          <Pressable onPress={() => setPlModal(true)} style={styles.bBtn}><Feather name="plus-circle" size={18} color="#fff" /><Text style={styles.bText}>Playlist</Text></Pressable>
          <Pressable onPress={() => setShowLyrics(!showLyrics)} style={[styles.bBtn, showLyrics && { backgroundColor: '#1DB954' }]}>
            <Feather name="align-left" size={16} color={showLyrics ? '#000' : '#fff'} /><Text style={[styles.bText, showLyrics && { color: '#000' }]}>Lirik</Text>
          </Pressable>
          <Pressable onPress={() => setShowQueue(!showQueue)} style={styles.bBtn}><Feather name="list" size={18} color="#fff" /><Text style={styles.bText}>Antrian</Text></Pressable>
        </View>

        {plModal && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tambah ke playlist</Text>
            {playlists.length === 0 ? <Text style={styles.muted}>Belum ada playlist — buat di Library</Text> : playlists.map((pl: any) => (
              <Pressable key={pl.id} onPress={async () => { await addToPlaylist(pl.id, song); setPlModal(false); }} style={styles.plRow}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{pl.name}</Text><Text style={styles.muted}>{pl.tracks.length} lagu</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setPlModal(false)} style={styles.closeBtn}><Text style={{ color: '#fff', fontWeight: '700' }}>Tutup</Text></Pressable>
          </View>
        )}

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Antrian • {queue.length > 1 ? queue.length - index - 1 : 0} berikutnya</Text>
            <Pressable onPress={() => setShowQueue(!showQueue)}><Feather name={showQueue ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" /></Pressable>
          </View>
          {showQueue ? (
            queue.length > 1 ? queue.slice(index + 1, index + 11).map((q: any, i: number) => (
              <Pressable key={q.videoId + i} onPress={() => playSong(q, queue, index + 1 + i)} style={styles.qRow}>
                <Image source={{ uri: q.thumbnail || undefined }} style={styles.qArt} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 13 }} numberOfLines={1}>{q.title}</Text>
                  <Text style={styles.muted} numberOfLines={1}>{q.artist} {q.duration ? `• ${q.duration}` : ''}</Text>
                </View>
                <Feather name="play" size={14} color="#1DB954" />
              </Pressable>
            )) : <Text style={styles.muted}>Putar lagu — antrian radio otomatis akan muncul di sini</Text>
          ) : <Text style={styles.muted}>Tap ▲ untuk lihat antrian</Text>}
        </View>

        {showLyrics && (
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.cardTitle}>Lirik {lyrics?.source ? `· ${lyrics.source}` : ''}</Text>
              {hasLyrics && <Text style={styles.badge}>{lyrics.synced ? 'Synced' : 'Plain'}</Text>}
            </View>
            {lyricsLoading ? <Text style={styles.muted}>Mencari lirik…</Text> : hasLyrics ? <Text style={styles.lyrics}>{lyricsText.slice(0, 4000)}</Text> : <Text style={styles.muted}>Lirik tidak ditemukan.</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  hBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  hTop: { color: '#fff', fontSize: 10, letterSpacing: 1.2, fontWeight: '700', opacity: 0.8 },
  hTitle: { color: '#fff', fontSize: 12, fontWeight: '700', maxWidth: W * 0.5, textAlign: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  artWrap: { width: W - 48, height: W - 48, borderRadius: 8, overflow: 'hidden', backgroundColor: '#111', alignSelf: 'center', marginTop: 12 },
  art: { width: '100%', height: '100%', backgroundColor: '#222' },
  loading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, width: '100%' },
  title: { color: '#fff', fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  artist: { color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 15 },
  error: { color: '#ff5555', marginTop: 8, fontSize: 12, alignSelf: 'flex-start' },
  progressWrap: { width: '100%', marginTop: 14 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 8, paddingHorizontal: 4 },
  cSmall: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', opacity: 0.9 },
  cMid: { padding: 6 },
  cActive: { opacity: 1 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 22, gap: 10 },
  bBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 20 },
  bText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: { width: '100%', marginTop: 16, backgroundColor: '#121212', borderRadius: 12, padding: 14 },
  cardTitle: { color: '#fff', fontWeight: '800', marginBottom: 8 },
  muted: { color: '#777', fontSize: 12 },
  badge: { color: '#1DB954', fontSize: 11, fontWeight: '800', backgroundColor: 'rgba(29,185,84,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  lyrics: { color: '#e6e6e6', lineHeight: 22, fontSize: 14 },
  plRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#222' },
  closeBtn: { alignSelf: 'center', marginTop: 10, backgroundColor: '#222', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  qRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  qArt: { width: 48, height: 48, borderRadius: 4, backgroundColor: '#222' },
});
