import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/store/auth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const signUp = useAuth((s) => s.signUp);
  const router = useRouter();

  const onReg = async () => {
    if (!email || !pass || !name) return Alert.alert('Lengkapi semua');
    setLoading(true);
    const { error } = await signUp(email.trim(), pass, name.trim());
    setLoading(false);
    if (error) Alert.alert('Gagal', error.message);
    else { Alert.alert('Berhasil', 'Cek email verifikasi'); router.replace('/(auth)/login' as any); }
  };

  return (
    <View style={styles.c}>
      <Text style={styles.logo}>MUSERA</Text>
      <Text style={styles.sub}>Buat akun baru</Text>
      <TextInput placeholder="Nama tampilan" placeholderTextColor="#666" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput placeholder="Password (min 6)" placeholderTextColor="#666" value={pass} onChangeText={setPass} secureTextEntry style={styles.input} />
      <Pressable onPress={onReg} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}><Text style={styles.btnT}>{loading ? '...' : 'Daftar'}</Text></Pressable>
      <Pressable onPress={() => router.replace('/(auth)/login' as any)}><Text style={{ color: '#1DB954', marginTop: 16, textAlign: 'center' }}>Sudah punya akun? Masuk</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#000', padding: 24, justifyContent: 'center' },
  logo: { color: '#1DB954', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  sub: { color: '#999', textAlign: 'center', marginTop: 6, marginBottom: 24 },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 10, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#222' },
  btn: { backgroundColor: '#1DB954', borderRadius: 24, padding: 14, marginTop: 18, alignItems: 'center' },
  btnT: { color: '#000', fontWeight: '800' },
});
