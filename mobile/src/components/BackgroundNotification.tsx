import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { usePlayer } from '../store/player';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false } as any),
});

export default function BackgroundNotification() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const song = queue[index] || current;

  useEffect(() => {
    Notifications.setNotificationCategoryAsync('playback', [
      { identifier: 'PREV', buttonTitle: '⏮', options: { opensAppToForeground: false } },
      { identifier: 'PAUSE', buttonTitle: isPlaying ? '⏸' : '▶', options: { opensAppToForeground: false } },
      { identifier: 'NEXT', buttonTitle: '⏭', options: { opensAppToForeground: false } },
    ]).catch(() => {});

    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const id = res.actionIdentifier;
      if (id === 'PREV') usePlayer.getState().prevTrack();
      else if (id === 'NEXT') usePlayer.getState().nextTrack();
      else if (id === 'PAUSE') usePlayer.getState().togglePlaying();
    });
    return () => sub.remove();
  }, [isPlaying]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    Notifications.setNotificationChannelAsync('musera-playback', {
      name: 'Musera Playback',
      importance: Notifications.AndroidImportance.MAX,
      sound: null,
      vibrationPattern: [0],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!song?.videoId) return;
    const show = async () => {
      try {
        await Notifications.dismissAllNotificationsAsync().catch(() => {});
        await Notifications.scheduleNotificationAsync({
          content: {
            title: song.title,
            body: song.artist || 'Musera • Streaming',
            sticky: true,
            autoDismiss: false,
            categoryIdentifier: 'playback',
            data: { videoId: song.videoId },
          },
          trigger: null,
        });
      } catch {}
    };
    show();
    return () => { Notifications.dismissAllNotificationsAsync().catch(() => {}); };
  }, [song?.videoId, isPlaying]);

  return null;
}
