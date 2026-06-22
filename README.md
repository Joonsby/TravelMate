# 🧳 우리 여행 (Travel Mate)

연인 둘이서 여행을 **함께 계획하고, 실시간으로 대화하고, 경비를 정산**하기 위한 모바일 웹(PWA) 앱입니다.
상업 서비스가 아니라 **실사용 2인 전용**으로, 1개월 안에 완성해 다음 여행에 바로 쓰는 것을 목표로 합니다.

> 설계 상세는 [`ARCHITECTURE.md`](./ARCHITECTURE.md) · 기술 결정 근거는 [`DECISIONS.md`](./DECISIONS.md) 참고.

---

## ✨ 프로젝트 소개

| 항목 | 내용 |
|------|------|
| 목적 | 커플 둘만 쓰는 여행 동반자 앱 |
| 사용자 | 2명 (고정) |
| 형태 | 모바일 웹 / 설치형 PWA |
| 개발 기간 | 약 1개월 |
| 운영비 | 월 $0 (전부 무료 티어) |

### 핵심 기능
- 🗓 **여행 일정** — 일자별 타임라인으로 일정 관리
- 💬 **실시간 채팅** — 둘만의 채팅방 (텍스트 전송 · 실시간 수신 · 시간 표시)
- 📝 **공유 메모** — 맛집·준비물·링크 등 자유 기록
- ✅ **체크리스트** — 준비물/할 일 체크, 담당자 지정
- 💰 **경비 관리** — 지출 기록 + 카테고리 합계 + 2인 정산

---

## 🛠 기술 스택

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** — 모바일 우선 스타일링
- **React Router v6** — 라우팅
- **TanStack Query** — 서버 상태(캐싱·재검증·낙관적 업데이트)
- **Zustand** — 전역 클라이언트 상태
- **React Hook Form** + **Zod** — 폼 & 검증

### Backend (BaaS)
- **Supabase** — Postgres · Auth · Realtime · Storage
  - 별도 서버 코드 없음. RLS(Row Level Security)로 인가 처리

### Infra
- **Vercel (Hobby)** — 프론트엔드 배포 · CDN · HTTPS
- **vite-plugin-pwa** — PWA 매니페스트 + 서비스워커
- **GitHub Actions** — Supabase 일시정지 방지 keep-alive cron

---

## 📁 폴더 구조

기능(feature) 중심 구조. 도메인별로 컴포넌트·훅·서비스를 한 폴더에 둡니다.

```
src/
├── main.tsx
├── App.tsx                      # 라우터 + Provider
├── lib/
│   ├── supabase.ts              # Supabase 클라이언트
│   ├── queryClient.ts           # TanStack Query 설정
│   └── utils/                   # 날짜·통화·이미지 압축
├── components/                  # 공용 UI (Button, BottomSheet, Avatar...)
│   └── layout/                  # AppShell, BottomTabBar, TripSwitcher
├── features/
│   ├── auth/                    # 로그인, useSession
│   ├── trips/                   # 여행 목록/생성
│   ├── itinerary/               # 일정
│   ├── chat/                    # 채팅 (Realtime)
│   ├── notes/                   # 메모
│   ├── checklist/               # 체크리스트
│   └── expense/                 # 경비 + 정산
├── store/
│   └── appStore.ts              # Zustand (currentTripId, theme...)
├── types/
│   └── database.types.ts        # supabase gen types 결과
├── routes/                      # 라우트 정의
└── styles/                      # tailwind, 글로벌

public/
├── manifest.webmanifest         # PWA
└── icons/                       # 앱 아이콘 (192/512)

.github/workflows/keepalive.yml  # Supabase 일시정지 방지 cron
```

> 각 feature 폴더 내부 권장: `components/`, `hooks/`, `service.ts`, `types.ts`, `index.ts`

---

## 🚀 실행 방법

### 사전 요구사항
- Node.js 18 이상
- pnpm (권장) 또는 npm
- Supabase 프로젝트 1개

