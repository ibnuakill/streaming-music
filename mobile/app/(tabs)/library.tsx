import { useState } from 'react';
import { View, Text, FlatList, Image, Pressable, Alert, ScrollView, TextInput, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibrary } from '../../src/store/library';
import { usePlayer } from '../../src/store/player';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function Library() {
  const insets = useSafeAreaInsets();
  const { favorites, playlists, history, createPlaylist, deletePlaylist, removeFromPlaylist } = useLibrary();
  const playSong = usePlayer((s) => s.playSong);
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [openPl, setOpenPl] = useState<string | null>(null);

  const renderSong = ({ item }: any, onRemove?: () => void) => (
    <Pressable onPress={() => { playSong(item); router.push('/player'); }} style={{ flexDirection: 'row', padding: 8, alignItems: 'center' }}>
      <Image source={{ uri: item.thumbnail || undefined }} style={{ width: 52, height: 52, borderRadius: 4, backgroundColor: '#222' }} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: '#fff' }} numberOfLines={1}>{item.title}</Text>
        <Text style={{ color: '#999', fontSize: 12 }}>{item.artist || item.subtitle}</Text>
      </View>
      {onRemove && <Pressable onPress={onRemove} style={{ padding: 8 }}><Feather name="x" size={18} color="#666" /></Pressable>}
    </Pressable>
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createPlaylist(name.trim());
    setName(''); setModal(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 12, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Library</Text>
        <Pressable onPress={() => setModal(true)} style={styles.createBtn}><Feather name="plus" size={14} color="#000" /><Text style={{ color: '#000', fontWeight: '700', fontSize: 12 }}>Playlist</Text></Pressable>
      </View>

      <Text style={styles.h}>Playlists ({playlists.length})</Text>
      {playlists.length === 0 ? <Text style={styles.muted}>Belum ada playlist — buat baru di atas</Text> : playlists.map((pl: any) => (
        <View key={pl.id} style={styles.plCard}>
          <Pressable onPress={() => setOpenPl(openPl === pl.id ? null : pl.id)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{pl.name}</Text>
              <Text style={{ color: '#999', fontSize: 12 }}>{pl.tracks.length} lagu</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => { if (pl.tracks.length) { playSong(pl.tracks[0], pl.tracks, 0); router.push('/player'); } }} style={styles.playPl}><Feather name="play" size={14} color="#000" /></Pressable>
              <Pressable onPress={() => Alert.alert('Hapus playlist?', pl.name, [{ text: 'Batal' }, { text: 'Hapus', style: 'destructive', onPress: () => deletePlaylist(pl.id) }])} style={{ padding: 6 }}><Feather name="trash-2" size={16} color="#666" /></Pressable>
              <Feather name={openPl === pl.id ? 'chevron-up' : 'chevron-down'} size={18} color="#666" />
            </View>
          </Pressable>
          {openPl === pl.id && (
            <View style={{ marginTop: 8 }}>
              {pl.tracks.length === 0 ? <Text style={styles.muted}>Kosong — tambah dari Player ♥ atau Search</Text> : pl.tracks.map((t: any) => (
                <View key={t.videoId}>{renderSong({ item: t }, () => removeFromPlaylist(pl.id, t.videoId))}</View>
              ))}
            </View>
          )}
        </View>
      ))}

      <Text style={styles.h}>Favorites ({favorites.length})</Text>
      {favorites.length === 0 ? <Text style={styles.muted}>Belum ada — tap ♥ di Player</Text> : <FlatList data={favorites} keyExtractor={(i) => i.videoId} renderItem={renderSong} scrollEnabled={false} />}

      <Text style={[styles.h, { marginTop: 16 }]}>History ({history.length})</Text>
      <FlatList data={history.slice(0, 20)} keyExtractor={(i, idx) => i.videoId + idx} renderItem={renderSong} scrollEnabled={false} />

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Buat Playlist</Text>
            <TextInput placeholder="Nama playlist" placeholderTextColor="#666" value={name} onChangeText={setName} style={styles.input} autoFocus />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => setModal(false)} style={styles.cancel}><Text style={{ color: '#fff' }}>Batal</Text></Pressable>
              <Pressable onPress={handleCreate} style={styles.ok}><Text style={{ color: '#000', fontWeight: '700' }}>Buat</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  muted: { color: '#666', fontSize: 12, marginBottom: 8 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1DB954', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  plCard: { backgroundColor: '#111', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  playPl: { backgroundColor: '#1DB954', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  cancel: { paddingHorizontal: 16, paddingVertical: 8 },
  ok: { backgroundColor: '#1DB954', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
});
