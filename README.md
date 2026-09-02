# Musera

**Pemutar musik gratis** bergaya Spotify, katalog [YouTube Music](https://music.youtube.com) — sekarang **Flutter (Android/iOS/Web) + Node API**.

- **Website:** API di Vercel — `API_URL` via `.env`
- **Repo:** `ibnuakill/streaming-music` — branch `flutter` (clean), `main` (legacy RN)
- **Stack:** Flutter 3.41 + Riverpod + just_audio/audio_service + Supabase + Hive

Tanpa akun wajib. Library lokal, streaming via YouTube Music InnerTube.

---

## Arsitektur

```
musera/
├── app/                    # Flutter app (musera)
│   ├── lib/src/core/       # config, network (dio), theme, widgets
│   ├── lib/src/data/       # models, datasources (yt_remote, library_local)
│   ├── lib/src/features/   # auth, home, search, browse, charts, library, player
│   ├── lib/main.dart       # dotenv + Supabase + audio_service init + GoRouter
│   ├── .env.example        # API_URL, SUPABASE_URL, SUPABASE_ANON
│   └── android/ios/web
├── src/                    # Backend modular (Node)
│   ├── app.js              # createApp() express
│   ├── config/yt.js        # YTM CONTEXT/HEADERS
│   ├── services/yt.js      # yt(), getAudioUrl() multi-client + visitorData
│   ├── services/lyrics.js  # lyrics multi-source
│   ├── utils/parser.js     # parseSections etc
│   └── routes/             # home, search, player, browse, lyrics, misc
├── api/index.js            # Vercel entry
├── public/                 # legacy web static
├── server.js               # shim -> src/app.js
└── vercel.json
```

Branch: `main` = React Native Expo lama, `flutter` = Flutter clean (hapus `mobile_backup`, `server.js.bak`).

---

## Fitur

**Home** — salam waktu, Pilihan Cepat (habit DJ-aware), Putar lagi, Disukai, rak YT Music carousel
**Search** — suggest, filter all/songs/albums/artists/playlists, top result card
**Library** — Hive lokal: playlists, fav, history, stats (tanpa login)
**Player** — just_audio + audio_service MediaStyle notifikasi, shuffle/repeat, slider, antrian+lirik exclusive toggle (antrian default, klik lirik hide antrian), cachedNetworkImage, error 502/503 retry + 404 skip
**Auth** — Supabase `supabase_flutter`
**Lain** — go_router ShellRoute + mini_player, cached lirik per videoId, pilihan cepat plays label jt/rb

---

## Menjalankan

### Backend (Node 20+)

```bash
npm install
npm start          # http://localhost:3000
# Vercel: vercel --prod
```

### Flutter App

```bash
cd app
cp .env.example .env   # isi API_URL, SUPABASE_URL, SUPABASE_ANON
flutter pub get
flutter run            # device/emulator -d <id>

# atau via dart-define (CI)
flutter run --dart-define=API_URL=https://... --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON=...
flutter build apk --debug
```

**Env:** `app/.env` (gitignored) — jangan hardcode key di frontend. Fallback `--dart-define` didukung `AppConfig`.

**Icons/Splash:** `assets/musera-logo.png` → `dart run flutter_launcher_icons` + `dart run flutter_native_splash:create` (bg #0B0B1A)

---

## API

`GET /api/home` ` /api/charts` ` /api/moods` ` /api/search?q=&filter=` ` /api/suggest?q=` ` /api/browse?id=` ` /api/audio?videoId=` ` /api/next?videoId=` ` /api/lyrics?title=&artist=&duration=&browseId=` ` /api/sponsorblock?videoId=`

Backend `yt()` retry 3x backoff 600ms untuk 429/5xx, `dio_client` retry 2x untuk 502/503/500/429 + timeout 15/30s. `getAudioUrl` bedakan 404 UNAVAILABLE vs 503 TRANSIENT (retry) vs 502.

---

## Deploy Vercel

`vercel.json` → builds `api/index.js @vercel/node` + `public/** @vercel/static`, route `/api/(.*)` ke `api/index.js`. Set env `SUPABASE_*` di dashboard jika butuh.

---

## Lisensi

Gratis, bebas pakai. Tidak berafiliasi dengan YouTube/Google/Spotify.
