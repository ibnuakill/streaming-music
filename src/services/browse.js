const { yt } = require('./yt');
const { findAll, findFirst, text, thumbs, runsInfo, parseSections, parseListItem, parseTwoRow, endpointInfo } = require('../utils/parser');

async function browsePage(rawId, params) {
  let id = rawId || '';
  if (/^(PL|RDCLAK|VLPL|OLAK)/.test(id) && !id.startsWith('VL')) id = 'VL' + id;
  const body = { browseId: id }; if (params) body.params = params;
  const d = await yt('browse', body);
  let header = null;
  const hResp = findFirst(d, 'musicResponsiveHeaderRenderer') || findFirst(d, 'musicDetailHeaderRenderer') || findFirst(d, 'musicImmersiveHeaderRenderer') || findFirst(d, 'musicVisualHeaderRenderer') || findFirst(d, 'musicEditablePlaylistDetailHeaderRenderer');
  if (hResp) {
    header = { title: text(hResp.title), subtitle: [text(hResp.subtitle), text(hResp.secondSubtitle)].filter(Boolean).join(' • '), description: text(hResp.description) || text(findFirst(hResp, 'description') || {}), thumbnail: thumbs(hResp.thumbnail || hResp.foregroundThumbnail || {}), artists: runsInfo(hResp.subtitle).concat(runsInfo(hResp.straplineTextOne)), strapline: text(hResp.straplineTextOne) };
    if (!header.thumbnail) header.thumbnail = thumbs(hResp);
  }
  let playlistId = null; const wpe = findFirst(d, 'watchPlaylistEndpoint'); if (wpe) playlistId = wpe.playlistId;
  let tracks = [];
  const shelves = findAll(d, 'musicShelfRenderer').concat(findAll(d, 'musicPlaylistShelfRenderer'));
  for (const shelf of shelves) {
    const items = (shelf.contents || []).map((c) => c.musicResponsiveListItemRenderer ? parseListItem(c.musicResponsiveListItemRenderer) : null).filter((x) => x && x.title);
    if (items.length && items.filter((i) => i.videoId).length >= items.length / 2 && !tracks.length) tracks = items;
  }
  let sections = []; const sl = findFirst(d, 'sectionListRenderer'); if (sl) sections = parseSections(sl.contents).filter((s) => !s.list || !tracks.length);
  if (tracks.length) sections = sections.filter((s) => !(s.list && s.items[0] && s.items[0].videoId === tracks[0].videoId));
  for (const g of findAll(d, 'gridRenderer')) { const items = (g.items || []).map((c) => c.musicTwoRowItemRenderer ? parseTwoRow(c.musicTwoRowItemRenderer) : null).filter(Boolean); if (items.length) sections.push({ title: text(findFirst(g.header || {}, 'title') || {}), items }); }
  if (header && !header.thumbnail && tracks[0]) header.thumbnail = tracks[0].thumbnail;
  if (header && tracks.length) { const ha = (header.artists && header.artists[0]) || (header.strapline ? { name: header.strapline } : null); if (ha && ha.name) tracks = tracks.map((t) => (t.artist || (t.artists && t.artists.length)) ? t : { ...t, artist: ha.name, artists: t.artists && t.artists.length ? t.artists : [ha], artistBrowseId: ha.browseId || t.artistBrowseId }); }
  return { header, tracks, sections, playlistId };
}
module.exports = { browsePage };
