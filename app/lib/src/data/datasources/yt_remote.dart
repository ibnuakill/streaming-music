import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';

class YtRemote {
  final Dio _dio = dioProvider;
  Future<Map> home() async => (await _dio.get('/api/home')).data;
  Future<Map> charts() async => (await _dio.get('/api/charts')).data;
  Future<Map> moods() async => (await _dio.get('/api/moods')).data;
  Future<Map> search(String q, {String? filter}) async => (await _dio.get('/api/search', queryParameters:{'q':q, if(filter!=null)'filter':filter})).data;
  Future<Map> suggest(String q) async => (await _dio.get('/api/suggest', queryParameters:{'q':q})).data;
  Future<Map> next(String videoId, {String? playlistId}) async => (await _dio.get('/api/next', queryParameters:{'videoId':videoId, if(playlistId!=null)'playlistId':playlistId})).data;
  Future<Map> related(String browseId) async => (await _dio.get('/api/related', queryParameters:{'browseId':browseId})).data;
  Future<Map> browse(String id, {String? params}) async => (await _dio.get('/api/browse', queryParameters:{'id':id, if(params!=null)'params':params})).data;
  Future<Map> lyrics(String title, String artist, int duration, String browseId) async => (await _dio.get('/api/lyrics', queryParameters:{'title':title,'artist':artist,'duration':duration,'browseId':browseId})).data;
  Future<Map> audio(String videoId) async => (await _dio.get('/api/audio', queryParameters:{'videoId':videoId})).data;
  Future<Map> sponsor(String videoId) async => (await _dio.get('/api/sponsorblock', queryParameters:{'videoId':videoId})).data;
}
