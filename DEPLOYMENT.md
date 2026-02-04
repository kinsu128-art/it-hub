# IT-Hub 서버 배포 가이드

## 배포 환경 요구사항

### 서버 스펙
- **OS**: Linux (Ubuntu 20.04+ 권장) 또는 Windows Server
- **CPU**: 2 Core 이상
- **RAM**: 4GB 이상
- **Storage**: 20GB 이상
- **Docker**: Docker 20.10+ 및 Docker Compose v2

### 네트워크 요구사항
- 포트 3000 개방 (또는 원하는 포트)
- MSSQL 서버 접근 가능 (192.168.1.11:2433)

---

## 배포 방법

### 방법 1: Docker Compose (권장)

#### 1. 서버에 Docker 설치

**Ubuntu/Debian:**
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER
newgrp docker

# 설치 확인
docker --version
docker compose version
```

**Windows Server:**
Docker Desktop for Windows 설치: https://docs.docker.com/desktop/install/windows-install/

#### 2. 프로젝트 배포

```bash
# 1. 프로젝트 클론 또는 복사
git clone https://github.com/kinsu128-art/dklok_it.git
cd dklok_it

# 또는 직접 업로드
scp -r it-hub/ user@server:/path/to/deployment/

# 2. 환경 변수 설정
cp .env.example .env.production

# 3. .env.production 파일 수정 (아래 참조)
nano .env.production

# 4. Docker 이미지 빌드
docker compose build

# 5. 컨테이너 실행
docker compose up -d

# 6. 로그 확인
docker compose logs -f

# 7. 컨테이너 상태 확인
docker ps
```

#### 3. 환경 변수 설정 (.env.production)

```bash
# MSSQL Database Configuration
DB_SERVER=192.168.1.11
DB_PORT=2433
DB_DATABASE=dk_it
DB_USER=dkenterb
DB_PASSWORD=Micro@4580

# Security - IMPORTANT: Change these in production!
SESSION_SECRET=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_AT_LEAST_32_CHARACTERS_LONG
JWT_SECRET_KEY=CHANGE_THIS_TO_ANOTHER_SECURE_RANDOM_STRING

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeThisPassword123!

# Application Settings
MAX_FILE_SIZE=10
PAGE_SIZE=20
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000
NODE_ENV=production
```

**보안 강화:**
```bash
# 강력한 랜덤 문자열 생성 (Linux)
openssl rand -base64 32

# PowerShell에서 생성
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 4. Nginx 리버스 프록시 설정 (선택사항)

**Nginx 설치:**
```bash
sudo apt update
sudo apt install nginx
```

**Nginx 설정 파일 생성:**
```bash
sudo nano /etc/nginx/sites-available/ithub
```

**설정 내용:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 또는 서버 IP

    # SSL 설정 (Let's Encrypt 사용 시)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Nginx 활성화:**
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/ithub /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 부팅 시 자동 시작
sudo systemctl enable nginx
```

---

### 방법 2: PM2를 사용한 Node.js 직접 배포

#### 1. Node.js 설치

```bash
# Node.js 20.x 설치 (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 확인
node --version
npm --version
```

#### 2. PM2 설치

```bash
sudo npm install -g pm2
```

#### 3. 프로젝트 배포

```bash
# 1. 프로젝트 디렉토리로 이동
cd /path/to/it-hub

# 2. 의존성 설치
npm ci --production

# 3. Next.js 빌드
npm run build

# 4. PM2로 실행
pm2 start npm --name "it-hub" -- start

# 5. 부팅 시 자동 시작 설정
pm2 startup
pm2 save

# 6. 상태 확인
pm2 status
pm2 logs it-hub

# 7. 모니터링
pm2 monit
```

---

## 배포 후 확인 사항

### 1. 서비스 접속 확인
```bash
# 로컬에서 테스트
curl http://localhost:3000

# 외부에서 접속
curl http://your-server-ip:3000
```

### 2. MSSQL 연결 확인
서버 로그에서 "✅ Connected to MSSQL Server" 메시지 확인

### 3. 로그인 테스트
- URL: http://your-server-ip:3000
- 아이디: admin
- 비밀번호: (설정한 ADMIN_PASSWORD)

### 4. 방화벽 설정 (필요 시)

**Ubuntu (UFW):**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 유지보수 및 관리

### Docker Compose 명령어

```bash
# 컨테이너 시작
docker compose up -d

# 컨테이너 중지
docker compose down

# 로그 확인
docker compose logs -f

# 컨테이너 재시작
docker compose restart

# 이미지 재빌드
docker compose build --no-cache

# 컨테이너 상태 확인
docker ps

# 컨테이너 내부 접속
docker compose exec app sh
```

### PM2 명령어

```bash
# 서비스 시작
pm2 start it-hub

# 서비스 중지
pm2 stop it-hub

# 서비스 재시작
pm2 restart it-hub

# 로그 확인
pm2 logs it-hub

# 상태 확인
pm2 status

# 모니터링
pm2 monit

# 서비스 삭제
pm2 delete it-hub
```

### 백업

**데이터베이스 백업:**
```bash
# MSSQL 서버에서 백업
sqlcmd -S 192.168.1.11,2433 -U dkenterb -P Micro@4580 -Q "BACKUP DATABASE dk_it TO DISK='/backup/dk_it_backup.bak'"
```

---

## 보안 체크리스트

- [ ] SESSION_SECRET를 강력한 랜덤 문자열로 변경
- [ ] JWT_SECRET_KEY를 강력한 랜덤 문자열로 변경
- [ ] ADMIN_PASSWORD를 강력한 비밀번호로 변경
- [ ] MSSQL 비밀번호 보안 확인
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] HTTPS 설정 (SSL 인증서)
- [ ] 정기적인 보안 업데이트
- [ ] 로그 모니터링

---

## 문제 해결

### 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker compose logs

# 컨테이너 상태 확인
docker ps -a

# 이미지 재빌드
docker compose build --no-cache
docker compose up -d
```

### MSSQL 연결 실패

1. MSSQL 서버 접근 가능 여부 확인:
```bash
telnet 192.168.1.11 2433
```

2. 환경 변수 확인:
```bash
docker compose exec app env | grep DB_
```

### 포트 충돌

```bash
# 포트 사용 확인 (Linux)
sudo netstat -tlnp | grep 3000

# 포트 사용 확인 (Windows)
netstat -ano | findstr :3000
```

---

## 성능 최적화

### Docker 리소스 제한

`docker-compose.yml`에 추가:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Node.js 메모리 증가

```bash
# PM2 사용 시
pm2 start npm --name "it-hub" --node-args="--max-old-space-size=2048" -- start
```

---

## 모니터링

### 헬스체크 엔드포인트

URL: http://your-server:3000/api/health

응답 예시:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 로그 수집

```bash
# Docker 로그
docker compose logs -f --tail=100

# PM2 로그
pm2 logs it-hub --lines 100
```

---

## 업데이트 프로세스

```bash
# 1. 코드 업데이트
git pull origin main

# 2. 의존성 업데이트
npm install

# 3. 빌드 (Docker)
docker compose build

# 4. 무중단 재시작
docker compose up -d --no-deps --build app

# 또는 PM2
pm2 reload it-hub
```

---

## 지원 및 문서

- GitHub: https://github.com/kinsu128-art/dklok_it
- MSSQL 스키마: `scripts/init-db-mssql.sql`
- 환경 변수: `.env.example`
