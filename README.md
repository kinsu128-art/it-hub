# IT-Hub - IT 자산 관리 시스템

전산실 통합 IT 인프라 관리 시스템

**Next.js 14 (App Router) + MSSQL + Docker**

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📋 목차

- [기능](#-기능)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [Docker 배포](#-docker-배포)
- [프로젝트 구조](#-프로젝트-구조)
- [API 엔드포인트](#-api-엔드포인트)
- [문서](#-문서)

---

## ✨ 기능

### 현재 구현된 기능

- ✅ **사용자 인증** (로그인/로그아웃)
- ✅ **PC/노트북 자산 관리**
  - 목록 조회 (페이지네이션, 검색, 필터)
  - 등록, 수정, 삭제 (폐기 처리)
  - 상세 정보 및 변경 이력 조회
  - 상태 관리 (지급/재고/수리중/폐기)
- ✅ **서버 자산 관리**
- ✅ **네트워크 IP 관리**
- ✅ **프린터 자산 관리**
- ✅ **소프트웨어 라이선스 관리**
- ✅ **대시보드** (통계, 차트)
- ✅ **변경 이력 추적** (모든 자산 변경 기록)
- ✅ **보고서 생성** (기간별 통계)

### 계획된 기능

- ⏳ Excel 업로드/다운로드
- ⏳ IP 맵 시각화
- ⏳ 고급 보고서 및 분석

---

## 🛠 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript 5.4
- **스타일링**: Tailwind CSS
- **차트**: Recharts
- **상태 관리**: React Hooks

### 백엔드
- **데이터베이스**: Microsoft SQL Server (MSSQL)
- **DB 드라이버**: mssql (node-mssql)
- **인증**: iron-session (쿠키 기반 세션)
- **비밀번호**: bcryptjs

### 인프라
- **컨테이너**: Docker + Docker Compose
- **배포**: Docker Standalone
- **환경**: Node.js 20 Alpine

---

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js** 20.x 이상
- **MSSQL Server** (외부 서버 또는 로컬)
- **Docker** (선택사항 - Docker 배포 시)

### 1. 프로젝트 클론

```bash
git clone https://github.com/kinsu128-art/dklok_it.git
cd dklok_it
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example`을 `.env.local`로 복사하고 설정을 입력하세요:

```bash
cp .env.example .env.local
```

**.env.local 설정:**

```bash
# MSSQL Database Configuration
DB_SERVER=192.168.1.11
DB_PORT=2433
DB_DATABASE=dk_it
DB_USER=dkenterb
DB_PASSWORD=Micro@4580

# Session Secret (32자 이상의 강력한 랜덤 문자열)
SESSION_SECRET=your-secret-key-here-must-be-at-least-32-characters-long

# JWT Secret Key
JWT_SECRET_KEY=your-jwt-secret-key-here

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Application Settings
MAX_FILE_SIZE=10
PAGE_SIZE=20
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**보안 강화 - 강력한 랜덤 문자열 생성:**

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 4. 데이터베이스 초기화

MSSQL 서버에서 다음 SQL 스크립트를 실행하세요:

```bash
# MSSQL 서버에 접속하여 스크립트 실행
sqlcmd -S 192.168.1.11,2433 -U dkenterb -P Micro@4580 -i scripts/init-db-mssql.sql
```

또는 Azure Data Studio, SSMS 등의 GUI 도구로 [scripts/init-db-mssql.sql](scripts/init-db-mssql.sql) 파일을 실행하세요.

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 6. 로그인

- **아이디**: `admin`
- **비밀번호**: `admin123`

---

## 🐳 Docker 배포

### Docker로 빠른 실행

Docker Desktop이 설치되어 있다면:

```bash
# 1. 환경 변수 설정
cp .env.docker .env.production
# .env.production 파일을 편집하여 보안 설정 변경

# 2. 이미지 빌드
npm run docker:build

# 3. 컨테이너 실행 (백그라운드)
npm run docker:prod

# 4. 로그 확인
npm run docker:logs
```

### Docker 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run docker:build` | Docker 이미지 빌드 |
| `npm run docker:dev` | 개발 모드 실행 (로그 출력) |
| `npm run docker:prod` | 프로덕션 실행 (백그라운드) |
| `npm run docker:down` | 컨테이너 중지 |
| `npm run docker:logs` | 로그 실시간 확인 |
| `npm run docker:restart` | 컨테이너 재시작 |
| `npm run docker:ps` | 상태 확인 |
| `npm run docker:clean` | 완전 정리 |

### 상세 Docker 가이드

자세한 Docker 사용법은 [DOCKER_GUIDE.md](DOCKER_GUIDE.md)를 참조하세요.

### 서버 배포 가이드

프로덕션 서버 배포는 [DEPLOYMENT.md](DEPLOYMENT.md)를 참조하세요.

---

## 📁 프로젝트 구조

```
it-hub/
├── app/                        # Next.js App Router
│   ├── (auth)/                # 인증 페이지 (로그인)
│   ├── (dashboard)/           # 대시보드 페이지 (보호됨)
│   │   ├── dashboard/         # 메인 대시보드
│   │   ├── pc/               # PC 자산 관리
│   │   ├── server/           # 서버 관리
│   │   ├── network/          # 네트워크 IP 관리
│   │   ├── printer/          # 프린터 관리
│   │   └── software/         # 소프트웨어 관리
│   └── api/                  # API 엔드포인트
│       ├── auth/             # 인증 API
│       ├── pc/               # PC CRUD API
│       ├── server/           # 서버 CRUD API
│       ├── network/          # 네트워크 CRUD API
│       ├── printer/          # 프린터 CRUD API
│       ├── software/         # 소프트웨어 CRUD API
│       └── reports/          # 보고서 API
├── components/                # React 컴포넌트
│   ├── common/               # 공통 컴포넌트 (Button, Loading 등)
│   ├── forms/                # 폼 컴포넌트
│   └── layout/               # 레이아웃 (Header, Sidebar)
├── lib/                       # 라이브러리 및 유틸리티
│   ├── auth/                 # 인증 유틸리티
│   ├── db/                   # 데이터베이스 레이어
│   │   ├── index.ts          # MSSQL 연결 및 쿼리 헬퍼
│   │   ├── history.ts        # 변경 이력 관리
│   │   └── schema.ts         # 데이터베이스 스키마 문서
│   └── utils/                # 유틸리티 함수
├── types/                     # TypeScript 타입 정의
├── scripts/                   # 유틸리티 스크립트
│   ├── init-db-mssql.sql     # MSSQL 스키마 초기화
│   ├── fix-admin-password.js # 관리자 비밀번호 재설정
│   └── update-admin-password.sql
├── .env.example              # 환경 변수 예제
├── .env.docker               # Docker 환경 변수 템플릿
├── Dockerfile                # Docker 이미지 설정
├── docker-compose.yml        # Docker Compose 설정
├── DOCKER_GUIDE.md           # Docker 사용 가이드
└── DEPLOYMENT.md             # 서버 배포 가이드
```

---

## 🔌 API 엔드포인트

### 인증

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/session` | 세션 확인 |

### PC 자산

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/pc` | PC 목록 조회 (페이지네이션, 검색, 필터) |
| POST | `/api/pc` | PC 등록 |
| GET | `/api/pc/[id]` | PC 상세 조회 |
| PUT | `/api/pc/[id]` | PC 수정 |
| DELETE | `/api/pc/[id]` | PC 폐기 |

### 서버 자산

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/server` | 서버 목록 조회 |
| POST | `/api/server` | 서버 등록 |
| GET | `/api/server/[id]` | 서버 상세 조회 |
| PUT | `/api/server/[id]` | 서버 수정 |
| DELETE | `/api/server/[id]` | 서버 삭제 |

### 네트워크 IP

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/network` | IP 목록 조회 |
| POST | `/api/network` | IP 등록 |
| GET | `/api/network/[id]` | IP 상세 조회 |
| PUT | `/api/network/[id]` | IP 수정 |
| DELETE | `/api/network/[id]` | IP 삭제 |

### 프린터

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/printer` | 프린터 목록 조회 |
| POST | `/api/printer` | 프린터 등록 |
| GET | `/api/printer/[id]` | 프린터 상세 조회 |
| PUT | `/api/printer/[id]` | 프린터 수정 |
| DELETE | `/api/printer/[id]` | 프린터 삭제 |

### 소프트웨어

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/software` | 소프트웨어 목록 조회 |
| POST | `/api/software` | 소프트웨어 등록 |
| GET | `/api/software/[id]` | 소프트웨어 상세 조회 |
| PUT | `/api/software/[id]` | 소프트웨어 수정 |
| DELETE | `/api/software/[id]` | 소프트웨어 삭제 |

### 보고서

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/reports` | 통계 보고서 조회 (기간별) |

---

## 📚 문서

- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Docker 환경 사용 가이드
- [DEPLOYMENT.md](DEPLOYMENT.md) - 서버 배포 가이드
- [scripts/init-db-mssql.sql](scripts/init-db-mssql.sql) - 데이터베이스 스키마

---

## 🔒 보안

### 프로덕션 배포 전 필수 체크리스트

- [ ] `SESSION_SECRET`를 강력한 랜덤 문자열로 변경 (32자 이상)
- [ ] `JWT_SECRET_KEY`를 강력한 랜덤 문자열로 변경
- [ ] `ADMIN_PASSWORD`를 보안성 높은 비밀번호로 변경
- [ ] MSSQL 비밀번호 보안 확인
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] HTTPS 설정 (Nginx 리버스 프록시 권장)
- [ ] 정기적인 보안 업데이트 계획
- [ ] 데이터베이스 백업 스케줄 설정

---

## 🐛 문제 해결

### MSSQL 연결 실패

```bash
# 1. MSSQL 서버 접근 확인
telnet 192.168.1.11 2433

# 2. 환경 변수 확인
cat .env.local

# 3. 방화벽 확인
# MSSQL 서버의 2433 포트가 열려 있는지 확인
```

### 관리자 비밀번호 재설정

```bash
# JavaScript 스크립트 사용
node scripts/fix-admin-password.js

# 또는 SQL 직접 실행
sqlcmd -S 192.168.1.11,2433 -U dkenterb -P Micro@4580 -i scripts/update-admin-password.sql
```

### Docker 빌드 실패

```bash
# 캐시 무시하고 재빌드
docker-compose build --no-cache

# 완전 정리 후 재시작
npm run docker:clean
npm run docker:build
npm run docker:prod
```

---

## 📝 개발 스크립트

### NPM 스크립트

```bash
# 개발
npm run dev          # 개발 서버 시작 (http://localhost:3000)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 시작
npm run lint         # ESLint 실행

# Docker
npm run docker:build   # Docker 이미지 빌드
npm run docker:dev     # 개발 모드 실행
npm run docker:prod    # 프로덕션 실행 (백그라운드)
npm run docker:down    # 컨테이너 중지
npm run docker:logs    # 로그 확인
npm run docker:restart # 재시작
npm run docker:clean   # 완전 정리
npm run docker:ps      # 상태 확인
```

---

## 📄 라이선스

MIT License

---

## 👥 기여

이슈 및 풀 리퀘스트를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 지원

문제가 발생하면:
- [GitHub Issues](https://github.com/kinsu128-art/dklok_it/issues)
- [문제 해결](#-문제-해결) 섹션 확인
- [DEPLOYMENT.md](DEPLOYMENT.md) 참조

---

**Made with ❤️ for IT Infrastructure Management**
