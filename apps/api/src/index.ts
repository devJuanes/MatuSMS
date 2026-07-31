import { startServer } from './app.js';

startServer().catch((err) => {
  console.error('Failed to start MatuSMS API:', err);
  process.exit(1);
});
