const createApp = require('./src/app');
const app = createApp();
const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, '0.0.0.0', () => console.log(`Musera running on :${PORT}`));
module.exports = app;
