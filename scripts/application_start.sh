#!/bin/bash
source /home/ec2-user/.bashrc
source /home/ec2-user/.bash_profile


sudo chmod +x /home/ec2-user/king-sourcing-ui/**
cd /home/ec2-user/king-sourcing-ui
yes | pnpm install
pnpm generate

cd /home/ec2-user/king-sourcing-ui/apps/king-sourcing-ui
pm2 start ecosystem.config.js --name king-sourcing-ui --time
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:./cw-config.json