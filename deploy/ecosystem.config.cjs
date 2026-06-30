module.exports = {
  apps: [
    {
      name: 'keenway',
      script: 'server.js',
      cwd: '/var/www/keenway',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/www/keenway/logs/pm2-error.log',
      out_file: '/var/www/keenway/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
