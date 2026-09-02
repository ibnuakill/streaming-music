class ArtistRef { final String name; final String? browseId; ArtistRef({required this.name, this.browseId}); factory ArtistRef.fromJson(Map j)=>ArtistRef(name: j['name']??'', browseId: j['browseId']); Map toJson()=>{'name':name,'browseId':browseId}; }
class Song {
  final String? videoId; final String? browseId; final String? browseType; final String title; final String? subtitle; final String? artist; final String? thumbnail; final String? duration; final List<ArtistRef> artists; final String type;
  Song({this.videoId, this.browseId, this.browseType, required this.title, this.subtitle, this.artist, this.thumbnail, this.duration, this.artists=const[], this.type='song'});
  factory Song.fromJson(Map j)=>Song(videoId:j['videoId'], browseId:j['browseId'], browseType:j['browseType'], title:j['title']??'', subtitle:j['subtitle'], artist:j['artist']??j['subtitle'], thumbnail:j['thumbnail'], duration:j['duration'], type:j['type']??'song', artists: (j['artists'] as List? ?? []).map((e)=>ArtistRef.fromJson(e)).toList());
  Map<String,dynamic> toJson()=>{'videoId':videoId,'browseId':browseId,'browseType':browseType,'title':title,'subtitle':subtitle,'artist':artist,'thumbnail':thumbnail,'duration':duration,'type':type,'artists':artists.map((e)=>e.toJson()).toList()};
  bool get isSong => videoId!=null;
}
class Section { final String title; final List<Map> items; final bool list; Section({required this.title, required this.items, this.list=false}); factory Section.fromJson(Map j)=>Section(title:j['title']??'', items:(j['items'] as List? ?? []).cast<Map>(), list:j['list']==true); }
