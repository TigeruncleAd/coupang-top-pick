source /home/ec2-user/.bashrc
source /home/ec2-user/.bash_profile

#Nginx가 실행중인지 확인하고, 실행중이지 않으면 시작
if ! sudo systemctl is-active --quiet nginx; then
    sudo systemctl start nginx
fi

# 포트 3000(blue)이 사용중인지 확인
if lsof -i:3000 > /dev/null; then
    CURRENT_VERSION="blue"
elif lsof -i:3001 > /dev/null; then
    CURRENT_VERSION="green"
else
    CURRENT_VERSION="none"
fi

# 첫 배포이거나 blue가 실행 중이면 green으로 배포
if [ "$CURRENT_VERSION" = "none" ] || [ "$CURRENT_VERSION" = "blue" ]; then
    rm -rf /home/ec2-user/market-api-green
    mv /home/ec2-user/market-api-temp /home/ec2-user/market-api-green
    cd /home/ec2-user/market-api-green
else
    rm -rf /home/ec2-user/market-api-blue
    mv /home/ec2-user/market-api-temp /home/ec2-user/market-api-blue
    cd /home/ec2-user/market-api-blue
fi

