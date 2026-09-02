const { getAudioUrl } = require('../services/yt');
const LOADER_API = 'https://loader.to/ajax/download.php';
const DL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
module.exports = (app) => {
  app.get('/api/download-start', async (req, res) => {
    const videoId = String(req.query.videoId || ''); if (!/^[\w-]{6,20}$/.test(videoId)) return res.status(400).json({ error: 'bad id' });
    try { const r = await fetch(`${LOADER_API}?format=mp3&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}`, { headers: { 'User-Agent': DL_UA, Referer: 'https://loader.to/' } }); if (!r.ok) throw new Error(`start -> ${r.status}`); const d = await r.json(); if (!d.success || !d.id) throw new Error('converter refused'); res.json({ jobId: d.id, progressUrl: d.progress_url, title: d.title || null }); } catch (e) { res.status(502).json({ error: e.message }); }
  });
  app.get('/api/download-progress', async (req, res) => {
    const purl = String(req.query.progressUrl || '');
    try { const pu = new URL(purl); const host = pu.hostname; const okHost = host === 'loader.to' || host === 'savenow.to' || host === 'affadaffa.com' || host.endsWith('.loader.to') || host.endsWith('.savenow.to') || host.endsWith('.affadaffa.com'); if (!okHost) return res.status(400).json({ error: 'bad progress url' }); const r = await fetch(purl, { headers: { 'User-Agent': DL_UA } }); if (!r.ok) throw new Error(`progress -> ${r.status}`); const d = await r.json(); res.json({ progress: d.progress || 0, done: !!d.success && !!d.download_url, url: d.download_url || null, text: d.text || '' }); } catch (e) { res.status(502).json({ error: e.message }); }
  });
  app.get('/api/resolve', async (req, res) => {
    try {
      const raw = String(req.query.url || '').trim();
      if (/^[\w-]{11}$/.test(raw)) { try { const url = await getAudioUrl(raw); return res.json({ url, videoId: raw }); } catch (e) { return res.status(502).json({ error: e.message }); } }
      let u; try { u = new URL(raw.includes('://') ? raw : 'https://' + raw); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
      const list = u.searchParams.get('list'), v = u.searchParams.get('v'), m = u.pathname.match(/\/(playlist|channel|browse|watch)\/?([^/]*)?/);
      if (list && !v) return res.json({ kind: 'playlist', id: list });
      if (v) return res.json({ kind: 'song', videoId: v, playlistId: list || null });
      if (m && m[1] === 'channel' && m[2]) return res.json({ kind: 'artist', id: m[2] });
      if (m && m[1] === 'browse' && m[2]) return res.json({ kind: m[2].startsWith('MPRE') ? 'album' : 'playlist', id: m[2] });
      return res.status(400).json({ error: 'Could not recognize this link.' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/thumb', async (req, res) => {
    try { const raw = String(req.query.url || ''); const u = new URL(raw); const host = u.hostname; if (!(host.endsWith('ytimg.com') || host.endsWith('ggpht.com') || host.endsWith('googleusercontent.com'))) return res.status(400).end(); const r = await fetch(raw, { headers: { 'User-Agent': 'Mozilla/5.0 RichMusicThumb/1.0', Accept: 'image/*' } }); if (!r.ok) return res.status(502).end(); res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg'); res.setHeader('Cache-Control', 'public, max-age=86400'); res.send(Buffer.from(await r.arrayBuffer())); } catch { res.status(500).end(); }
  });
};
