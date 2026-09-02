const { yt } = require('../services/yt');
const { findFirst, parseSections } = require('../utils/parser');
const { cached } = require('../utils/cache');
module.exports = (app) => {
  app.get('/api/home', async (req, res) => {
    try {
      const data = await cached('home_ID', 10 * 60 * 1000, async () => {
        let d = await yt('browse', { browseId: 'FEmusic_home' });
        let sections = []; let sl = findFirst(d, 'sectionListRenderer');
        if (sl) sections = parseSections(sl.contents);
        let cont = sl && sl.continuations && sl.continuations[0] && sl.continuations[0].nextContinuationData; let n = 0;
        while (cont && n < 3) { const d2 = await yt('browse', {}, `&ctoken=${cont.continuation}&continuation=${cont.continuation}&type=next`); const slc = findFirst(d2, 'sectionListContinuation'); if (!slc) break; sections = sections.concat(parseSections(slc.contents)); cont = slc.continuations && slc.continuations[0] && slc.continuations[0].nextContinuationData; n++; }
        return { sections };
      });
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/charts', async (req, res) => {
    try {
      const data = await cached('charts', 30 * 60 * 1000, async () => { const d = await yt('browse', { browseId: 'FEmusic_charts' }); const sl = findFirst(d, 'sectionListRenderer'); return { sections: sl ? parseSections(sl.contents) : [] }; });
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/api/moods', async (req, res) => {
    try {
      const data = await cached('moods', 60 * 60 * 1000, async () => {
        const d = await yt('browse', { browseId: 'FEmusic_moods_and_genres' });
        const cats = require('../utils/parser').findAll(d, 'musicNavigationButtonRenderer').map((b) => ({ title: require('../utils/parser').text(b.buttonText), color: b.solid ? '#' + (b.solid.leftStripeColor >>> 0).toString(16).padStart(8, '0').slice(2) : null, browseId: b.clickCommand && b.clickCommand.browseEndpoint && b.clickCommand.browseEndpoint.browseId, params: b.clickCommand && b.clickCommand.browseEndpoint && b.clickCommand.browseEndpoint.params }));
        return { categories: cats.filter((c) => c.browseId) };
      });
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
