const { getAudioUrl, yt } = require('../services/yt');
const { findAll, text, thumbs, runsInfo } = require('../utils/parser');
const { displayTitle } = require('../utils/lyrics');
module.exports = (app) => {
  app.get('/api/audio', async (req, res) => {
    const videoId = String(req.query.videoId || '').trim();
    if (!/^[\w-]{11}$/.test(videoId)) return res.status(400).json({ error: 'bad videoId' });
    try { const url = await getAudioUrl(videoId); res.json({ url }); } catch (e) { const msg = e.message || 'failed'; res.status(e.playStatus === 'ERROR' || /unavailable/i.test(msg) ? 404 : 502).json({ error: msg }); }
  });
  app.get('/api/sponsorblock', async (req, res) => {
    try { const vid = String(req.query.videoId || ''); const cats = encodeURIComponent(JSON.stringify(['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'music_offtopic'])); const r = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(vid)}&categories=${cats}`); if (r.status === 404 || !r.ok) return res.json({ segments: [] }); const arr = await r.json(); res.json({ segments: arr.filter((s) => s.actionType === 'skip').map((s) => ({ category: s.category, start: s.segment[0], end: s.segment[1] })) }); } catch { res.json({ segments: [] }); }
  });
  app.get('/api/next', async (req, res) => {
    try {
      const body = { isAudioOnly: true, tunerSettingValue: 'AUTOMIX_SETTING_NORMAL' };
      if (req.query.videoId) { body.videoId = req.query.videoId; body.playlistId = req.query.playlistId || `RDAMVM${req.query.videoId}`; body.watchEndpointMusicSupportedConfigs = { watchEndpointMusicConfig: { musicVideoType: 'MUSIC_VIDEO_TYPE_ATV' } }; }
      else if (req.query.playlistId) body.playlistId = req.query.playlistId;
      if (req.query.params) body.params = req.query.params;
      const d = await yt('next', body);
      const queue = findAll(d, 'playlistPanelVideoRenderer').map((p) => ({ videoId: p.videoId, title: displayTitle(text(p.title)), artist: text(p.shortBylineText || p.longBylineText), artists: runsInfo(p.longBylineText), duration: text(p.lengthText), thumbnail: thumbs(p.thumbnail), selected: !!p.selected }));
      let lyricsBrowseId = null, relatedBrowseId = null;
      for (const tab of findAll(d, 'tabRenderer')) { const id = tab.endpoint && tab.endpoint.browseEndpoint && tab.endpoint.browseEndpoint.browseId; if (!id) continue; if (id.startsWith('MPLYt')) lyricsBrowseId = id; if (id.startsWith('MPTRt')) relatedBrowseId = id; }
      res.json({ queue, lyricsBrowseId, relatedBrowseId });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/related', async (req, res) => {
    try { const d = await yt('browse', { browseId: req.query.browseId }); const sl = require('../utils/parser').findFirst(d, 'sectionListRenderer'); let sections = sl ? require('../utils/parser').parseSections(sl.contents) : []; for (const g of findAll(d, 'gridRenderer')) { const items = (g.items || []).map((c) => c.musicTwoRowItemRenderer ? require('../utils/parser').parseTwoRow(c.musicTwoRowItemRenderer) : c.musicResponsiveListItemRenderer ? require('../utils/parser').parseListItem(c.musicResponsiveListItemRenderer) : null).filter((x) => x && x.title); if (items.length) sections.push({ title: text(require('../utils/parser').findFirst(g.header || {}, 'title') || {}), items }); } res.json({ sections: sections.filter((x) => x.items && x.items.length) }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
