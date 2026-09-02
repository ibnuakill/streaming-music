const { fetchTimeout } = require('./yt');
const { findAll, text } = require('../utils/parser');
const { cleanTitle, primaryArtist, simScore } = require('../utils/lyrics');
const { YTM, CONTEXT, HEADERS } = require('../config/yt');

async function lyricsOvh(title, artist) {
  if (!title || !artist) return null;
  try { const r = await fetchTimeout(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`); if (!r.ok) return null; const j = await r.json(); const lyr = String(j.lyrics || '').replace(/\r\n/g, '\n').trim(); return lyr.length > 24 ? lyr : null; } catch { return null; }
}
async function neteaseLyrics(title, artist) {
  try {
    const q = `${title} ${artist}`.trim(); if (!q) return null;
    const r = await fetchTimeout(`https://music.163.com/api/search/get/web?s=${encodeURIComponent(q)}&type=1&limit=8`, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' } }); if (!r.ok) return null;
    const j = await r.json(); const songs = (((j.result || {}).songs) || []); let best = null, bestScore = 0;
    for (const song of songs) { const an = (song.artists || []).map((a) => a.name).join(' '); const score = simScore(song.name, title) * 2 + simScore(an, artist); if (score > bestScore) { bestScore = score; best = song; } }
    if (!best || bestScore < 1.4) return null;
    const lr = await fetchTimeout(`https://music.163.com/api/song/lyric?id=${best.id}&lv=1&kv=1&tv=-1`, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com/' } }); if (!lr.ok) return null;
    const L = await lr.json(); const synced = (L.lrc && L.lrc.lyric) || ''; const hasTime = /\[[0-9]+:[0-9]/.test(synced);
    if (hasTime && synced.length > 40) { const plain = synced.replace(/\[[^\]]+\]/g, '').replace(/\n{3,}/g, '\n\n').trim(); return { synced, plain: plain || null }; }
    const plain = synced.replace(/\[[^\]]+\]/g, '').trim(); if (plain.length > 24) return { synced: null, plain }; return null;
  } catch { return null; }
}
async function lrclibGet(title, artist, duration) {
  try { const u = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}${duration ? `&duration=${Math.round(duration)}` : ''}`; const r = await fetchTimeout(u, { headers: { 'User-Agent': 'RichMusic/1.0' } }, 4000); if (!r.ok) return null; const j = await r.json(); if (j.instrumental) return null; return (j.syncedLyrics || j.plainLyrics) ? j : null; } catch { return null; }
}
async function lrclibSearch(params) {
  try { const qs = new URLSearchParams(params).toString(); const r = await fetchTimeout(`https://lrclib.net/api/search?${qs}`, { headers: { 'User-Agent': 'RichMusic/1.0' } }, 4000); if (!r.ok) return []; return await r.json(); } catch { return []; }
}
function pickBest(cands, title, artist, duration) {
  const dur = Number(duration) || 0; let best = null, bestScore = 0;
  for (const c of cands) {
    if (!c || c.instrumental || (!c.syncedLyrics && !c.plainLyrics)) continue;
    const tScore = simScore(c.trackName || c.name, title); let score = tScore * 2 + simScore(c.artistName, artist);
    if (dur && c.duration) { const diff = Math.abs(c.duration - dur); if (diff <= 2) score += 1.2; else if (diff <= 5) score += 0.6; else if (diff > 20) score -= 1; }
    if (c.syncedLyrics) score += 0.8; if (score > bestScore) { bestScore = score; best = c; }
  }
  if (!best) return null; if (bestScore >= 1.4) return best; if (simScore(best.trackName || best.name, title) >= 0.85 && bestScore >= 0.95) return best; return null;
}
async function textylLyrics(title, artist) {
  const q = `${artist || ''} ${title || ''}`.trim(); if (!q) return null;
  try { const r = await fetchTimeout(`https://api.textyl.co/api/lyrics?q=${encodeURIComponent(q)}`); if (!r.ok) return null; const arr = await r.json(); if (!Array.isArray(arr) || arr.length < 4) return null; return arr.map((x) => { const sec = Number(x.seconds) || 0; const m = Math.floor(sec / 60); const s = (sec % 60).toFixed(2).padStart(5, '0'); return `[${m}:${s}]${x.lyrics || ''}`; }).join('\n').length > 40 ? arr.map((x) => { const sec = Number(x.seconds) || 0; const m = Math.floor(sec / 60); const s = (sec % 60).toFixed(2).padStart(5, '0'); return `[${m}:${s}]${x.lyrics || ''}`; }).join('\n') : null; } catch { return null; }
}
function extractYtmLyrics(d) {
  for (const shelf of findAll(d, 'musicDescriptionShelfRenderer')) { const lyr = text(shelf.description); if (lyr && lyr.length > 20) return lyr; }
  for (const block of findAll(d, 'formattedDescription')) { const lyr = text(block); if (lyr && lyr.length > 40 && lyr.split('\n').length > 4) return lyr; }
  return null;
}
async function resolveLyrics({ title = '', artist = '', duration = 0, browseId = '' }) {
  const ct = cleanTitle(title), pa = primaryArtist(artist); let tUse = ct || title, aUse = pa || artist;
  const dash = String(tUse).match(/^(.{2,48}?)\s*[-–—]\s+(.+)$/); if (dash && (!aUse || simScore(dash[1], aUse) >= 0.45)) { aUse = aUse || dash[1]; tUse = dash[2]; }
  let synced = null, plain = null, source = null;
  if (browseId) {
    try { const r = await fetchTimeout(`${YTM}/browse?prettyPrint=false`, { method: 'POST', headers: HEADERS, body: JSON.stringify({ context: { client: { ...CONTEXT.client, hl: 'id', gl: 'ID' } }, browseId }) }, 4500); if (r.ok) { const d = await r.json(); const lyr = extractYtmLyrics(d); if (lyr) { plain = lyr; source = 'YouTube Music'; } } } catch {}
  }
  const exactHits = await Promise.all([lrclibGet(tUse, aUse, duration), lrclibGet(tUse, aUse, 0), title && title !== tUse ? lrclibGet(cleanTitle(title), pa, 0) : null]);
  for (const hit of exactHits) { if (!hit) continue; synced = synced || hit.syncedLyrics || null; plain = plain || hit.plainLyrics || null; source = synced ? 'LRCLIB' : (source || 'LRCLIB'); if (synced) break; }
  if (!synced) {
    const [s1, s2, s3, ne, ovh, tx] = await Promise.all([lrclibSearch({ track_name: tUse, artist_name: aUse }), lrclibSearch({ q: `${tUse} ${aUse}`.trim() }), lrclibSearch({ track_name: tUse }), neteaseLyrics(tUse, aUse), plain ? null : lyricsOvh(tUse, aUse), textylLyrics(tUse, aUse)]);
    const best = pickBest([].concat(s1 || [], s2 || [], s3 || []), tUse, aUse, duration);
    if (best) { synced = best.syncedLyrics || synced; plain = plain || best.plainLyrics; source = best.syncedLyrics ? 'LRCLIB' : (source || 'LRCLIB'); }
    if (!synced && ne && ne.synced) { synced = ne.synced; plain = plain || ne.plain; source = 'NetEase'; } else if (!plain && ne && ne.plain) { plain = ne.plain; source = source || 'NetEase'; }
    if (!synced && tx) { synced = tx; source = 'Textyl'; }
    if (!synced && !plain && ovh) { plain = ovh; source = 'lyrics.ovh'; }
  }
  return { synced: synced || null, plain: plain || null, source };
}
module.exports = { resolveLyrics, lrclibGet, lrclibSearch, neteaseLyrics, lyricsOvh, textylLyrics, extractYtmLyrics };
