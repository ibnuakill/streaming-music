import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/datasources/yt_remote.dart';
import 'player_provider.dart';
import '../library/library_provider.dart';

class PlayerScreen extends ConsumerStatefulWidget { const PlayerScreen({super.key}); @override ConsumerState<PlayerScreen> createState()=>_P();}
class _P extends ConsumerState<PlayerScreen>{
  bool _showLyrics=false, _showQueue=true;
  String fmt(Duration d){ final m=d.inMinutes; final s=d.inSeconds%60; return '$m:${s.toString().padLeft(2,'0')}';}
  final Map<String, Future<Map>> _lyricsCache = {};
  Future<Map> _fetchLyrics(Map song) {
    final vid = song['videoId'] as String? ?? '';
    if (_lyricsCache.containsKey(vid)) return _lyricsCache[vid]!;
    final f = () async {
      int dur=0; try{ final parts=(song['duration']??'').toString().split(':').map(int.tryParse).toList(); if(parts.length==2) dur=(parts[0]??0)*60+(parts[1]??0); }catch(_){}
      String browseId=''; try{ final nxt=await YtRemote().next(song['videoId']); browseId=nxt['lyricsBrowseId']??''; }catch(_){}
      return YtRemote().lyrics(song['title']??'', song['artist']??song['subtitle']??'', dur, browseId);
    }();
    _lyricsCache[vid]=f;
    return f;
  }
  void _showAddPlaylistSheet(Map song){
    final lib=ref.read(libraryProvider);
    showModalBottomSheet(context: context, backgroundColor: const Color(0xFF121212), shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))), builder: (_)=> SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children:[
      Row(children:[ClipRRect(borderRadius: BorderRadius.circular(4), child: song['thumbnail']!=null?CachedNetworkImage(imageUrl:song['thumbnail'], width:48, height:48, fit:BoxFit.cover):Container(color: const Color(0xFF222), width:48, height:48)), const SizedBox(width:12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children:[Text(song['title']??'', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.white, fontWeight:FontWeight.w700)), Text(song['artist']??'', style:const TextStyle(color:Colors.grey, fontSize:12))]))]),
      const SizedBox(height:16), const Text('Tambah ke playlist', style:TextStyle(color:Colors.white, fontWeight:FontWeight.w800)),
      const SizedBox(height:8),
      if(lib.playlists.isEmpty) const Padding(padding: EdgeInsets.symmetric(vertical:12), child:Text('Belum ada playlist — buat di Library', style:TextStyle(color:Colors.grey, fontSize:12)))
      else ...lib.playlists.map((pl)=>ListTile(title: Text(pl['name'], style:const TextStyle(color:Colors.white)), subtitle: Text('${(pl['tracks'] as List).length} lagu', style:const TextStyle(color:Colors.grey, fontSize:12)), trailing: const Icon(Icons.add, color:Colors.white), onTap:() async { await ref.read(libraryProvider.notifier).addToPlaylist(pl['id'], Map<String,dynamic>.from(song)); if(mounted) Navigator.pop(context); if(mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ditambahkan ke ${pl['name']}'))); })),
      const SizedBox(height:8),
    ]))));
  }
  @override Widget build(BuildContext context){
    final p=ref.watch(playerProvider); final song=p.current; if(song==null) return Scaffold(backgroundColor: Colors.black, appBar: AppBar(backgroundColor: Colors.black, title: const Text('Player')), body: const Center(child: Text('No song', style:TextStyle(color:Colors.white))));
    final lib=ref.watch(libraryProvider); final isFav=lib.fav.any((e)=>e['videoId']==song['videoId']);
    return Scaffold(backgroundColor: Colors.black, appBar: AppBar(backgroundColor: Colors.black, leading: IconButton(icon: const Icon(Icons.keyboard_arrow_down, color:Colors.white), onPressed:()=>Navigator.pop(context)), title: Text(p.queue.length>1?'Antrian • ${p.queue.length}':'Musera', style:const TextStyle(color:Colors.white, fontSize:12)), centerTitle:true, actions:[IconButton(icon: const Icon(Icons.more_vert, color:Colors.white), onPressed:()=>_showAddPlaylistSheet(Map<String,dynamic>.from(song)))],),
      body: SingleChildScrollView(padding: const EdgeInsets.symmetric(horizontal:24, vertical:8), child: Column(children:[
        AspectRatio(aspectRatio:1, child: ClipRRect(borderRadius: BorderRadius.circular(8), child: song['thumbnail']!=null ? CachedNetworkImage(imageUrl:song['thumbnail'], fit:BoxFit.cover, errorWidget:(_,__,___)=>Container(color: const Color(0xFF222))) : Container(color: const Color(0xFF222), child: const Icon(Icons.music_note, color:Colors.white, size:64)))),
        const SizedBox(height:22),
        Row(children:[Expanded(child: Column(crossAxisAlignment:CrossAxisAlignment.start, children:[Text(song['title']??'', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.white, fontSize:21, fontWeight:FontWeight.w800)), Text(song['artist']??song['subtitle']??'', maxLines:1, overflow:TextOverflow.ellipsis, style: TextStyle(color: Colors.white.withOpacity(0.7)))])), IconButton(icon: Icon(isFav?Icons.favorite:Icons.favorite_border, color: isFav?const Color(0xFF1DB954):Colors.white), onPressed:()=>ref.read(libraryProvider.notifier).toggleFav(Map<String,dynamic>.from(song)))]),
        if(p.error!=null) Padding(padding: const EdgeInsets.only(top:8), child: Text('⚠️ ${p.error}', style:const TextStyle(color:Colors.redAccent, fontSize:12))),
        const SizedBox(height:14),
        Slider(value: p.dur.inMilliseconds>0 ? (p.pos.inMilliseconds.clamp(0, p.dur.inMilliseconds)).toDouble() : 0, max: (p.dur.inMilliseconds>0 ? p.dur.inMilliseconds : 1).toDouble(), activeColor: Colors.white, inactiveColor: Colors.white24, onChanged: (v)=>ref.read(playerProvider.notifier).seek(Duration(milliseconds:v.toInt()))),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children:[Text(fmt(p.pos), style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize:11)), Text(p.dur.inMilliseconds>0?fmt(p.dur):'--:--', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize:11))]),
        const SizedBox(height:8),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children:[
          IconButton(icon: Icon(Icons.shuffle, color: p.shuffle?const Color(0xFF1DB954):Colors.white), onPressed:()=>ref.read(playerProvider.notifier).toggleShuffle()),
          IconButton(icon: const Icon(Icons.skip_previous, color:Colors.white, size:32), onPressed:()=>ref.read(playerProvider.notifier).prev()),
          GestureDetector(onTap:()=>ref.read(playerProvider.notifier).togglePlay(), child: Container(width:64,height:64,decoration: const BoxDecoration(color:Colors.white, shape:BoxShape.circle), child: p.loading ? const Padding(padding: EdgeInsets.all(20), child:CircularProgressIndicator(strokeWidth:2, color:Colors.black)) : Icon(p.playing?Icons.pause:Icons.play_arrow, color:Colors.black, size:36))),
          IconButton(icon: const Icon(Icons.skip_next, color:Colors.white, size:32), onPressed:()=>ref.read(playerProvider.notifier).next()),
          IconButton(icon: Icon(p.repeat==2?Icons.repeat_one:Icons.repeat, color: p.repeat!=0?const Color(0xFF1DB954):Colors.white), onPressed:()=>ref.read(playerProvider.notifier).toggleRepeat()),
        ]),
        const SizedBox(height:22),
        Row(children:[Expanded(child: OutlinedButton.icon(style: OutlinedButton.styleFrom(backgroundColor: _showQueue?const Color(0xFF1DB954):Colors.white.withOpacity(0.08), foregroundColor: _showQueue?Colors.black:Colors.white, side: BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))), onPressed:()=>setState(()=>_showQueue=!_showQueue), icon: Icon(_showQueue?Icons.queue_music:Icons.queue_music_outlined, size:18, color:_showQueue?Colors.black:Colors.white), label: Text('Antrian', style:TextStyle(fontSize:12, color:_showQueue?Colors.black:Colors.white)))), const SizedBox(width:10), Expanded(child: OutlinedButton.icon(style: OutlinedButton.styleFrom(backgroundColor: _showLyrics?const Color(0xFF1DB954):Colors.white.withOpacity(0.08), foregroundColor: _showLyrics?Colors.black:Colors.white, side:BorderSide.none, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))), onPressed:()=>setState(()=>_showLyrics=!_showLyrics), icon: const Icon(Icons.lyrics, size:16), label: Text('Lirik', style: TextStyle(fontSize:12, color:_showLyrics?Colors.black:Colors.white))))]),
        Container(margin: const EdgeInsets.only(top:16), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: const Color(0xFF121212), borderRadius: BorderRadius.circular(12)), child: Column(children:[Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children:[Text('Antrian • ${p.queue.length>1?p.queue.length-p.index-1:0} berikutnya', style:const TextStyle(color:Colors.white, fontWeight:FontWeight.w800, fontSize:13)), IconButton(icon: Icon(_showQueue?Icons.expand_less:Icons.expand_more, color:Colors.white), onPressed:()=>setState(()=>_showQueue=!_showQueue))]), if(_showQueue) ...p.queue.skip(p.index+1).take(10).map((q)=>ListTile(leading: q['thumbnail']!=null ? ClipRRect(borderRadius: BorderRadius.circular(4), child: CachedNetworkImage(imageUrl:q['thumbnail'], width:48, height:48, fit:BoxFit.cover)) : null, title: Text(q['title']??'', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.white, fontSize:13)), subtitle: Text(q['artist']??'', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.grey, fontSize:12)), trailing: const Icon(Icons.play_arrow, color:Color(0xFF1DB954), size:18), onTap:(){ final idx=p.queue.indexOf(q); ref.read(playerProvider.notifier).setQueue(p.queue, idx);} )) else const Text('Tap ▲ untuk lihat antrian', style:TextStyle(color:Colors.grey)) ])),
        if(_showLyrics) Container(margin: const EdgeInsets.only(top:16), padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: const Color(0xFF121212), borderRadius: BorderRadius.circular(12)), child: FutureBuilder<Map>(future: _fetchLyrics(song), builder: (_,snap){
          if(snap.connectionState==ConnectionState.waiting) return const Padding(padding: EdgeInsets.all(12), child:Text('Mencari lirik…', style:TextStyle(color:Colors.grey)));
          if(snap.hasError) return Text('Gagal: ${snap.error}', style:const TextStyle(color:Colors.grey));
          final m=snap.data; if(m==null) return const Text('Mencari lirik…', style:TextStyle(color:Colors.grey));
          final has=m['synced']!=null||m['plain']!=null; final txt=m['synced']!=null ? (m['synced'] as String).replaceAll(RegExp(r'\[.*?\]'), '').trim() : (m['plain']??'').toString().trim();
          return Column(crossAxisAlignment:CrossAxisAlignment.start, children:[Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children:[Text('Lirik ${m['source']!=null? '· ${m['source']}':''}', style:const TextStyle(color:Colors.white, fontWeight:FontWeight.w800)), if(has) Container(padding: const EdgeInsets.symmetric(horizontal:8, vertical:3), decoration: BoxDecoration(color: const Color(0xFF1DB954).withOpacity(0.15), borderRadius: BorderRadius.circular(8)), child: Text(m['synced']!=null?'Synced':'Plain', style:const TextStyle(color:Color(0xFF1DB954), fontSize:11, fontWeight:FontWeight.w800)))]), const SizedBox(height:8), Text(has && txt.isNotEmpty ? txt.substring(0, txt.length>6000?6000:txt.length) : 'Lirik tidak ditemukan.', style: const TextStyle(color:Color(0xFFE6E6E6), height:1.6))]);
        })),
        const SizedBox(height:24),
      ])),
    );
  }
}
