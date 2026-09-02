import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';

class MuseraHandler extends BaseAudioHandler {
  final _player = AudioPlayer();
  AudioPlayer get player => _player;
  MuseraHandler() {
    _player.playbackEventStream.map(_transform).pipe(playbackState);
    _player.playerStateStream.listen((s) {
      if (s.processingState == ProcessingState.completed) {
        playbackState.add(playbackState.value.copyWith(processingState: AudioProcessingState.completed));
      }
    });
  }
  PlaybackState _transform(PlaybackEvent e) => PlaybackState(
        controls: [MediaControl.skipToPrevious, if (_player.playing) MediaControl.pause else MediaControl.play, MediaControl.skipToNext, MediaControl.stop],
        systemActions: const {MediaAction.seek},
        androidCompactActionIndices: const [0, 1, 2],
        processingState: const {ProcessingState.idle: AudioProcessingState.idle, ProcessingState.loading: AudioProcessingState.loading, ProcessingState.buffering: AudioProcessingState.buffering, ProcessingState.ready: AudioProcessingState.ready, ProcessingState.completed: AudioProcessingState.completed}[_player.processingState]!,
        playing: _player.playing,
        updatePosition: _player.position,
        bufferedPosition: _player.bufferedPosition,
        speed: _player.speed,
        queueIndex: e.currentIndex,
      );
  Future<void> setMediaItem(Map song) async {
    final item = MediaItem(id: song['videoId'] ?? '', title: song['title'] ?? 'Unknown', artist: song['artist'] ?? song['subtitle'] ?? '', artUri: song['thumbnail'] != null ? Uri.tryParse(song['thumbnail']) : null, duration: _player.duration);
    mediaItem.add(item);
  }

  @override
  Future<void> play() => _player.play();
  @override
  Future<void> pause() => _player.pause();
  @override
  Future<void> stop() => _player.stop();
  @override
  Future<void> seek(Duration pos) => _player.seek(pos);
  @override
  Future<void> skipToNext() async {}
  @override
  Future<void> skipToPrevious() async {}
}
late MuseraHandler audioHandler;
Future<void> initAudio() async {
  audioHandler = await AudioService.init(builder: () => MuseraHandler(), config: const AudioServiceConfig(androidNotificationChannelId: 'com.musera.channel.audio', androidNotificationChannelName: 'Musera Playback', androidNotificationOngoing: true, androidStopForegroundOnPause: true));
}
