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

### 환경 변수 설정

`.env.example`을 `.env.local`로 복사하고 Supabase 자격증명을 입력하세요:

```bash
cp .env.example .env.local
```

필수 환경 변수:
- `SESSION_SECRET`: 세션 암호화 키 (32자 이상의 임의 문자열)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 API 키
- `DATABASE_URL`: Supabase PostgreSQL 연결 문자열 (Connection Pooler)

### 데이터베이스 초기화

**중요**: Supabase에서 처음으로 연결할 때는 반드시 데이터베이스를 초기화해야 합니다.

```bash
npm run db:init
```

이 명령어는:
- 모든 데이터베이스 테이블을 생성합니다
- 기본 관리자 계정을 만듭니다 (admin / admin123)
- 필요한 인덱스를 생성합니다

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어주세요.

### 로그인

- **사용자명**: admin
- **비밀번호**: admin123

### 데이터베이스 연결 테스트

```bash
node scripts/test-connection.js
```

데이터베이스 연결 상태를 확인할 수 있습니다.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase PostgreSQL
- **데이터베이스 클라이언트**: pg (PostgreSQL 네이티브 드라이버)
- **인증**: iron-session (쿠키 기반 세션)
- **차트**: Recharts
- **호스팅**: Vercel

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

## Vercel 배포

### 배포 전 준비

1. Vercel 계정 생성: [vercel.com](https://vercel.com)
2. GitHub 저장소 연결
3. Vercel 환경 변수 설정:
   - `SESSION_SECRET`: 세션 암호화 키
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
   - `DATABASE_URL`: Supabase 데이터베이스 연결 문자열

### 자동 배포

GitHub main 브랜치에 푸시하면 Vercel에서 자동으로 배포됩니다.

### 수동 배포

```bash
npm run build
npm start
```

## 문제 해결

### 대시보드 통계가 보이지 않음

대시보드 통계가 나타나지 않으면 다음을 확인하세요:

1. **데이터베이스 초기화 확인**
   ```bash
   npm run db:init
   ```

2. **데이터베이스 연결 확인**
   ```bash
   node scripts/test-connection.js
   ```

3. **자산 데이터 확인**
   - 대시보드는 생성된 자산 데이터를 기반으로 통계를 표시합니다
   - 아직 자산을 등록하지 않았다면 통계는 0으로 표시됩니다
   - PC, 서버, 프린터 등의 자산을 등록하면 통계가 업데이트됩니다

## 개발 가이드

자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 라이선스

MIT
