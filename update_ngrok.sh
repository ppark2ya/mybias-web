#!/bin/bash

# 1. 기존에 켜져 있는 ngrok이 있다면 종료 (충돌 방지)
pkill -f ngrok

# 2. ngrok을 백그라운드에서 실행 (로그는 버림)
nohup ngrok http 8788 > /dev/null 2>&1 &

echo "🔄 ngrok 실행 중... URL을 받아오는 중입니다..."
sleep 3 # ngrok이 켜질 때까지 잠시 대기

# 3. ngrok 로컬 API를 찔러서 Public URL 가져오기
# (Mac/Linux에 기본 내장된 curl과 grep 사용)
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.dev')

if [ -z "$NGROK_URL" ]; then
  echo "❌ ngrok URL을 가져오는데 실패했습니다."
  exit 1
fi

echo "✅ 감지된 URL: $NGROK_URL"

# 4. .dev.vars 파일 업데이트
FILE=".dev.vars"

# 파일이 없으면 생성
if [ ! -f "$FILE" ]; then
  touch "$FILE"
fi

# OS별 sed 명령어가 달라서 분기 처리 (Mac vs Linux)
# 주의: ^BASE_URL= 패턴으로 라인 시작 부분만 매칭 (R2_PUBLIC_URL 등 다른 키에 포함된 경우 제외)
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "✅ mac os!"
  # Mac (BSD sed)
  # BASE_URL이 있으면 교체, 없으면 맨 아래 추가
  if grep -q "^BASE_URL=" "$FILE"; then
    sed -i '' "s|^BASE_URL=.*|BASE_URL=$NGROK_URL|" "$FILE"
  else
    echo "BASE_URL=$NGROK_URL" >> "$FILE"
  fi
else
  # Linux (GNU sed)
  if grep -q "^BASE_URL=" "$FILE"; then
    sed -i "s|^BASE_URL=.*|BASE_URL=$NGROK_URL|" "$FILE"
  else
    echo "BASE_URL=$NGROK_URL" >> "$FILE"
  fi
fi

echo "📝 .dev.vars 파일에 BASE_URL이 업데이트되었습니다!"