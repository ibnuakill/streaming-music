import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/datasources/yt_remote.dart';
import '../player/player_provider.dart';

class BrowseScreen extends ConsumerWidget {
  final String id;
  const BrowseScreen({super.key, required this.id});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fut = FutureProvider((_) => YtRemote().browse(Uri.decodeComponent(id)));
    final data = ref.watch(fut);
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, title: const Text('Browse')),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF1DB954))),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: Colors.white))),
        data: (m) {
          final header = m['header'];
          final tracks = (m['tracks'] as List? ?? []);
          final sections = (m['sections'] as List? ?? []);
          return ListView(children: [
            if (header != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(children: [
                  if (header['thumbnail'] != null)
                    ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(imageUrl: header['thumbnail'], width: 120, height: 120, fit: BoxFit.cover)),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(header['title'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                    Text(header['subtitle'] ?? '', style: const TextStyle(color: Colors.grey)),
                    if (tracks.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1DB954), foregroundColor: Colors.black),
                            onPressed: () {
                              ref.read(playerProvider.notifier).play(Map<String, dynamic>.from(tracks[0]),
                                  queue: tracks.map((e) => Map<String, dynamic>.from(e)).toList(), idx: 0);
                              context.push('/player');
                            },
                            icon: const Icon(Icons.play_arrow),
                            label: const Text('Play')),
                      )
                  ]))
                ]),
              ),
            ...tracks.map((t) => ListTile(
                  leading: t['thumbnail'] != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: CachedNetworkImage(imageUrl: t['thumbnail'], width: 48, height: 48, fit: BoxFit.cover))
                      : null,
                  title: Text(t['title'] ?? '', style: const TextStyle(color: Colors.white)),
                  subtitle: Text(t['subtitle'] ?? t['artist'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  trailing: Text(t['duration'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                  onTap: () {
                    ref.read(playerProvider.notifier).play(Map<String, dynamic>.from(t),
                        queue: tracks.map((e) => Map<String, dynamic>.from(e)).toList());
                    context.push('/player');
                  },
                )),
            ...sections.map((s) {
              final items = (s['items'] as List? ?? []);
              return ExpansionTile(
                title: Text(s['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                children: items
                    .map((it) => ListTile(
                          title: Text(it['title'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 14)),
                          subtitle: Text(it['subtitle'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          onTap: () {
                            if (it['videoId'] != null) {
                              ref.read(playerProvider.notifier).play(Map<String, dynamic>.from(it));
                              context.push('/player');
                            } else if (it['browseId'] != null) {
                              context.push('/browse/${Uri.encodeComponent(it['browseId'])}');
                            }
                          },
                        ))
                    .toList()
                    .cast<Widget>(),
              );
            }),
          ]);
        },
      ),
    );
  }
}
