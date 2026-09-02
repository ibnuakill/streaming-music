const express = require('express');
const path = require('path');

function createApp() {
  const app = express();
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  require('./routes/home')(app);
  require('./routes/search')(app);
  require('./routes/player')(app);
  require('./routes/browse')(app);
  require('./routes/lyrics')(app);
  require('./routes/misc')(app);

  app.use((req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
  return app;
}
module.exports = createApp;
