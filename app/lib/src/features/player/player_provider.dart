import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_session/audio_session.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../data/datasources/yt_remote.dart';
import '../../data/datasources/library_local.dart';
import 'audio_handler.dart';
import 'package:flutter/foundation.dart';

class PlayerState {
  final List<Map> queue;
  final int index;
  final bool playing;
  final bool shuffle;
  final int repeat;
  final Duration pos;
  final Duration dur;
  final bool loading;
  final String? error;
  const PlayerState(
      {this.queue = const [],
      this.index = -1,
      this.playing = false,
      this.shuffle = false,
      this.repeat = 0,
      this.pos = Duration.zero,
      this.dur = Duration.zero,
      this.loading = false,
      this.error});
  Map? get current =>
      (index >= 0 && index < queue.length) ? queue[index] : null;
  PlayerState copyWith(
          {List<Map>? queue,
          int? index,
          bool? playing,
          bool? shuffle,
          int? repeat,
          Duration? pos,
          Duration? dur,
          bool? loading,
          String? error}) =>
      PlayerState(
          queue: queue ?? this.queue,
          index: index ?? this.index,
          playing: playing ?? this.playing,
          shuffle: shuffle ?? this.shuffle,
          repeat: repeat ?? this.repeat,
          pos: pos ?? this.pos,
          dur: dur ?? this.dur,
          loading: loading ?? this.loading,
          error: error);
}

class PlayerNotifier extends StateNotifier<PlayerState> {
  AudioPlayer get _player {
    try {
      return audioHandler.player;
    } catch (e) {
      debugPrint('⚠️ FALLBACK PLAYER DIPAKAI, audioHandler error: $e');
      return _fallback;
    }
  }

  final AudioPlayer _fallback = AudioPlayer();
  AudioPlayer get _p => _player;
  final _yt = YtRemote();
  PlayerNotifier() : super(const PlayerState()) {
    _init();
  }
  Future<void> _init() async {
    try {
      final s = await AudioSession.instance;
      await s.configure(const AudioSessionConfiguration.music());
    } catch (_) {}
    _p.positionStream.listen((p) => state = state.copyWith(pos: p));
    _p.durationStream
        .listen((d) => state = state.copyWith(dur: d ?? Duration.zero));
    _p.playerStateStream.listen((s) {
      if (s.processingState == ProcessingState.completed) {
        if (state.repeat == 2)
          _p.seek(Duration.zero).then((_) => _p.play());
        else
          next();
      }
      state = state.copyWith(
          playing: s.playing,
          loading: s.processingState == ProcessingState.loading ||
              s.processingState == ProcessingState.buffering);
    });
    _p.playbackEventStream
        .listen((_) {}, onError: (_) => state = state.copyWith(loading: false));
  }

  Future<void> play(Map song, {List<Map>? queue, int? idx}) async {
    List<Map> q = queue ?? [song];
    int i = idx ?? q.indexWhere((e) => e['videoId'] == song['videoId']);
    if (i < 0) i = 0;
    state = state.copyWith(queue: q, index: i, loading: true, error: null);
    libraryLocal.setHistory([
      song,
      ...libraryLocal.history.where((e) => e['videoId'] != song['videoId'])
    ].take(100).toList());
    _load(song['videoId']);
    if (q.length <= i + 1) _prefetchRadio(song['videoId']);
  }

  Future<void> _load(String videoId) async {
    final song = state.current ??
        state.queue
            .firstWhere((e) => e['videoId'] == videoId, orElse: () => {});
    try {
      if (await Permission.notification.isDenied)
        await Permission.notification.request();
    } catch (_) {}
    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        final m = await _yt.audio(videoId);
        final url = m['url'] as String?;
        if (url == null || url.isEmpty) throw Exception('no url');
        try {
          await audioHandler.setMediaItem(Map<String, dynamic>.from(song));
        } catch (_) {}
        await _p.setAudioSource(AudioSource.uri(Uri.parse(url)), preload: true);
        _p.play();
        state = state.copyWith(error: null);
        return;
      } catch (e) {
        if (attempt == 1)
          state = state.copyWith(loading: false, error: e.toString());
        else
          await Future.delayed(const Duration(milliseconds: 800));
      }
    }
  }

  Future<void> _prefetchRadio(String vid) async {
    try {
      final r = await _yt.next(vid);
      final ids = state.queue.map((e) => e['videoId']).toSet();
      final radio = ((r['queue'] as List? ?? [])
          .where((e) => e['videoId'] != null && !ids.contains(e['videoId']))
          .map((e) => Map<String, dynamic>.from(e))
          .toList());
      if (radio.isNotEmpty)
        state = state.copyWith(queue: [...state.queue, ...radio]);
    } catch (_) {}
  }

  void queueAdd(Map song, {bool next = false}) {
    if (song['videoId'] == null) return;
    final q = [...state.queue];
    if (q.isEmpty) {
      play(song);
      return;
    }
    if (next) {
      q.insert(state.index + 1, song);
    } else {
      int i = state.index + 1;
      while (i < q.length && q[i]['_user'] == true) {
        i++;
      }
      q.insert(i, song);
    }
    final updated = q.map((e) {
      final m = Map<String, dynamic>.from(e);
      if (m['videoId'] == song['videoId']) m['_user'] = true;
      return m;
    }).toList();
    state = state.copyWith(queue: updated);
  }

  void next() {
    if (state.queue.isEmpty) return;
    if (state.repeat == 2) {
      _p.seek(Duration.zero);
      return;
    }
    int ni;
    if (state.shuffle) {
      final userNext = state.queue.indexWhere(
          (e) => e['_user'] == true && state.queue.indexOf(e) > state.index);
      if (userNext >= 0)
        ni = userNext;
      else {
        final others = List.generate(state.queue.length, (i) => i)
            .where((i) => i != state.index)
            .toList();
        ni = others.isEmpty ? state.index : (others..shuffle()).first;
      }
    } else
      ni = state.index + 1;
    if (ni >= state.queue.length) {
      if (state.repeat == 1)
        ni = 0;
      else
        return;
    }
    state = state.copyWith(index: ni);
    _load(state.queue[ni]['videoId']);
  }

  void prev() {
    if (state.index > 0) {
      state = state.copyWith(index: state.index - 1);
      _load(state.queue[state.index]['videoId']);
    } else
      _p.seek(Duration.zero);
  }

  void togglePlay() => state.playing ? _p.pause() : _p.play();
  void toggleShuffle() => state = state.copyWith(shuffle: !state.shuffle);
  void toggleRepeat() => state = state.copyWith(repeat: (state.repeat + 1) % 3);
  void seek(Duration d) => _p.seek(d);
  void setQueue(List<Map> q, int i) {
    state = state.copyWith(queue: q, index: i);
    _load(q[i]['videoId']);
  }

  @override
  void dispose() {
    try {
      _p.dispose();
    } catch (_) {}
    super.dispose();
  }
}

final playerProvider =
    StateNotifierProvider<PlayerNotifier, PlayerState>((_) => PlayerNotifier());
