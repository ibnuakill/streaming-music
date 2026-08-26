import { create } from 'zustand';

// Port of public/app.js Player state + queue logic
export const usePlayer = create((set, get) => ({
  queue: [],
  index: -1,
  current: null,
  shuffle: false,
  repeat: 0, // 0 none, 1 all, 2 one
  speed: 1,
  hq: false,
  sbEnabled: true,
  lyricsBrowseId: null,
  relatedBrowseId: null,

  get currentSong() {
    const { queue, index } = get();
    return queue[index] || null;
  },

  playSong: (song, queue = null, index = null) => {
    if (!song?.videoId) return;
    if (queue) {
      let idx = index ?? queue.findIndex((q) => q.videoId === song.videoId);
      if (!Number.isFinite(idx) || idx < 0) idx = 0;
      set({ queue: queue.map((q) => ({ ...q, _user: false })), index: idx, current: queue[idx] });
    } else {
      set({ queue: [{ ...song, _user: false }], index: 0, current: song });
    }
  },

  queueSong: (song, playNext = false) =>
    set((s) => {
      if (!song?.videoId) return s;
      const item = { ...song, _user: true };
      if (!s.current && !s.queue.length) return { queue: [item], index: 0, current: item };
      if (!playNext && s.queue.some((q, i) => i > s.index && q._user && q.videoId === song.videoId)) return s;
      const q = [...s.queue];
      if (playNext) q.splice(s.index + 1, 0, item);
      else {
        let i = s.index + 1;
        while (i < q.length && q[i]._user) i++;
        q.splice(i, 0, item);
      }
      return { queue: q };
    }),

  nextTrack: () =>
    set((s) => {
      if (!s.queue.length) return s;
      if (s.repeat === 2) return s; // handled by player seek
      let ni;
      if (s.shuffle) {
        const userNext = s.queue.findIndex((q, i) => i > s.index && q._user);
        if (userNext >= 0) ni = userNext;
        else {
          const others = s.queue.map((_, i) => i).filter((i) => i !== s.index);
          if (!others.length) ni = s.repeat === 1 ? s.index : s.index;
          else ni = others[Math.floor(Math.random() * others.length)];
        }
      } else ni = s.index + 1;
      if (ni >= s.queue.length) {
        if (s.repeat === 1) ni = 0;
        else return s;
      }
      return { index: ni, current: s.queue[ni] };
    }),

  prevTrack: () =>
    set((s) => {
      if (s.index > 0) return { index: s.index - 1, current: s.queue[s.index - 1] };
      return s;
    }),

  removeQueued: (i) =>
    set((s) => {
      if (i === s.index || i < 0 || i >= s.queue.length) return s;
      const q = [...s.queue];
      q.splice(i, 1);
      let idx = s.index;
      if (i < s.index) idx--;
      return { queue: q, index: idx, current: q[idx] || null };
    }),

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () => set((s) => ({ repeat: (s.repeat + 1) % 3 })),
  setSpeed: (v) => set({ speed: v }),
  setHq: (v) => set({ hq: v }),
}));
