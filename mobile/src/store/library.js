import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback if async-storage not installed – use in-memory
let Storage = AsyncStorage;
try {
  // will be installed via expo; if missing, fallback
  if (!Storage) throw new Error('no storage');
} catch {}

const KEYS = {
  fav: 'smw_fav',
  pls: 'smw_pls',
  sav: 'smw_sav',
  hist: 'smw_hist',
  stats: 'smw_stats',
  qstate: 'smw_qstate',
};

async function load(key, def) {
  try {
    const v = await Storage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
}
async function save(key, v) {
  try {
    await Storage.setItem(key, JSON.stringify(v));
  } catch {}
}

export const useLibrary = create((set, get) => ({
  favorites: [],
  playlists: [],
  saved: [],
  history: [],
  stats: {},
  _loaded: false,

  loadAll: async () => {
    const [fav, pls, sav, hist, stats] = await Promise.all([
      load(KEYS.fav, []),
      load(KEYS.pls, []),
      load(KEYS.sav, []),
      load(KEYS.hist, []),
      load(KEYS.stats, {}),
    ]);
    set({ favorites: fav, playlists: pls, saved: sav, history: hist, stats, _loaded: true });
  },

  isFav: (videoId) => get().favorites.some((s) => s.videoId === videoId),

  toggleFav: async (song) => {
    const { favorites } = get();
    const exists = favorites.some((s) => s.videoId === song.videoId);
    const next = exists ? favorites.filter((s) => s.videoId !== song.videoId) : [song, ...favorites];
    set({ favorites: next });
    await save(KEYS.fav, next);
    return !exists;
  },

  createPlaylist: async (name) => {
    const pl = { id: 'local_' + Date.now(), name, tracks: [] };
    const next = [pl, ...get().playlists];
    set({ playlists: next });
    await save(KEYS.pls, next);
    return pl;
  },

  addToPlaylist: async (pid, song) => {
    const next = get().playlists.map((p) => {
      if (p.id !== pid) return p;
      if (p.tracks.some((t) => t.videoId === song.videoId)) return p;
      return { ...p, tracks: [...p.tracks, song] };
    });
    set({ playlists: next });
    await save(KEYS.pls, next);
  },

  removeFromPlaylist: async (pid, vid) => {
    const next = get().playlists.map((p) => (p.id === pid ? { ...p, tracks: p.tracks.filter((t) => t.videoId !== vid) } : p));
    set({ playlists: next });
    await save(KEYS.pls, next);
  },

  deletePlaylist: async (pid) => {
    const next = get().playlists.filter((p) => p.id !== pid);
    set({ playlists: next });
    await save(KEYS.pls, next);
  },

  toggleSaved: async (item) => {
    const { saved } = get();
    const exists = saved.some((s) => s.browseId === item.browseId);
    const next = exists ? saved.filter((s) => s.browseId !== item.browseId) : [item, ...saved];
    set({ saved: next });
    await save(KEYS.sav, next);
    return !exists;
  },

  pushHistory: async (song) => {
    let h = get().history.filter((s) => s.videoId !== song.videoId);
    h.unshift({ ...song, playedAt: Date.now() });
    h = h.slice(0, 100);
    set({ history: h });
    await save(KEYS.hist, h);
    // stats
    const stats = { ...get().stats };
    const k = song.videoId;
    if (!stats[k]) stats[k] = { title: song.title, artist: song.artist || '', thumbnail: song.thumbnail, plays: 0, secs: 0, last: 0 };
    stats[k].plays++;
    stats[k].last = Date.now();
    set({ stats });
    await save(KEYS.stats, stats);
  },
}));
