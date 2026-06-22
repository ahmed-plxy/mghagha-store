const env = require('./config/env');
const app = require('./app');
const { startBackupScheduler } = require('./db/backup');

startBackupScheduler();

app.listen(env.port, () => {
  console.log(`✔ Mghagha Store server running on http://localhost:${env.port}`);
});
