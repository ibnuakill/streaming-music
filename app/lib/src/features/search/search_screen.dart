import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/datasources/yt_remote.dart';
import '../player/player_provider.dart';

class SearchScreen extends ConsumerStatefulWidget { const SearchScreen({super.key}); @override ConsumerState<SearchScreen> createState()=>_S();}
class _S extends ConsumerState<SearchScreen>{
  final _c=TextEditingController();
  Map? _res; bool _loading=false;
  Future<void> _search() async { if(_c.text.trim().isEmpty) return; setState(()=>_loading=true); try{ _res=await YtRemote().search(_c.text.trim());}catch(_){} setState(()=>_loading=false); }
  @override Widget build(BuildContext context){
    final flat=((_res?['sections'] as List? ?? []).expand((s)=> (s['items'] as List? ?? [])).toList());
    return Scaffold(backgroundColor: Colors.black, body: SafeArea(child: Padding(padding: const EdgeInsets.all(12), child: Column(children:[
      Row(children:[Expanded(child: TextField(controller:_c, style:const TextStyle(color:Colors.white), decoration: InputDecoration(hintText:'What do you want to play?', hintStyle:const TextStyle(color:Colors.grey), filled:true, fillColor: const Color(0xFF222), border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide:BorderSide.none)), onSubmitted:(_)=>_search())), const SizedBox(width:8), if(_loading) const SizedBox(width:20,height:20, child:CircularProgressIndicator(strokeWidth:2, color:Color(0xFF1DB954))) else IconButton(icon:const Icon(Icons.search, color:Colors.white), onPressed:_search)]),
      const SizedBox(height:12),
      Expanded(child: flat.isEmpty ? Center(child: Text(_c.text.isEmpty?'Ketik & cari':'No results', style:const TextStyle(color:Colors.grey))) : ListView.builder(itemCount: flat.length, itemBuilder:(_,i){ final it=flat[i]; return ListTile(leading: ClipRRect(borderRadius: BorderRadius.circular(4), child: it['thumbnail']!=null ? CachedNetworkImage(imageUrl:it['thumbnail'], width:56, height:56, fit:BoxFit.cover) : Container(color: const Color(0xFF222), width:56, height:56)), title: Text(it['title']??'', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.white)), subtitle: Text(it['subtitle']??'', maxLines:1, overflow:TextOverflow.ellipsis, style:const TextStyle(color:Colors.grey, fontSize:12)), onTap:(){ if(it['videoId']!=null){ ref.read(playerProvider.notifier).play(Map<String,dynamic>.from(it)); context.push('/player');} else if(it['browseId']!=null) context.push('/browse/${Uri.encodeComponent(it['browseId'])}'); });}))
    ]))));
  }
}