### 1. 설치
```bash
git clone <https://github.com/Joonsby/TravelMate.git>
cd TravelMate
pnpm install        # 또는 npm install
```

### 2. 환경 변수 설정
루트에 `.env.local` 파일을 만들고 Supabase 값을 넣습니다.
(anon 키는 공개되어도 안전합니다 — 보안은 RLS가 담당)

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

`.env.example`을 참고하세요. **`.env.local`은 절대 커밋하지 않습니다.**

### 3. 데이터베이스 준비

> **상세 가이드:** 아래 "Supabase 초기 세팅 절차" 섹션을 반드시 따라주세요.  
> `supabase/init.sql`과 `supabase/verify.sql`로 세팅 및 검증을 완료해야 앱이 정상 동작합니다.

```bash
# (선택) Supabase CLI로 DB 타입 자동 생성
pnpm supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
```

---

## Supabase 초기 세팅 절차

> **한 번만 수행.** 프로젝트 최초 세팅 시 아래 순서를 정확히 따라야 합니다.  
> 순서를 건너뛰거나 `profiles` 연결을 빠뜨리면 로그인 후 모든 데이터가 빈 결과로 보입니다.

---

### 사전 지식: SQL Editor와 RLS

**Supabase SQL Editor는 service role(관리자) 권한**으로 실행됩니다.  
→ RLS를 우회하므로 여기서 보이는 데이터가 앱에서도 보인다는 의미가 아닙니다.  
→ 데이터 삽입·확인용으로만 사용하고, 실제 RLS 동작은 앱에서 로그인 후 확인해야 합니다.

---

### STEP 1 — schema.sql 적용

1. Supabase 대시보드 → **SQL Editor** 열기
2. [`supabase/schema.sql`](./supabase/schema.sql) 전체 복사 → 붙여넣기 → **Run**
3. 완료 메시지 확인 후 **Database > Tables**에서 9개 테이블 생성 확인:
   - `couples`, `profiles`, `trips`, `itinerary_items`
   - `messages`, `notes`, `checklists`, `checklist_items`, `expenses`

---

### STEP 2 — 계정 2개 생성

1. Supabase 대시보드 → **Authentication > Users**
2. **"Add user"** 버튼 → 첫 번째 계정(본인) 생성
   - Email: 본인 이메일
   - Password: 비밀번호 설정
   - **"Auto Confirm User" 체크** (이메일 인증 생략)
3. 두 번째 계정(상대방) 동일하게 반복
4. Users 목록에서 두 계정의 **UUID 각각 복사** (다음 단계에서 사용)

---

### STEP 3 — couples + profiles 초기 데이터 삽입

[`supabase/init.sql`](./supabase/init.sql)을 SQL Editor에서 단계별로 실행합니다.

**3-1. couples row 생성**
```sql
insert into public.couples (id)
values (gen_random_uuid())
returning id as couple_id;
```
→ 반환된 UUID 복사 (예: `550e8400-e29b-41d4-a716-446655440000`)

**3-2. profiles 연결 (값 교체 후 실행)**
```sql
insert into public.profiles (id, couple_id, display_name)
values
  ('USER_1_UUID', 'COUPLE_UUID', '이름1'),
  ('USER_2_UUID', 'COUPLE_UUID', '이름2');
```
- `USER_1_UUID`, `USER_2_UUID`: STEP 2에서 복사한 Auth UUID
- `COUPLE_UUID`: 3-1에서 반환된 UUID
- **두 row의 `couple_id`가 반드시 동일해야 합니다**

> ⚠️ profiles에는 클라이언트 INSERT 정책이 없습니다.  
> 앱에서 profiles를 생성하려 하면 RLS 오류가 납니다.  
> 반드시 SQL Editor(service role)에서 수동 삽입해야 합니다.

---

### STEP 4 — 세팅 검증

[`supabase/verify.sql`](./supabase/verify.sql)을 SQL Editor에서 실행해 아래 체크리스트를 확인합니다.

