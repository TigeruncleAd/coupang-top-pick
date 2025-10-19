source /home/ec2-user/.bashrc
source /home/ec2-user/.bash_profile

# 포트로 현재 실행 중인 버전 확인
if lsof -i:3000 > /dev/null; then
    CURRENT_VERSION="blue"
elif lsof -i:3001 > /dev/null; then
    CURRENT_VERSION="green"
else
    CURRENT_VERSION="none"
fi

if [ "$CURRENT_VERSION" = "blue" ]; then
    cd /home/ec2-user/market-api-green
    # green으로 롤백
    PORT=3001 pm2 start ecosystem.config.js --only market-api-green
    sudo sed -i 's/default "backend_blue"/default "backend_green"/' /etc/nginx/nginx.conf
    sudo nginx -s reload
    pm2 stop market-api-blue
else
    cd /home/ec2-user/market-api-blue
    # blue로 롤백
    PORT=3000 pm2 start ecosystem.config.js --only market-api-blue
    sudo sed -i 's/default "backend_green"/default "backend_blue"/' /etc/nginx/nginx.conf
    sudo nginx -s reload
    pm2 stop market-api-green
fi 