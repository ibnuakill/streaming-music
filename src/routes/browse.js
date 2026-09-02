const { browsePage } = require('../services/browse');
module.exports = (app) => {
  app.get('/api/browse', async (req, res) => {
    try { res.json(await browsePage(req.query.id, req.query.params)); } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
