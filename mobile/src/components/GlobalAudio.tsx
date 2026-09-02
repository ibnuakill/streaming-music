import { useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { usePlayer } from '../store/player';
import { useLibrary } from '../store/library';
import { ytApi } from '../api/yt';

export default function GlobalAudio() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const setPlaying = usePlayer((s) => s.setPlaying);
  const nextTrack = usePlayer((s) => s.nextTrack);
  const restart = usePlayer((s: any) => s._restart);

  const song = queue[index] || current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const loadingRef = useRef(0);

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});
    usePlayer.setState({
      seekTo: async (sec: number) => {
        if (soundRef.current) {
          try { await soundRef.current.setPositionAsync(sec * 1000); } catch {}
        }
      },
    });
  }, []);

  useEffect(() => {
    if (!song?.videoId) return;
    useLibrary.getState().pushHistory(song);
    const state = usePlayer.getState();
    if (state.queue.length <= state.index + 1) {
      ytApi.next(song.videoId).then((d: any) => {
        const cur = usePlayer.getState();
        if (cur.queue[cur.index]?.videoId !== song.videoId) return;
        const curIds = new Set(cur.queue.map((q: any) => q.videoId));
        const radio = (d.queue || [])
          .filter((q: any) => q.videoId && !curIds.has(q.videoId))
          .map((q: any) => ({ videoId: q.videoId, title: q.title, artist: q.artist, thumbnail: q.thumbnail, duration: q.duration || '', _user: false }));
        if (radio.length) usePlayer.setState({ queue: [...cur.queue, ...radio] });
      }).catch(() => {});
    }
    const loadId = ++loadingRef.current;
    let cancelled = false;

    const load = async () => {
      try {
        usePlayer.setState({ isLoading: true, error: null, position: 0, duration: 0 });
        if (soundRef.current) {
          try { await soundRef.current.unloadAsync(); } catch {}
          soundRef.current = null;
        }
        const { url } = await ytApi.audio(song.videoId);
        if (cancelled || loadId !== loadingRef.current) return;
        if (!url) throw new Error('no url');

        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, isLooping: false, progressUpdateIntervalMillis: 500 },
          (status) => {
            if (!status.isLoaded) {
              if ((status as any).error) usePlayer.setState({ error: (status as any).error, isLoading: false });
              return;
            }
            usePlayer.setState({ position: (status.positionMillis || 0) / 1000, duration: (status.durationMillis || 0) / 1000, isLoading: false });
            if ((status as any).didJustFinish) {
              const state = usePlayer.getState();
              if (state.repeat === 2) {
                soundRef.current?.setPositionAsync(0).then(() => soundRef.current?.playAsync()).catch(() => {});
              } else {
                nextTrack();
              }
            }
          }
        );
        if (cancelled || loadId !== loadingRef.current) {
          try { await sound.unloadAsync(); } catch {}
          return;
        }
        soundRef.current = sound;
        setPlaying(true);
        usePlayer.setState({ isLoading: false, error: null });
      } catch (e: any) {
        if (!cancelled) usePlayer.setState({ isLoading: false, error: e?.message || 'Gagal memuat audio' });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [song?.videoId]);

  useEffect(() => {
    if (restart) soundRef.current?.setPositionAsync(0).then(() => soundRef.current?.playAsync()).catch(() => {});
  }, [restart]);

  useEffect(() => {
    const s = soundRef.current;
    if (!s) return;
    if (isPlaying) s.playAsync().catch(() => {});
    else s.pauseAsync().catch(() => {});
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  return null;
}
