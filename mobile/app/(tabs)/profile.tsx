import { useState } from 'react';
import { View, Text, Image, Pressable, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/store/auth';
import { useLibrary } from '../../src/store/library';
import { useRouter } from 'expo-router';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, updateProfile, uploadAvatar } = useAuth();
  const { favorites, history, playlists } = useLibrary();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Feather name="user" size={48} color="#333" />
        <Text style={{ color: '#fff', fontWeight: '800', marginTop: 12, fontSize: 18 }}>Belum masuk</Text>
        <Text style={{ color: '#666', marginTop: 4, textAlign: 'center' }}>Masuk untuk sync playlist, favorit & history ke cloud</Text>
        <Pressable onPress={() => router.push('/(auth)/login' as any)} style={styles.primaryBtn}><Text style={styles.primaryT}>Masuk / Daftar</Text></Pressable>
        <Text style={{ color: '#333', fontSize: 10, marginTop: 16 }}>{user ? '' : 'Guest mode aktif — data lokal saja'}</Text>
      </View>
    );
  }

  const onEdit = () => {
    setName(profile?.display_name || '');
    setBio(profile?.bio || '');
    setEditing(true);
  };
  const onSave = async () => {
    const { error } = await updateProfile({ display_name: name.trim(), bio: bio.trim() });
    if (error) Alert.alert('Gagal', error.message);
    else setEditing(false);
  };
  const onPick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled) {
      const { error } = await uploadAvatar(res.assets[0].uri);
      if (error) Alert.alert('Upload gagal', String(error));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
      <View style={{ alignItems: 'center' }}>
        <Pressable onPress={onPick}>
          <Image source={{ uri: profile?.avatar_url || undefined }} style={styles.avatar} />
          <View style={styles.cam}><Feather name="camera" size={14} color="#fff" /></View>
        </Pressable>
        {!editing ? (
          <>
            <Text style={styles.name}>{profile?.display_name || user.email?.split('@')[0]}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {!!profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            <Pressable onPress={onEdit} style={styles.editBtn}><Feather name="edit-2" size={14} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Edit profil</Text></Pressable>
          </>
        ) : (
          <View style={{ width: '100%', marginTop: 12 }}>
            <TextInput value={name} onChangeText={setName} placeholder="Nama tampilan" placeholderTextColor="#666" style={styles.input} />
            <TextInput value={bio} onChangeText={setBio} placeholder="Bio" placeholderTextColor="#666" style={[styles.input, { height: 70, textAlignVertical: 'top' }]} multiline />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Pressable onPress={() => setEditing(false)} style={[styles.btn, { backgroundColor: '#222' }]}><Text style={{ color: '#fff' }}>Batal</Text></Pressable>
              <Pressable onPress={onSave} style={[styles.btn, { backgroundColor: '#1DB954' }]}><Text style={{ color: '#000', fontWeight: '800' }}>Simpan</Text></Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statN}>{playlists.length}</Text><Text style={styles.statL}>Playlist</Text></View>
        <View style={styles.stat}><Text style={styles.statN}>{favorites.length}</Text><Text style={styles.statL}>Favorit</Text></View>
        <View style={styles.stat}><Text style={styles.statN}>{history.length}</Text><Text style={styles.statL}>History</Text></View>
      </View>

      <Pressable onPress={() => { Alert.alert('Keluar?', 'Yakin mau logout?', [{ text: 'Batal' }, { text: 'Keluar', style: 'destructive', onPress: signOut }]); }} style={styles.logout}>
        <Feather name="log-out" size={16} color="#ff5555" /><Text style={{ color: '#ff5555', fontWeight: '700' }}>Keluar</Text>
      </Pressable>
      <Text style={{ color: '#333', fontSize: 10, textAlign: 'center', marginTop: 12 }}>ID: {user.id.slice(0, 8)}… • Cloud sync aktif (Supabase)</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 },
  primaryBtn: { backgroundColor: '#1DB954', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 18 },
  primaryT: { color: '#000', fontWeight: '800' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#222' },
  cam: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#1DB954', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  email: { color: '#999', fontSize: 12, marginTop: 2 },
  bio: { color: '#aaa', marginTop: 8, textAlign: 'center' },
  editBtn: { flexDirection: 'row', gap: 6, backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 10, alignItems: 'center' },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#222', marginTop: 8 },
  btn: { flex: 1, padding: 12, borderRadius: 20, alignItems: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 18, backgroundColor: '#111', borderRadius: 12, padding: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statN: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statL: { color: '#666', fontSize: 11, marginTop: 2 },
  logout: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 18, borderWidth: 1, borderColor: '#331111', padding: 12, borderRadius: 12 },
});
