function findAll(obj, key, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) { for (const v of obj) findAll(v, key, out); return out; }
  for (const k of Object.keys(obj)) { if (k === key) out.push(obj[k]); findAll(obj[k], key, out); }
  return out;
}
const findFirst = (obj, key) => findAll(obj, key)[0];
const text = (o) => (o && o.runs ? o.runs.map((r) => r.text).join('') : (o && o.simpleText) || '');
function normalizeDuration(s) {
  const t = String(s || '').trim();
  if (/^\d{1,2}(\.\d{2}){1,2}$/.test(t)) return t.replace(/\./g, ':');
  return t;
}
function runsInfo(o) {
  const out = [];
  if (!o || !o.runs) return out;
  for (const r of o.runs) {
    const be = r.navigationEndpoint && r.navigationEndpoint.browseEndpoint;
    if (be) out.push({ name: r.text, browseId: be.browseId });
  }
  return out;
}
function upscale(url) {
  if (!url) return url;
  if (url.includes('googleusercontent.com')) return url.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj');
  return url;
}
function thumbs(o) {
  const t = findAll(o, 'thumbnails').flat().filter((x) => x && x.url);
  if (!t.length) return null;
  return upscale(t.reduce((a, b) => ((b.width || 0) >= (a.width || 0) ? b : a)).url);
}
function endpointInfo(nav) {
  if (!nav) return {};
  const we = nav.watchEndpoint, be = nav.browseEndpoint, wpe = nav.watchPlaylistEndpoint;
  if (we) return { videoId: we.videoId, playlistId: we.playlistId };
  if (wpe) return { playlistId: wpe.playlistId, watchPlaylist: true };
  if (be) {
    const id = be.browseId; let type = 'browse';
    if (id.startsWith('MPRE')) type = 'album';
    else if (id.startsWith('UC') || id.startsWith('MPLA')) type = 'artist';
    else if (id.startsWith('VL') || id.startsWith('PL') || id.startsWith('RDCLAK')) type = 'playlist';
    return { browseId: id, browseType: type };
  }
  return {};
}
function parseTwoRow(r) {
  const nav = r.navigationEndpoint || {};
  let info = endpointInfo(nav);
  if (!info.browseId && r.title && r.title.runs) {
    const tNav = r.title.runs[0] && r.title.runs[0].navigationEndpoint;
    const extra = endpointInfo(tNav || {});
    if (extra.browseId) info = { ...info, ...extra };
  }
  let type = 'song';
  if (info.browseType === 'album' || info.browseType === 'playlist' || info.browseType === 'artist') type = info.browseType;
  else if (info.videoId) type = 'song';
  else if (info.playlistId || info.watchPlaylist) type = 'playlist';
  const item = { type, title: text(r.title), subtitle: text(r.subtitle), thumbnail: thumbs(r.thumbnailRenderer), artists: runsInfo(r.subtitle), ...info };
  if (r.thumbnailRenderer && findFirst(r, 'musicThumbnailRenderer')) {
    const style = findFirst(r, 'musicThumbnailRenderer').thumbnailCrop;
    if (style === 'MUSIC_THUMBNAIL_CROP_CIRCLE') item.type = 'artist';
  }
  return item;
}
function parseListItem(r) {
  const cols = (r.flexColumns || []).map((c) => c.musicResponsiveListItemFlexColumnRenderer ? c.musicResponsiveListItemFlexColumnRenderer.text : null);
  const title = cols[0] ? text(cols[0]) : '';
  const subtitle = cols.slice(1).map((c) => text(c)).filter(Boolean).join(' • ');
  let videoId = null;
  if (r.playlistItemData) videoId = r.playlistItemData.videoId;
  if (!videoId && cols[0] && cols[0].runs) {
    const we = cols[0].runs[0] && cols[0].runs[0].navigationEndpoint && cols[0].runs[0].navigationEndpoint.watchEndpoint;
    if (we) videoId = we.videoId;
  }
  if (!videoId) { const we = findFirst(r.overlay || {}, 'watchEndpoint'); if (we) videoId = we.videoId; }
  const navInfo = endpointInfo(r.navigationEndpoint);
  const artists = [], albums = [];
  for (const c of cols.slice(1)) for (const e of runsInfo(c)) (e.browseId.startsWith('MPRE') ? albums : artists).push(e);
  let type = videoId ? 'song' : navInfo.browseType || 'song';
  const item = { type, title, subtitle, videoId, thumbnail: thumbs(r.thumbnail), artists, album: albums[0] || null, ...navInfo };
  const fixed = findFirst(r, 'musicResponsiveListItemFixedColumnRenderer');
  if (fixed) item.duration = normalizeDuration(text(fixed.text));
  return item;
}
function parseSections(contents) {
  const sections = [];
  for (const s of contents || []) {
    const car = s.musicCarouselShelfRenderer, shelf = s.musicShelfRenderer;
    if (car) {
      const header = findFirst(car.header || {}, 'title');
      const items = (car.contents || []).map((c) => c.musicTwoRowItemRenderer ? parseTwoRow(c.musicTwoRowItemRenderer) : c.musicResponsiveListItemRenderer ? parseListItem(c.musicResponsiveListItemRenderer) : null).filter((x) => x && x.title);
      if (items.length) sections.push({ title: text(header), items });
    } else if (shelf) {
      const items = (shelf.contents || []).map((c) => c.musicResponsiveListItemRenderer ? parseListItem(c.musicResponsiveListItemRenderer) : null).filter((x) => x && x.title);
      if (items.length) sections.push({ title: text(shelf.title), items, list: true });
    }
  }
  return sections;
}
module.exports = { findAll, findFirst, text, normalizeDuration, runsInfo, thumbs, upscale, endpointInfo, parseTwoRow, parseListItem, parseSections };
