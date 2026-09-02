const { yt } = require('../services/yt');
const { findAll, findFirst, text, thumbs, endpointInfo, parseListItem } = require('../utils/parser');
const { SEARCH_PARAMS } = require('../config/yt');
module.exports = (app) => {
  app.get('/api/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim(); if (!q) return res.json({ sections: [] });
      const filter = req.query.filter; const body = { query: q }; if (filter && SEARCH_PARAMS[filter]) body.params = SEARCH_PARAMS[filter];
      const d = await yt('search', body); const sections = [];
      for (const shelf of findAll(d, 'musicShelfRenderer')) { const items = (shelf.contents || []).map((c) => c.musicResponsiveListItemRenderer ? parseListItem(c.musicResponsiveListItemRenderer) : null).filter((x) => x && x.title); if (items.length) sections.push({ title: text(shelf.title), items }); }
      if (!sections.length) { const flat = []; const seen = new Set(); for (const sec of findAll(d, 'itemSectionRenderer')) for (const c of sec.contents || []) if (c.musicResponsiveListItemRenderer) { const it = parseListItem(c.musicResponsiveListItemRenderer); const key = it.videoId || it.browseId || it.title; if (it.title && !seen.has(key)) { seen.add(key); flat.push(it); } } if (flat.length) sections.push({ title: 'Results', items: flat }); }
      const top = findFirst(d, 'musicCardShelfRenderer');
      if (top) { const info = endpointInfo(findFirst(top.title || {}, 'navigationEndpoint') || (top.title.runs && top.title.runs[0].navigationEndpoint)); sections.unshift({ title: 'Top result', items: [{ type: info.videoId ? 'song' : info.browseType || 'song', title: text(top.title), subtitle: text(top.subtitle), thumbnail: thumbs(top.thumbnail), ...info }] }); }
      res.json({ sections });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/suggest', async (req, res) => {
    try { const d = await yt('music/get_search_suggestions', { input: req.query.q || '' }); res.json({ suggestions: findAll(d, 'searchSuggestionRenderer').map((s) => text(s.suggestion)) }); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
