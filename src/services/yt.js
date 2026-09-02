const { YTM, CONTEXT, HEADERS } = require('../config/yt');

async function yt(endpoint, body = {}, query = '') {
  const res = await fetch(`${YTM}/${endpoint}?prettyPrint=false${query}`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify({ context: CONTEXT, ...body }),
  });
  if (!res.ok) throw new Error(`YTM ${endpoint} -> ${res.status}`);
  return res.json();
}
function extractAudioUrl(data) {
  const sd = data && data.streamingData; if (!sd) return null;
  const all = [...(sd.formats || []), ...(sd.adaptiveFormats || [])];
  const audios = all.filter((f) => f.mimeType && f.mimeType.includes('audio'));
  const cands = audios.length ? audios : all;
  const withUrl = cands.filter((f) => f.url); if (!withUrl.length) return null;
  withUrl.sort((a, b) => (b.bitrate || b.averageBitrate || 0) - (a.bitrate || a.averageBitrate || 0));
  return withUrl[0].url;
}
let cachedVisitor = 'CgtjbFU2cG9XNXVtNCjg597UBjIKCgJJRBIEGgAgDmLfAgrcAjIxLllUPUFrbnJrZW1QWElUdjF0dlFPWUlmcWRRNG5EdFc4WXZmUWdGOE9QOXJMX2c2ZUh5';
let visitorFetchedAt = Date.now();
async function getVisitorData() {
  if (cachedVisitor && Date.now() - visitorFetchedAt < 30 * 60 * 1000) return cachedVisitor;
  for (const u of ['https://www.youtube.com/', 'https://m.youtube.com/', 'https://music.youtube.com/']) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'en-US,en;q=0.9' } });
      const t = await r.text(); const m = t.match(/"visitorData":"([^"]+)"/);
      if (m && m[1].length > 20) { cachedVisitor = m[1]; visitorFetchedAt = Date.now(); return cachedVisitor; }
    } catch {}
  }
  return cachedVisitor;
}
async function getAudioUrl(videoId) {
  const visitorData = await getVisitorData();
  const baseAndroid = { clientName: 'ANDROID', clientVersion: '20.13.41', androidSdkVersion: 30, hl: 'en', gl: 'US' };
  const baseIos = { clientName: 'IOS', clientVersion: '20.13.41', deviceModel: 'iPhone16,2', hl: 'en', gl: 'US' };
  const ANDROID_CTX = visitorData ? { client: { ...baseAndroid, visitorData } } : { client: baseAndroid };
  const IOS_CTX = visitorData ? { client: { ...baseIos, visitorData } } : { client: baseIos };
  const WEB_CTX = visitorData ? { client: { ...CONTEXT.client, visitorData } } : CONTEXT;
  const mkHeaders = (ua, origin) => { const h = { 'Content-Type': 'application/json', 'User-Agent': ua, Origin: origin }; if (visitorData) h['X-Goog-Visitor-Id'] = visitorData; return h; };
  const attempts = [
    { url: 'https://www.youtube.com/youtubei/v1/player', ctx: ANDROID_CTX, headers: mkHeaders('com.google.android.youtube/20.13.41 (Linux; U; Android 13; en_US)', 'https://www.youtube.com') },
    { url: 'https://www.youtube.com/youtubei/v1/player', ctx: IOS_CTX, headers: mkHeaders('com.google.ios.youtube/20.13.41 (iPhone16,2; U; CPU iPhone OS 17_5 like Mac OS X)', 'https://www.youtube.com') },
    { url: `${YTM}/player`, ctx: WEB_CTX, headers: visitorData ? { ...HEADERS, 'X-Goog-Visitor-Id': visitorData } : HEADERS },
  ];
  let lastErr = null, lastStatus = null;
  for (const a of attempts) {
    try {
      const r = await fetch(`${a.url}?prettyPrint=false`, { method: 'POST', headers: a.headers, body: JSON.stringify({ context: a.ctx, videoId, playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } }, racyCheckOk: true, contentCheckOk: true }) });
      if (!r.ok) throw new Error(`player ${r.status}`);
      const j = await r.json(); lastStatus = j.playabilityStatus ? j.playabilityStatus.status : null;
      if (j.playabilityStatus && j.playabilityStatus.status !== 'OK') {
        lastErr = j.playabilityStatus.reason || j.playabilityStatus.status;
        if (lastStatus === 'ERROR' && /unavailable/i.test(lastErr)) continue;
        if (/bot|sign in/i.test(lastErr)) continue;
      }
      const u = extractAudioUrl(j); if (u) return u;
      lastErr = j.playabilityStatus ? (j.playabilityStatus.reason || 'no url') : 'no url';
    } catch (e) { lastErr = e.message; }
  }
  if (lastErr && /bot|sign in|login/i.test(lastErr)) {
    try {
      const sr = await fetch(`https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}`, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://loader.to/' } });
      const sj = await sr.json();
      if (sj.success && sj.progress_url) for (let i = 0; i < 8; i++) { await new Promise((r) => setTimeout(r, 2000)); const pr = await fetch(sj.progress_url, { headers: { 'User-Agent': 'Mozilla/5.0' } }); const pj = await pr.json(); if (pj.success && pj.download_url) return pj.download_url; }
    } catch {}
  }
  const err = new Error(lastErr || 'no audio url'); err.playStatus = lastStatus; throw err;
}
async function fetchTimeout(url, opts = {}, ms = 4500) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ac.signal }); } finally { clearTimeout(t); }
}
module.exports = { yt, extractAudioUrl, getAudioUrl, getVisitorData, fetchTimeout };
