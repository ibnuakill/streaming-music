import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/song_tile.dart';
import '../../data/datasources/yt_remote.dart';
import '../library/library_provider.dart';
import '../player/player_provider.dart';

final homeProvider = FutureProvider((_)=>YtRemote().home());

class _PilihanCepat extends ConsumerWidget {
  final dynamic lib;
  const _PilihanCepat({required this.lib});
  @override Widget build(BuildContext context, WidgetRef ref){
    final stats = (lib.stats as Map);
    final history = (lib.history as List);
    List<Map> pool=[];
    for(final e in stats.entries){
      final v=e.value as Map;
      pool.add({'videoId':e.key, 'title':v['title']??'', 'artist':v['artist']??'', 'subtitle':v['artist']??'', 'thumbnail':v['thumbnail'], 'plays':v['plays']??0});
    }
    for(final h in history){
      if(!pool.any((p)=>p['videoId']==h['videoId'])) pool.add({...Map<String,dynamic>.from(h), 'plays':1});
    }
    if(pool.isEmpty) return const SizedBox();
    pool.sort((a,b)=> (b['plays'] as int).compareTo(a['plays'] as int));
    final habitDj = pool.where((e)=>(e['title']??'').toString().toLowerCase().contains('dj')).isNotEmpty;
    List<Map> picks = pool.take(8).toList();
    if(habitDj){
      final djs = pool.where((e)=>(e['title']??'').toString().toLowerCase().contains('dj')).take(4).toList();
      final rest = pool.where((e)=>!(e['title']??'').toString().toLowerCase().contains('dj')).take(4).toList();
      picks = [...djs, ...rest];
      picks.shuffle();
      picks.sort((a,b){
        final ad=(a['title']??'').toString().toLowerCase().contains('dj')?1:0;
        final bd=(b['title']??'').toString().toLowerCase().contains('dj')?1:0;
        return bd.compareTo(ad);
      });
    } else {
      final top=[...picks];
      top.shuffle();
      picks = top;
    }
    final player=ref.read(playerProvider.notifier);
    String playsLabel(int n){ if(n>=1000000) return '${(n/1000000).toStringAsFixed(n%1000000==0?0:1)} jt pemutaran'; if(n>=1000) return '${(n/1000).toStringAsFixed(0)} rb x ditonton'; return '$n x ditonton'; }
    return Padding(padding: const EdgeInsets.fromLTRB(16,8,16,0), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children:[
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children:[
        const Text('Pilihan cepat', style:TextStyle(color:Colors.white, fontSize:18, fontWeight:FontWeight.w800)),
        OutlinedButton(style: OutlinedButton.styleFrom(side: const BorderSide(color:Colors.white24), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal:14, vertical:6), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))), onPressed:(){ if(picks.isEmpty) return; player.play(Map<String,dynamic>.from(picks.first), queue:picks.map((e)=>Map<String,dynamic>.from(e)).toList(), idx:0); context.push('/player');}, child: const Text('Putar semua', style:TextStyle(fontSize:12))),
      ]),
      const SizedBox(height:8),
      ...picks.map((it)=> InkWell(onTap:(){ player.play(Map<String,dynamic>.from(it), queue:picks.map((e)=>Map<String,dynamic>.from(e)).toList(), idx:picks.indexOf(it)); context.push('/player');}, child: Padding(padding: const EdgeInsets.symmetric(vertical:6), child: Row(children:[
        ClipRRect(borderRadius: BorderRadius.circular(4), child: it['thumbnail']!=null ? Image.network(it['thumbnail'], width:56, height:56, fit:BoxFit.cover, errorBuilder:(_,__,___)=>Container(color: const Color(0xFF222), width:56, height:56)) : Container(color: const Color(0xFF222), width:56, height:56, child: const Icon(Icons.music_note, color:Colors.white))),
        const SizedBox(width:12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children:[
          Text(it['title']??'', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.white, fontSize:14, fontWeight:FontWeight.w600)),
          const SizedBox(height:2),
          Text('${it['artist']??it['subtitle']??''} • ${playsLabel(it['plays'] as int)}', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.grey, fontSize:12)),
        ])),
        IconButton(icon: const Icon(Icons.more_vert, color:Colors.white, size:20), onPressed:(){
          showModalBottomSheet(context: context, backgroundColor: const Color(0xFF121212), shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))), builder: (_)=> SafeArea(child: Column(mainAxisSize: MainAxisSize.min, children:[
            ListTile(leading: const Icon(Icons.play_arrow, color:Colors.white), title: const Text('Putar berikutnya', style:TextStyle(color:Colors.white)), onTap:(){ Navigator.pop(context); player.queueAdd(Map<String,dynamic>.from(it), next:true); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Ditambahkan: putar berikutnya')));}),
            ListTile(leading: const Icon(Icons.queue_music, color:Colors.white), title: const Text('Tambah ke antrean', style:TextStyle(color:Colors.white)), onTap:(){ Navigator.pop(context); player.queueAdd(Map<String,dynamic>.from(it)); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Ditambahkan ke antrean')));}),
            const SizedBox(height:8),
          ])));
        }),
      ])))),
    ]));
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});
  String _greet(){ final h=DateTime.now().hour; if(h<12) return 'Selamat pagi'; if(h<15) return 'Selamat siang'; if(h<19) return 'Selamat sore'; return 'Selamat malam';}
  @override
  Widget build(BuildContext context, WidgetRef ref){
    final home=ref.watch(homeProvider);
    final lib=ref.watch(libraryProvider);
    final player=ref.read(playerProvider.notifier);
    return Scaffold(backgroundColor: Colors.black, body: home.when(
      loading:()=>const Center(child: CircularProgressIndicator(color: Color(0xFF1DB954))),
      error:(e,_ )=>Center(child: Column(mainAxisSize:MainAxisSize.min, children:[Text(e.toString().contains('502')||e.toString().contains('503')?'Server sibuk (502/503) — coba lagi':'$e', textAlign:TextAlign.center, style:const TextStyle(color:Colors.white)), const SizedBox(height:8), FilledButton(onPressed:()=>ref.refresh(homeProvider), style: FilledButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black), child: const Text('Coba lagi'))])),
      data:(d){
        final sections=(d['sections'] as List? ?? []);
        final history = lib.history.take(10).toList();
        return CustomScrollView(slivers:[
          SliverToBoxAdapter(child: SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: Row(children:[Expanded(child: Column(crossAxisAlignment:CrossAxisAlignment.start, children:[const Text('MUSERA', style:TextStyle(color:Color(0xFF1DB954), fontSize:12, fontWeight:FontWeight.w700, letterSpacing:1)), Text(_greet(), style:const TextStyle(color:Colors.white, fontSize:22, fontWeight:FontWeight.w800)), const Text('Rekomendasi khusus untuk kamu', style:TextStyle(color:Colors.grey, fontSize:12))])), CircleAvatar(backgroundColor: const Color(0xFF1DB954), child: IconButton(icon: const Icon(Icons.person, color:Colors.black), onPressed:()=>context.go('/profile')))])))),
          SliverToBoxAdapter(child: _PilihanCepat(lib: lib)),
          if(history.isNotEmpty) SliverToBoxAdapter(child: SectionCarousel(title:'▶ Putar lagi', items: history, onTap:(it){ player.play(Map<String,dynamic>.from(it)); context.push('/player');})),
          if(lib.fav.isNotEmpty) SliverToBoxAdapter(child: SectionCarousel(title:'❤ Disukai', items: lib.fav.take(10).toList(), onTap:(it){ player.play(Map<String,dynamic>.from(it)); context.push('/player');})),
          SliverList.builder(itemCount: sections.length, itemBuilder:(_,i){ final s=sections[i]; return SectionCarousel(title:s['title']??'', items:(s['items'] as List? ?? []), onTap:(it){ if(it['videoId']!=null){ player.play(Map<String,dynamic>.from(it)); context.push('/player');} else if(it['browseId']!=null) context.push('/browse/${Uri.encodeComponent(it['browseId'])}');});}),
        ]);
      }
    ));
  }
}
