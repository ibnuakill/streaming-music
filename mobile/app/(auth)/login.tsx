import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/store/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuth((s) => s.signIn);
  const router = useRouter();

  const onLogin = async () => {
    if (!email || !pass) return Alert.alert('Isi email & password');
    setLoading(true);
    const { error } = await signIn(email.trim(), pass);
    setLoading(false);
    if (error) Alert.alert('Login gagal', error.message);
    else router.replace('/(tabs)');
  };

  return (
    <View style={styles.c}>
      <Text style={styles.logo}>MUSERA</Text>
      <Text style={styles.sub}>Masuk untuk sync playlist & favorit</Text>
      <TextInput placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput placeholder="Password" placeholderTextColor="#666" value={pass} onChangeText={setPass} secureTextEntry style={styles.input} />
      <Pressable onPress={onLogin} disabled={loading} style={[styles.btn, loading && { opacity: 0.6 }]}><Text style={styles.btnT}>{loading ? '...' : 'Masuk'}</Text></Pressable>
      <Pressable onPress={() => router.push('/(auth)/register' as any)}><Text style={{ color: '#1DB954', marginTop: 16, textAlign: 'center' }}>Belum punya akun? Daftar</Text></Pressable>
      <Pressable onPress={() => router.replace('/(tabs)')}><Text style={{ color: '#666', marginTop: 12, textAlign: 'center' }}>L lanjut sebagai tamu</Text></Pressable>
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