| # | 확인 항목 | 기대 결과 |
|---|-----------|-----------|
| 1 | 테이블 9개 존재 | `pg_tables`에서 9건 조회 |
| 2 | 모든 테이블 RLS ON | `rowsecurity = true` 전체 |
| 3 | RLS 정책 존재 | 테이블별 1~2개 정책 확인 |
| 4 | profiles 2건 + 동일 couple_id | couple_id 두 줄 일치 |
| 5 | `my_couple_id()` SECURITY DEFINER | `security_type = DEFINER` |
| 6 | messages Realtime 활성화 | `pg_publication_tables`에서 messages 확인 |
| 7 | notes updated_at trigger | trigger 1건 존재 |
| 8 | 인덱스 6개 | `idx_*` 이름으로 6건 |

---

### STEP 5 — 앱에서 RLS 동작 확인

SQL Editor는 RLS를 우회하므로 실제 동작은 앱에서 확인해야 합니다.

1. **계정 1로 로그인** → 여행 1개 생성 → 저장 확인
2. **계정 2로 로그인** → 같은 여행이 보이는지 확인 (같은 couple_id → 보여야 함)
3. (선택) **더미 3번 계정으로 로그인** → 여행 0건이어야 함 (다른 couple_id → 차단)

---

### 흔한 오류와 원인

| 증상 | 원인 | 해결 |
|------|------|------|
| 로그인 후 모든 데이터가 빈 결과 | `profiles` 미삽입 → `my_couple_id()` NULL 반환 → RLS 전체 차단 | SQL Editor에서 `init.sql` STEP 3 실행 |
| 상대방 데이터가 안 보임 | 두 profiles의 `couple_id`가 다른 값 | `select couple_id from profiles` 확인 후 불일치 시 UPDATE |
| `profiles` INSERT 시 RLS 오류 | 앱에서 profiles 생성 시도 (INSERT 정책 없음) | SQL Editor에서 수동 삽입 |
| SQL Editor에서 다른 커플 데이터도 보임 | SQL Editor는 service role → RLS 우회 | 정상 동작. 앱에서 로그인 후 재확인 |
| 상대 메시지가 실시간으로 안 옴 | messages Realtime 미활성화 | `verify.sql` CHECK 6 실행 후 미포함 시 `alter publication supabase_realtime add table public.messages` 재실행 |
| 앱 실행 시 "VITE_SUPABASE_URL 누락" 에러 | `.env.local` 없음 | `.env.example` 복사 후 실제 값 입력 |

### 4. 개발 서버 실행
```bash
pnpm dev            # http://localhost:5173
```

### 5. 빌드 & 미리보기
```bash
pnpm build          # 프로덕션 빌드
pnpm preview        # 빌드 결과 로컬 확인
```

### 6. 배포
`main` 브랜치에 push하면 Vercel이 자동 빌드·배포합니다. Vercel 프로젝트 설정에 위 환경 변수를 동일하게 등록하세요.

---

## 📐 개발 규칙

1인 개발이지만 일관성을 위해 최소한의 규칙을 둡니다.

### 코드 스타일
- **TypeScript strict 모드** 유지. `any` 지양.
- ESLint + Prettier로 포맷 통일 (`pnpm lint`, `pnpm format`).
- 컴포넌트는 **함수형 + Hooks**. 파일명 `PascalCase.tsx`(컴포넌트), `camelCase.ts`(유틸/훅).

### 구조 규칙
- 데이터 접근은 반드시 `features/*/service.ts` → TanStack Query 훅을 통해서만. **컴포넌트에서 Supabase 직접 호출 금지.**
- 전역 상태는 정말 전역인 것만 Zustand에. 서버 데이터는 Query 캐시가 단일 진실 공급원.
- 쿼리 키 규칙 유지: `['trips']`, `['itinerary', tripId]`, `['messages', coupleId]`, `['expenses', tripId]` 등.

### UX 규칙
- 모바일 우선. 터치 타깃 ≥ 44px.
- 네트워크 지연 대비 **낙관적 업데이트**(메시지 전송·체크 토글·일정 추가)와 실패 시 롤백.

