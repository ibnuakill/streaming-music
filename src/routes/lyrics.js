const { resolveLyrics } = require('../services/lyrics');
module.exports = (app) => {
  app.get('/api/lyrics', async (req, res) => {
    try { res.json(await resolveLyrics(req.query)); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
