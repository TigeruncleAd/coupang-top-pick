module.exports = {
  apps: [
    {
      name: 'market-api-blue',
      script: '.next/standalone/apps/market-api/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },

      out_file: '/home/ec2-user/logs/market-api-blue.log',
      error_file: '/home/ec2-user/logs/market-api-blue-error.log',
      merge_logs: true,
    },
    {
      name: 'market-api-green',
      script: '.next/standalone/apps/market-api/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
      },
      out_file: '/home/ec2-user/logs/market-api-green.log',
      error_file: '/home/ec2-user/logs/market-api-green-error.log',
      merge_logs: true,
    },
  ],
}
