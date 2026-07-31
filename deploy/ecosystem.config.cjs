/**
 * PM2 — MatuSMS API (producción)
 *
 * Uso en el servidor:
 *   export MATUSMS_ROOT=/root/apps/MatuSMS
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save
 */
const path = require('node:path');

const root = process.env.MATUSMS_ROOT || '/root/apps/MatuSMS';
const apiDir = path.join(root, 'apps/api');

module.exports = {
  apps: [
    {
      name: 'matusms-api',
      cwd: apiDir,
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      error_file: path.join(root, 'logs/pm2-api-error.log'),
      out_file: path.join(root, 'logs/pm2-api-out.log'),
      merge_logs: true,
    },
  ],
};
