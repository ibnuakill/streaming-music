import 'package:hive_flutter/hive_flutter.dart';

class LibraryLocal {
  static const _fav='smw_fav', _pls='smw_pls', _hist='smw_hist', _stats='smw_stats', _saved='smw_sav';
  late Box _box;
  Future<void> init() async { await Hive.initFlutter(); _box = await Hive.openBox('musera'); }
  List get fav => List.from(_box.get(_fav, defaultValue: []));
  List get playlists => List.from(_box.get(_pls, defaultValue: []));
  List get history => List.from(_box.get(_hist, defaultValue: []));
  List get saved => List.from(_box.get(_saved, defaultValue: []));
  Map get stats => Map.from(_box.get(_stats, defaultValue: {}));
  Future<void> setFav(List v)=>_box.put(_fav, v);
  Future<void> setPlaylists(List v)=>_box.put(_pls, v);
  Future<void> setHistory(List v)=>_box.put(_hist, v);
  Future<void> setSaved(List v)=>_box.put(_saved, v);
  Future<void> setStats(Map v)=>_box.put(_stats, v);
}
final libraryLocal = LibraryLocal();
