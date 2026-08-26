// Backend config – default Vercel prod, override via EXPO_PUBLIC_API_URL for local dev
// Usage: npm start with EXPO_PUBLIC_API_URL=http://192.168.1.x:3000 expo start
// For Android emulator: http://10.0.2.2:3000 ; for physical device via adb: adb reverse tcp:3000 tcp:3000

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://richmusic.vercel.app';

export const API = (path) => `${API_BASE}${path}`;
