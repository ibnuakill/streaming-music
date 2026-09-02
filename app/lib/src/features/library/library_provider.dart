import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/library_local.dart';

class LibraryState { final List fav, playlists, history, saved; final Map stats; const LibraryState({this.fav=const[], this.playlists=const[], this.history=const[], this.saved=const[], this.stats=const{}}); }
class LibraryNotifier extends StateNotifier<LibraryState> {
  LibraryNotifier():super(const LibraryState()){ load(); }
  Future<void> load() async { try{ await libraryLocal.init(); }catch(_){} state=LibraryState(fav:libraryLocal.fav, playlists:libraryLocal.playlists, history:libraryLocal.history, saved:libraryLocal.saved, stats:libraryLocal.stats); }
  bool isFav(String id)=>state.fav.any((e)=>e['videoId']==id);
  Future<void> toggleFav(Map s) async { final fav=[...state.fav]; final i=fav.indexWhere((e)=>e['videoId']==s['videoId']); if(i>=0) fav.removeAt(i); else fav.insert(0,s); state=LibraryState(fav:fav, playlists:state.playlists, history:state.history, saved:state.saved, stats:state.stats); await libraryLocal.setFav(fav); }
  Future<void> createPlaylist(String name) async { final pl={'id':'local_${DateTime.now().millisecondsSinceEpoch}','name':name,'tracks':[]}; final pls=[pl, ...state.playlists]; state=LibraryState(fav:state.fav, playlists:pls, history:state.history, saved:state.saved, stats:state.stats); await libraryLocal.setPlaylists(pls); }
  Future<void> addToPlaylist(String pid, Map s) async { final pls=state.playlists.map((p){ if(p['id']!=pid) return p; final tracks=[...p['tracks']]; if(!tracks.any((t)=>t['videoId']==s['videoId'])) tracks.add(s); return {...p,'tracks':tracks};}).toList(); state=LibraryState(fav:state.fav, playlists:pls, history:state.history, saved:state.saved, stats:state.stats); await libraryLocal.setPlaylists(pls); }
  Future<void> removeFromPlaylist(String pid,String vid) async { final pls=state.playlists.map((p)=> p['id']==pid ? {...p,'tracks':(p['tracks'] as List).where((t)=>t['videoId']!=vid).toList()} : p).toList(); state=LibraryState(fav:state.fav, playlists:pls, history:state.history, saved:state.saved, stats:state.stats); await libraryLocal.setPlaylists(pls); }
  Future<void> deletePlaylist(String pid) async { final pls=state.playlists.where((p)=>p['id']!=pid).toList(); state=LibraryState(fav:state.fav, playlists:pls, history:state.history, saved:state.saved, stats:state.stats); await libraryLocal.setPlaylists(pls); }
  Future<void> pushHistory(Map s) async { final h=[s, ...state.history.where((e)=>e['videoId']!=s['videoId'])].take(100).toList(); final stats=Map.from(state.stats); stats[s['videoId']]={'title':s['title'],'artist':s['artist']??'','thumbnail':s['thumbnail'],'plays':((stats[s['videoId']]??{})['plays']??0)+1}; state=LibraryState(fav:state.fav, playlists:state.playlists, history:h, saved:state.saved, stats:stats); await libraryLocal.setHistory(h); await libraryLocal.setStats(stats); }
}
final libraryProvider=StateNotifierProvider<LibraryNotifier, LibraryState>((_)=>LibraryNotifier());
