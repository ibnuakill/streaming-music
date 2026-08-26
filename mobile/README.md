# Musera Mobile (Expo)

Android-only, Expo Router, backend via Vercel (default). Rebrand dari Rich Music.

## Quick start (test di HP pribadi)

1. Install deps (sekali):
```bash
cd mobile
npm install
```

2. Jalankan:
```bash
npx expo start --tunnel
# atau
npm start
```
Scan QR di HP pakai **Expo Go** (Play Store).

Backend default `https://richmusic.vercel.app`. Untuk pakai lokal:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000 npx expo start --tunnel
# Ganti 192.168.1.X dengan IP laptop. Atau pakai adb:
adb reverse tcp:3000 tcp:3000
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npx expo start
```

3. Build APK sideload (tanpa Play Store):
```bash
npm i -g eas-cli
eas build -p android --profile preview
```

## Fitur
- Home / Search / Charts / Library (AsyncStorage)
- Player via `react-native-youtube-iframe` (WebView, `allowsBackgroundMediaPlayback`)
- Background audio `expo-av` + lyrics `LRCLIB`
- Download MP3 `expo-file-system + expo-media-library` (private, jangan upload Play Store)

## Notes
- CORS sudah dienable di `../server.js` untuk `*`
- Jika YouTube pause saat background, pastikan `allowsBackgroundMediaPlayback:true` + `staysActiveInBackground:true`
