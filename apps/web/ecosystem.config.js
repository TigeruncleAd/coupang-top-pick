module.exports = {
  apps: [
    {
      name: 'king-sourcing-ui',
      script: 'pnpm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },
      merge_logs: true,
    },
  ],
}

// sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/home/ec2-user/cw-config.json
