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

# 첫 배포가 아닌 경우에만 중지
if [ "$CURRENT_VERSION" != "none" ]; then
    if [ "$CURRENT_VERSION" = "blue" ]; then
        # blue가 실행 중이면 green 중지
        pm2 stop market-api-green 2>/dev/null || true
        # 이전 green 디렉토리 삭제
        rm -rf /home/ec2-user/market-api-green
    else
        # green이 실행 중이면 blue 중지
        pm2 stop market-api-blue 2>/dev/null || true
        # 이전 blue 디렉토리 삭제
        rm -rf /home/ec2-user/market-api-blue
    fi
fi
