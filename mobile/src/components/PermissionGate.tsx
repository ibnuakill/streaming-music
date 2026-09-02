import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PermissionGate() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'android') return;
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status !== 'granted') setVisible(true);
      else {
        const cur = await Notifications.getPermissionsAsync();
        if (cur.status !== 'granted') setVisible(true);
      }
    })();
  }, []);

  const request = async () => {
    const res = await Notifications.requestPermissionsAsync();
    if (res.status === 'granted') {
      Alert.alert('Izin diberikan', 'Notifikasi pop-up & lockscreen kini aktif');
      setVisible(false);
    } else {
      Alert.alert('Izin ditolak', 'Buka Settings > Apps > Musera > Notifications → Allow');
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        <Text style={styles.title}>🔔 Izinkan Notifikasi</Text>
        <Text style={styles.sub}>Agar kontrol play/pause/next muncul di pop-up saat layar mati & background</Text>
        <Pressable onPress={request} style={styles.btn}><Text style={styles.btnT}>Izinkan Sekarang</Text></Pressable>
        <Pressable onPress={() => setVisible(false)}><Text style={{ color: '#666', marginTop: 8, textAlign: 'center', fontSize: 12 }}>Nanti saja</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999, padding: 12 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#333' },
  title: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sub: { color: '#999', fontSize: 12, marginTop: 4, lineHeight: 16 },
  btn: { backgroundColor: '#1DB954', borderRadius: 20, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  btnT: { color: '#000', fontWeight: '800' },
});
