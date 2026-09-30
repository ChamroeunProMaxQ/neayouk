const path = require('path');

module.exports = {
  apps: [
    {
      name: 'neayouk-api',
      script: 'dist/main.js',
      cwd: path.resolve(__dirname, 'apps/api'),
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--enable-source-maps',

      // Graceful shutdown & restart settings
      kill_timeout: 5000,
      restart_delay: 2000,
      exp_backoff_restart_delay: 100,
      min_uptime: '10s',
      max_restarts: 10,

      // Logging
      error_file: path.resolve(__dirname, 'logs/api-error.log'),
      out_file: path.resolve(__dirname, 'logs/api-out.log'),
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'stg',
        PORT: 3000,
      },
    },
  ],
};
