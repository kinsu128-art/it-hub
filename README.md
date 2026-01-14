# IT-Hub - IT 자산 관리 시스템

전산실 통합 IT 인프라 관리 시스템

## 기능

### 현재 구현된 기능
- ✅ 사용자 인증 (로그인/로그아웃)
- ✅ PC/노트북 자산 관리
  - 목록 조회 (페이지네이션, 검색, 필터)
  - 등록, 수정, 삭제 (폐기 처리)
  - 상세 정보 및 변경 이력 조회
  - 상태 관리 (지급/재고/수리중/폐기)

### 계획된 기능
- ⏳ 서버 자산 관리
- ⏳ 네트워크 IP 관리
- ⏳ 프린터 자산 관리
- ⏳ 소프트웨어 라이선스 관리
- ⏳ 대시보드 (통계, 차트)
- ⏳ Excel 업로드/다운로드
- ⏳ 보고서 생성

## 시작하기

### 설치

```bash
npm install
```

### 데이터베이스 초기화

```bash
npm run db:init
```

이 명령은 다음을 수행합니다:
- SQLite 데이터베이스 파일 생성 (`database/ithub.db`)
- 테이블 스키마 생성
- 기본 관리자 계정 생성 (admin/admin123)

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어주세요.

### 로그인

- **사용자명**: admin
- **비밀번호**: admin123

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: SQLite (sql.js)
- **인증**: iron-session
- **차트**: Recharts (예정)

## 프로젝트 구조

```
├── app/
│   ├── (auth)/          # 인증 페이지
│   ├── (dashboard)/     # 대시보드 페이지
│   └── api/             # API 엔드포인트
├── components/          # React 컴포넌트
├── lib/                 # 유틸리티 및 라이브러리
├── types/               # TypeScript 타입
└── database/            # SQLite 데이터베이스 파일
```

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/session` - 세션 확인

### PC 자산
- `GET /api/pc` - 목록 조회
- `POST /api/pc` - 등록
- `GET /api/pc/[id]` - 상세 조회
- `PUT /api/pc/[id]` - 수정
- `DELETE /api/pc/[id]` - 폐기

## 개발 가이드

자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 라이선스

MIT
