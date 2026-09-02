import '../datasources/yt_remote.dart';
class YtRepository { final _remote=YtRemote();
  Future<List> homeSections() async => ((await _remote.home())['sections'] as List? ?? []);
  Future<List> chartsSections() async => ((await _remote.charts())['sections'] as List? ?? []);
  Future<Map> search(String q)=>_remote.search(q);
  Future<Map> next(String vid)=>_remote.next(vid);
  Future<Map> browse(String id)=>_remote.browse(id);
  Future<Map> lyrics(String t,String a,int d,String b)=>_remote.lyrics(t,a,d,b);
  Future<String> audioUrl(String vid) async => ((await _remote.audio(vid))['url'] as String? ?? '');
}
