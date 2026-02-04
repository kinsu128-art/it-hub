# Docker 환경 사용 가이드

## 📦 Docker 환경 구성 완료

IT-Hub 프로젝트가 Docker 환경으로 완전히 전환되었습니다.

### 구성 파일
- ✅ [Dockerfile](Dockerfile) - 멀티스테이지 빌드 설정
- ✅ [docker-compose.yml](docker-compose.yml) - 서비스 오케스트레이션
- ✅ [.dockerignore](.dockerignore) - 빌드 최적화
- ✅ [.env.docker](.env.docker) - Docker 환경 변수

## 🚀 빠른 시작

### 1. Docker 설치 (Windows)

Docker Desktop이 설치되어 있지 않다면 먼저 설치하세요:

**다운로드:** https://docs.docker.com/desktop/install/windows-install/

**설치 후 확인:**
```bash
docker --version
docker-compose --version
```

### 2. 환경 변수 설정

프로덕션 배포 시 `.env.docker` 파일을 수정하세요:

```bash
# 보안을 위해 반드시 변경해야 할 항목:
SESSION_SECRET=강력한_랜덤_문자열_32자_이상
JWT_SECRET_KEY=다른_강력한_랜덤_문자열
ADMIN_PASSWORD=보안성_높은_비밀번호

# 서버 URL 변경:
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000
```

**강력한 랜덤 문자열 생성:**

Windows PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Git Bash 또는 Linux:
```bash
openssl rand -base64 32
```

### 3. Docker 실행

#### 개발 모드 (로그 출력)
```bash
npm run docker:dev
# 또는
docker-compose up
```

#### 프로덕션 모드 (백그라운드)
```bash
npm run docker:prod
# 또는
docker-compose up -d
```

#### 처음 실행 시 (빌드 필요)
```bash
npm run docker:build
npm run docker:prod
```

### 4. 접속 확인

브라우저에서 http://localhost:3000 접속

- **아이디:** admin
- **비밀번호:** admin123 (변경 권장)

## 📋 Docker 명령어

### NPM 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run docker:build` | Docker 이미지 빌드 |
| `npm run docker:dev` | 개발 모드 실행 (로그 출력) |
| `npm run docker:prod` | 프로덕션 모드 실행 (백그라운드) |
| `npm run docker:down` | 컨테이너 중지 및 제거 |
| `npm run docker:logs` | 로그 실시간 확인 |
| `npm run docker:restart` | 컨테이너 재시작 |
| `npm run docker:ps` | 실행 중인 컨테이너 확인 |
| `npm run docker:clean` | 컨테이너와 볼륨 완전 제거 |

### Docker Compose 명령어

```bash
# 이미지 빌드
docker-compose build

# 컨테이너 시작 (포그라운드)
docker-compose up

# 컨테이너 시작 (백그라운드)
docker-compose up -d

# 컨테이너 중지
docker-compose down

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f app

# 컨테이너 재시작
docker-compose restart

# 컨테이너 상태 확인
docker-compose ps

# 컨테이너 내부 접속
docker-compose exec app sh

# 완전 정리 (볼륨 포함)
docker-compose down -v
```

### Docker 명령어

```bash
# 실행 중인 컨테이너 확인
docker ps

# 모든 컨테이너 확인 (중지된 것 포함)
docker ps -a

# 이미지 목록
docker images

# 컨테이너 로그
docker logs ithub-app

# 컨테이너 중지
docker stop ithub-app

# 컨테이너 시작
docker start ithub-app

# 컨테이너 내부 접속
docker exec -it ithub-app sh

# 사용하지 않는 이미지/컨테이너 정리
docker system prune -a
```

## 🔧 문제 해결

### 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker-compose logs

# 이미지 재빌드 (캐시 무시)
docker-compose build --no-cache

# 완전히 정리 후 재시작
docker-compose down -v
docker-compose build
docker-compose up -d
```

### MSSQL 연결 실패

1. **MSSQL 서버 접근 확인:**
```bash
# Windows
Test-NetConnection -ComputerName 192.168.1.11 -Port 2433

