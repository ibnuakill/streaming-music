import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/models/song.dart';

class SongTile extends StatelessWidget {
  final Song song;
  final VoidCallback? onTap;
  final Widget? trailing;
  const SongTile({super.key, required this.song, this.onTap, this.trailing});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: ClipRRect(borderRadius: BorderRadius.circular(4), child: song.thumbnail != null ? CachedNetworkImage(imageUrl: song.thumbnail!, width: 52, height: 52, fit: BoxFit.cover, errorWidget: (_,__,___)=>Container(color: const Color(0xFF222), width: 52, height: 52)) : Container(color: const Color(0xFF222), width: 52, height: 52)),
      title: Text(song.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 14)),
      subtitle: Text(song.subtitle ?? song.artists.map((e)=>e.name).join(', '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      trailing: trailing,
    );
  }
}

class SectionCarousel extends StatelessWidget {
  final String title;
  final List items;
  final void Function(dynamic) onTap;
  const SectionCarousel({super.key, required this.title, required this.items, required this.onTap});
  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.only(left:16, top:10, bottom:8), child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700))),
      SizedBox(height: 190, child: ListView.separated(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal:12), itemCount: items.length, separatorBuilder: (_,__)=>const SizedBox(width:4), itemBuilder: (_,i){ final it=items[i]; return GestureDetector(onTap: ()=>onTap(it), child: SizedBox(width:140, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [ClipRRect(borderRadius: BorderRadius.circular(8), child: it['thumbnail']!=null ? CachedNetworkImage(imageUrl: it['thumbnail'], width:140, height:140, fit: BoxFit.cover, errorWidget: (_,__,___)=>Container(color: const Color(0xFF222), width:140, height:140)) : Container(color: const Color(0xFF222), width:140, height:140)), const SizedBox(height:6), Text(it['title']??'', maxLines:1, overflow:TextOverflow.ellipsis, style: const TextStyle(color:Colors.white, fontSize:13)), Text(it['subtitle']??it['artist']??'', maxLines:1, overflow:TextOverflow.ellipsis, style: const TextStyle(color:Colors.grey, fontSize:11))])));}))
    ]);
  }
}
