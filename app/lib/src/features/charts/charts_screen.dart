import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/widgets/song_tile.dart';
import '../../data/datasources/yt_remote.dart';
import '../player/player_provider.dart';
import 'package:go_router/go_router.dart';
final chartsProvider=FutureProvider((_)=>YtRemote().charts());
class ChartsScreen extends ConsumerWidget { const ChartsScreen({super.key}); @override Widget build(BuildContext context, WidgetRef ref){ final d=ref.watch(chartsProvider); return Scaffold(backgroundColor: Colors.black, appBar: AppBar(backgroundColor: Colors.black, title: const Text('Charts')), body: d.when(loading:()=>const Center(child: CircularProgressIndicator(color:Color(0xFF1DB954))), error:(e,_)=>Center(child: Text('$e', style:const TextStyle(color:Colors.white))), data:(m){ final secs=(m['sections'] as List? ?? []); return ListView(children: secs.map((s)=>SectionCarousel(title:s['title']??'', items:(s['items'] as List? ?? []), onTap:(it){ if(it['videoId']!=null){ ref.read(playerProvider.notifier).play(Map<String,dynamic>.from(it)); context.push('/player');} else if(it['browseId']!=null) context.push('/browse/${Uri.encodeComponent(it['browseId'])}');})).toList());}));}}