# Linux/Mac
telnet 192.168.1.11 2433
# 또는
nc -zv 192.168.1.11 2433
```

2. **환경 변수 확인:**
```bash
docker-compose exec app env | grep DB_
```

3. **방화벽 확인:**
- MSSQL 서버의 2433 포트가 열려 있는지 확인
- 네트워크 보안 그룹 규칙 확인

### 포트 충돌

3000번 포트가 이미 사용 중인 경우:

**docker-compose.yml 수정:**
```yaml
services:
  app:
    ports:
      - "8080:3000"  # 또는 다른 포트
```

### 이미지 용량 문제

```bash
# 빌드 캐시 정리
docker builder prune

# 사용하지 않는 이미지 정리
docker image prune -a
```

## 📊 모니터링

### 리소스 사용량 확인

```bash
# 실시간 모니터링
docker stats ithub-app

# 한 번만 확인
docker stats --no-stream ithub-app
```

### 헬스체크

```bash
# API 헬스체크 엔드포인트
curl http://localhost:3000/api/health
```

## 🔒 보안 권장사항

### 프로덕션 배포 전 체크리스트

- [ ] `.env.docker`의 `SESSION_SECRET` 변경 (32자 이상)
- [ ] `.env.docker`의 `JWT_SECRET_KEY` 변경
- [ ] `ADMIN_PASSWORD` 변경
- [ ] `NEXT_PUBLIC_APP_URL`을 실제 서버 주소로 변경
- [ ] MSSQL 비밀번호 보안 확인
- [ ] HTTPS 설정 (Nginx 리버스 프록시 사용)
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] 정기 백업 스케줄 설정

## 📁 Docker 환경 구조

```
it-hub/
├── Dockerfile                 # 멀티스테이지 빌드 설정
├── docker-compose.yml         # 서비스 오케스트레이션
├── .dockerignore             # 빌드에서 제외할 파일
├── .env.docker               # Docker 환경 변수
├── .env.example              # 환경 변수 예제
└── DOCKER_GUIDE.md           # 이 문서
```

## 🌐 서버 배포

자세한 서버 배포 가이드는 [DEPLOYMENT.md](DEPLOYMENT.md)를 참조하세요.

### 간단 배포 (Docker 설치된 서버)

```bash
# 1. 서버에 프로젝트 복사
scp -r it-hub/ user@server:/path/to/deployment/

# 2. 서버 접속
ssh user@server

# 3. 프로젝트 디렉토리로 이동
cd /path/to/deployment/it-hub

# 4. 환경 변수 설정
cp .env.docker .env.production
nano .env.production  # 보안 설정 변경

# 5. Docker 실행
docker-compose build
docker-compose up -d

# 6. 로그 확인
docker-compose logs -f
```

## 💡 팁

### 빠른 재배포

코드 변경 후:
```bash
docker-compose build
docker-compose up -d --no-deps app
```

### 로그 필터링

```bash
# 에러만 보기
docker-compose logs | grep ERROR

# 최근 100줄만 보기
docker-compose logs --tail=100

# 특정 시간 이후 로그
docker-compose logs --since 10m
```

### 백업

```bash
# 컨테이너 이미지 백업
docker save -o ithub-app.tar ithub-app

# 이미지 복원
docker load -i ithub-app.tar
```

## 📞 지원

문제가 발생하면:
1. [문제 해결](#-문제-해결) 섹션 확인
2. [DEPLOYMENT.md](DEPLOYMENT.md)의 문제 해결 섹션 확인
3. GitHub Issues 확인

---

**참고 문서:**
- [DEPLOYMENT.md](DEPLOYMENT.md) - 서버 배포 가이드
- [.env.example](.env.example) - 환경 변수 설정 예제
- [Dockerfile](Dockerfile) - Docker 이미지 빌드 설정