### 커밋 메시지 (Conventional Commits 간소화)
```
feat: 일정 아이템 추가 기능
fix: 채팅 스크롤 위치 버그 수정
refactor: 경비 정산 로직 분리
docs: README 업데이트
chore: 의존성 업데이트
style: 포맷 정리
```

### 보안
- `.env.local`, 영수증/개인 사진 등 민감 자산은 커밋 금지.
- 모든 테이블 RLS 활성화 확인 후 배포.

---

## 🌿 Git 브랜치 전략

1인·소규모 프로젝트라 **GitHub Flow(경량)** 를 사용합니다. Gitflow는 과합니다.

```
main ────●────────●────────●──────►  (항상 배포 가능 / Vercel 자동 배포)
          \        \
           feature/itinerary
                    feature/chat
```

- **`main`** — 항상 배포 가능한 안정 브랜치. Vercel이 이 브랜치를 자동 배포.
- **`feature/*`** — 기능 단위 작업 브랜치. 작은 단위로 자주 머지.
  - 예: `feature/itinerary`, `feature/realtime-chat`, `feature/expense-split`
- **`fix/*`** — 버그 수정 브랜치.

### 작업 흐름
```bash
git switch -c feature/expense-split   # 브랜치 생성
# ...작업 & 커밋...
git push -u origin feature/expense-split
# GitHub에서 PR 생성 → Vercel 프리뷰 확인 → main에 머지(Squash 권장)
```

### 권장 사항
- 브랜치는 **짧게 유지**(며칠 내 머지). 오래 묵히지 않기.
- PR 머지 시 **Squash merge**로 히스토리 깔끔하게.
- 기능이 끝나면 브랜치 삭제.
- (혼자라면 main 직접 커밋도 허용하되, 큰 기능은 브랜치 권장.)

---

## 🎯 MVP 목표

1개월 안에 "실제 여행에 쓸 수 있는 v1"을 만드는 것이 목표입니다.

### ✅ Must — v1 (반드시)
- [ ] 2계정 로그인 / 커플 단위 데이터 공유 (RLS)
- [ ] 여행 생성·선택
- [ ] 일정: 일자별 아이템 CRUD
- [ ] 채팅: 실시간 텍스트 메시지
- [ ] 체크리스트: 항목 추가/체크
- [ ] 메모: 작성/수정
- [ ] 경비: 지출 기록 + 카테고리 합계 + 2인 정산
- [ ] Vercel 배포 + PWA 설치 + keep-alive cron

### 🟡 Should — 시간 되면
- [ ] 채팅 이미지 첨부 / 영수증 사진
- [ ] 여러 여행 관리(과거·예정)
- [ ] 일정 드래그 정렬
- [ ] 통화 표시 / 간단 환율 입력
- [ ] 프로필(이름·사진), 다크모드

### 🔵 Could — 나중에
- [ ] 채팅 읽음 표시, 입력 중(typing indicator) 표시
- [ ] 채팅 고급 무한스크롤(페이지네이션)
- [ ] WebSocket 서버 직접 구현(후속 학습 과제)
- [ ] 웹 푸시 알림
- [ ] 지도/장소 연동
- [ ] 메모 실시간 협업
- [ ] 정산 분담 비율 커스터마이즈 / 히스토리
- [ ] 여행 회고·사진 앨범

### ❌ Won't — 이번엔 안 함
- 3인 이상·친구 초대·다중 커플
- 결제·외부 예약 연동
- 관리자·통계 대시보드
- 네이티브 앱(스토어 배포)

### 4주 마일스톤 요약
| 주차 | 목표 |
|------|------|
| Week 1 | 셋업 · 인증 · DB/RLS · 레이아웃 · 배포 스켈레톤 |
| Week 2 | 여행 · 일정 · 체크리스트 |
| Week 3 | 실시간 채팅(반드시) · 공유 메모 |
| Week 4 | 경비(초반 즉시) · 정산 · 실기기 테스트 · 마무리 |

---

<div align="center">

**Made for us, for our trips. ✈️**

</div>