source /home/ec2-user/.bashrc
source /home/ec2-user/.bash_profile

# 포트 3000(blue)이 사용중인지 확인
if lsof -i:3000 > /dev/null; then
    CURRENT_VERSION="blue"
    echo "blue" > /home/ec2-user/logs.log
elif lsof -i:3001 > /dev/null; then
    CURRENT_VERSION="green"
    echo "green" > /home/ec2-user/logs.log
else
    CURRENT_VERSION="none"
    echo "none" > /home/ec2-user/logs.log
fi

# nginx 설정 파일 복사 및 설정
NGINX_CONF_PATH="/home/ec2-user/nginx.conf"

# 첫 배포이거나 blue가 실행 중이면 green 시작
if [ "$CURRENT_VERSION" = "none" ] || [ "$CURRENT_VERSION" = "blue" ]; then
    cd /home/ec2-user/market-api-green
    PORT=3001 pm2 start ecosystem.config.js --only market-api-green
    
    # nginx 설정 업데이트
    cp nginx.conf $NGINX_CONF_PATH
    sudo sed -i 's/default "backend_blue"/default "backend_green"/' $NGINX_CONF_PATH || {
        echo "Failed to update nginx configuration" >> /home/ec2-user/logs.log
        pm2 stop market-api-green
        exit 1
    }
else
    cd /home/ec2-user/market-api-blue
    PORT=3000 pm2 start ecosystem.config.js --only market-api-blue
    
    # nginx 설정 업데이트
    cp nginx.conf $NGINX_CONF_PATH
    sudo sed -i 's/default "backend_green"/default "backend_blue"/' $NGINX_CONF_PATH || {
        echo "Failed to update nginx configuration" >> /home/ec2-user/logs.log
        pm2 stop market-api-blue
        exit 1
    }
fi

# nginx 설정 테스트
sudo nginx -t -c $NGINX_CONF_PATH || {
    echo "Nginx configuration test failed" >> /home/ec2-user/logs.log
    exit 1
}

# 기존 nginx 설정 백업 및 새 설정 적용
sudo cp $NGINX_CONF_PATH /etc/nginx/nginx.conf

# nginx 설정 리로드
sudo nginx -s reload || {
    echo "Failed to reload nginx"  >> /home/ec2-user/logs.log
    exit 1
}

# 새로운 버전이 정상적으로 시작되었는지 확인
sleep 5

# 헬스 체크
MAX_RETRIES=3
RETRY_COUNT=0
HEALTH_CHECK_URL=""

if [ "$CURRENT_VERSION" = "none" ] || [ "$CURRENT_VERSION" = "blue" ]; then
    HEALTH_CHECK_URL="http://127.0.0.1:3001"
else
    HEALTH_CHECK_URL="http://127.0.0.1:3000"
fi

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Health check URL: $HEALTH_CHECK_URL" >> /home/ec2-user/logs.log
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)
    echo "Health check result: $HEALTH_CHECK" >> /home/ec2-user/logs.log
    
    if [ "$HEALTH_CHECK" = "200" ]; then
        echo "Health check passed" >> /home/ec2-user/logs.log
        if [ "$CURRENT_VERSION" = "blue" ]; then
            pm2 stop market-api-blue
        else
            pm2 stop market-api-green
        fi
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT+1))
    [ $RETRY_COUNT -lt $MAX_RETRIES ] && sleep 2
done

# 헬스 체크가 실패하면 롤백
echo "Health check failed after $MAX_RETRIES attempts. Rolling back..." >> /home/ec2-user/logs.log
if [ "$CURRENT_VERSION" = "none" ] || [ "$CURRENT_VERSION" = "blue" ]; then
    pm2 stop market-api-green
    # 이전 nginx 설정 복원
    cp nginx.conf $NGINX_CONF_PATH
    sudo sed -i 's/default "backend_green"/default "backend_blue"/' $NGINX_CONF_PATH
    sudo cp $NGINX_CONF_PATH /etc/nginx/nginx.conf
    # rm -rf /home/ec2-user/market-api-green
else
    pm2 stop market-api-blue
    # 이전 nginx 설정 복원
    cp nginx.conf $NGINX_CONF_PATH
    sudo sed -i 's/default "backend_blue"/default "backend_green"/' $NGINX_CONF_PATH
    sudo cp $NGINX_CONF_PATH /etc/nginx/nginx.conf
    # rm -rf /home/ec2-user/market-api-blue
fi

sudo nginx -s reload
exit 1
