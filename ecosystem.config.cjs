/**
 * ==============================================================================
 * BUKAR DATA SUB — PM2 PRODUCTION PROCESS CONFIGURATION
 * ==============================================================================
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'bukar-data-sub',
      script: 'node',
      args: '--import tsx backend/src/server.ts',
      cwd: __dirname,
      instances: 1, // Single instance for authoritative SQLite WAL mode ledger
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
