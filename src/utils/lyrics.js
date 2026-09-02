function displayTitle(t) {
  const raw = String(t || '').trim(); if (!raw) return '';
  const cleaned = raw.replace(/\s*[\(\[]\s*official\s*(hd\s*)?(4k\s*)?(music\s*)?(lyric(s)?\s*)?(audio|video|visualizer|mv)[^\)\]]*[\)\]]/gi, '').replace(/\s*[\(\[]\s*(official\s*)?(hd\s*)?(music\s*)?(lyric(s)?\s*)?(audio|video|visualizer|mv)[^\)\]]*[\)\]]/gi, '').replace(/\s*[\(\[]\s*(official\s*)?(4k|hd|hq|8d(?:\s*audio)?|1080p|720p)\s*[\)\]]/gi, '').replace(/\s*-\s*(official|lyric(s)?|audio|video|visualizer|topic).*$/gi, '').replace(/\s{2,}/g, ' ').trim();
  return cleaned || raw;
}
function cleanTitle(t) {
  return String(t || '').replace(/\((feat|ft|with|prod)[^)]*\)/gi, '').replace(/\[(feat|ft|with|prod)[^\]]*\]/gi, '').replace(/\((official|lyric|lyrics|audio|video|visualizer|music video|mv|hd|4k|remaster(ed)?( \d{4})?|live|acoustic|explicit|clean)[^)]*\)/gi, '').replace(/\[[^\]]*(official|lyric|audio|video|remaster|visualizer|live|mv)[^\]]*\]/gi, '').replace(/[\(\[]\s*(4k|hd|hq|8d( audio)?|1080p|720p)\s*[\)\]]/gi, '').replace(/\s*-\s*(official|lyric|lyrics|audio|video|visualizer|topic).*/gi, '').replace(/\s+/g, ' ').trim();
}
function primaryArtist(a) {
  return String(a || '').split(/\s*[,&•·]\s*|\s+(?:feat\.?|ft\.?|with|x|vs\.?)\s+/i)[0].replace(/\s*-\s*topic$/i, '').trim();
}
function norm(x) { return String(x || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]+/g, ' ').trim(); }
function simScore(a, b) {
  a = norm(a); b = norm(b); if (!a || !b) return 0; if (a === b) return 1; if (a.includes(b) || b.includes(a)) return 0.85;
  const aw = new Set(a.split(' ')), bw = new Set(b.split(' ')); let hit = 0; for (const w of aw) if (bw.has(w)) hit++; return hit / Math.max(aw.size, bw.size);
}
module.exports = { displayTitle, cleanTitle, primaryArtist, norm, simScore };
