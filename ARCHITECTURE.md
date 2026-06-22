# ARCHITECTURE.md — 여행용 커플 앱 아키텍처 설계서

> 두 사람(나 + 여자친구)이 실제로 여행에 쓰는 모바일 웹 앱.
> 1개월 내 개발 / 운영비 $0 / React + Vite + TS + Vercel + PWA 기준.
> 주요 기술 결정 근거: [`DECISIONS.md`](./DECISIONS.md)

---

## 1. 프로젝트 개요

### 1.1 목적
연인 두 명이 여행을 함께 계획·기록·정산하기 위한 개인용 모바일 웹 앱. 상업 서비스가 아니라 **실사용 2인 전용**이므로, 확장성·다중 테넌트·복잡한 권한 체계는 의도적으로 배제하고 "1개월 안에 완성해서 다음 여행에 바로 쓴다"를 최우선으로 한다.

### 1.2 핵심 제약과 설계 원칙

| 제약 | 설계에 미친 영향 |
|------|------------------|
| 사용자 2명 고정 | "couple" 단위 하나만 존재. 복잡한 멤버십·초대 로직 없음 |
| 개발 기간 1개월 (1인 추정) | 백엔드 직접 개발 ❌ → BaaS(Supabase)로 서버 코드 제거 |
| 운영비 최소화 | 전 구성 요소를 무료 티어 안에서 운영 (목표 월 $0) |
| 모바일 웹(PWA) | 데스크톱 미고려, 모바일 세로 화면 우선. 설치형 PWA + 오프라인 캐싱 |
| 여행 중 사용 | 네트워크 불안정 가정 → 낙관적 업데이트 + 캐시 우선 전략 |

### 1.3 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 빌드/프레임워크 | React 18 + Vite + TypeScript | 요구사항. Vite는 빠른 HMR + 가벼운 번들 |
| 스타일 | Tailwind CSS | 모바일 유틸리티 스타일링 빠름, 런타임 비용 0 |
| 라우팅 | React Router v6 | SPA 표준 |
| 서버 상태 | TanStack Query (React Query) | 캐싱·재검증·낙관적 업데이트 |
| 클라이언트 상태 | Zustand | 전역 UI 상태(현재 여행, 모달 등) 최소 보일러플레이트 |
| 폼 | React Hook Form + Zod | 입력 검증 |
| 백엔드(BaaS) | **Supabase** (Postgres + Auth + Realtime + Storage) | 단일 백엔드로 DB·인증·실시간·파일 전부 해결, 무료 |
| 배포(프론트) | Vercel (Hobby) | Git push 자동 배포, 무료 |
| PWA | vite-plugin-pwa (Workbox) | 매니페스트 + 서비스워커 자동 생성 |

### 1.4 왜 Supabase인가 (Firebase 대비)
이 앱은 **관계형 데이터(일정·경비·체크리스트)** 와 **실시간(채팅)** 을 동시에 필요로 한다. Supabase는 Postgres 위에서 SQL·관계·RLS를 그대로 쓰면서 Realtime 구독까지 한 번에 제공해 경비 정산 같은 구조적 데이터에 유리하다. 무료 티어 기준 **500MB DB / 1GB 파일 스토리지 / 5GB 대역폭 / 200 동시 실시간 연결 / 월 200만 실시간 메시지**로, 2인 사용 규모에서는 한도에 닿을 일이 사실상 없다.

> ⚠️ **운영비 관련 주의(설계 반영됨):** Supabase 무료 프로젝트는 **7일간 DB 요청이 없으면 자동 일시정지**된다. 여행과 여행 사이 공백이 7일을 넘으면 앱이 멈춘 것처럼 보인다. → **§8 배포 구조**에서 GitHub Actions keep-alive cron으로 해결.

### 1.5 예상 운영비

| 항목 | 플랜 | 월 비용 |
|------|------|---------|
| Vercel | Hobby (개인/비상업) | $0 |
| Supabase | Free | $0 |
| 도메인(선택) | 미사용 시 `*.vercel.app` | $0 |
| **합계** | | **$0 / 월** |

커스텀 도메인을 원할 경우에만 연 1~2만 원대 도메인 비용이 추가된다(선택).

---

## 2. 기능 명세

### 2.1 인증
- 2개의 고정 계정. Supabase Auth 이메일 + 비밀번호(또는 매직링크).
- 두 계정 모두 동일한 `couple_id`에 소속 → 모든 데이터를 공유.
- 회원가입 UI는 만들지 않고, 초기 2계정은 Supabase 대시보드에서 직접 생성(개발 단축).

### 2.2 여행 일정 (Itinerary)
- 여행(Trip) 생성: 제목, 목적지, 시작/종료일, 커버 이미지.
- 일자별 일정 아이템: 시간, 제목, 장소, 메모. 드래그 정렬(또는 시간순 자동 정렬).
- 여러 여행을 보관(과거/예정/진행 중).

### 2.3 실시간 채팅 (Chat)
- 커플 전용 1:1 채팅방 하나.
- **MVP 범위:** 텍스트 메시지 전송 · 실시간 수신(Supabase Realtime) · 내/상대 메시지 구분 · 시간 표시.
- **Backlog:** 이미지 첨부, 읽음 표시, 입력 중 표시(typing indicator), 고급 무한스크롤(페이지네이션), 웹 푸시 알림.
- Supabase Realtime은 내부적으로 WebSocket 기반 실시간 통신을 사용하나, 직접 WebSocket 서버를 구현하는 것과는 다르다. 직접 구현은 후속 학습 과제로 분리한다(→ DECISIONS.md 참고).

### 2.4 공유 메모 (Shared Notes)
- 자유 형식 메모(여행 준비물 아이디어, 맛집 후보, 링크 등).
- 마지막 수정자/수정 시각 표시. 동시 편집은 "마지막 저장 우선"으로 단순화(2인이라 충돌 거의 없음).

### 2.5 체크리스트 (Checklist)
- 여행별 또는 공용 체크리스트.
- 항목 추가/체크/삭제, 담당자(나/상대) 지정 선택, 진행률 표시.

### 2.6 경비 관리 (Expense)
- 지출 기록: 금액, 통화, 카테고리(식비/교통/숙박/관광/쇼핑/기타), 결제자, 설명, 영수증 사진(선택).
- 여행별 총지출, 카테고리별 합계.
- **정산(2인 한정 단순화):** "누가 누구에게 얼마를 주면 되는가"를 클라이언트에서 즉시 계산(각자 부담분 = 총액/2 기준 또는 항목별 분담).

---

## 3. 화면 설계

### 3.1 정보 구조 (IA) / 네비게이션
하단 탭 5개 기반의 모바일 우선 구조.

```
[로그인]
   │
   ▼
[홈 / 여행 목록]
   │
   ├── 하단탭1: 일정 (Itinerary)
   ├── 하단탭2: 채팅 (Chat)
   ├── 하단탭3: 메모 (Notes)
   ├── 하단탭4: 체크리스트 (Checklist)
   └── 하단탭5: 경비 (Expense)

[상단]: 현재 선택된 여행 스위처 (Trip Selector)
```

### 3.2 화면 목록

| # | 화면 | 핵심 요소 |
|---|------|-----------|
| S0 | 로그인 | 이메일/비번 입력 또는 매직링크 버튼 |
| S1 | 여행 목록 / 홈 | 여행 카드 리스트, 새 여행 추가 FAB, 현재 여행 강조 |
| S2 | 여행 생성/편집 | 제목·목적지·기간·커버 이미지 폼 |
| S3 | 일정 | 일자 탭, 타임라인 리스트, 아이템 추가/편집 바텀시트 |
| S4 | 채팅 | 메시지 버블, 입력창, 이미지 첨부, 실시간 수신 |
| S5 | 메모 | 메모 목록 → 상세/편집 (자동 저장) |
| S6 | 체크리스트 | 체크 항목 리스트, 진행률 바, 담당자 칩 |
| S7 | 경비 | 지출 리스트, 카테고리 합계, **정산 요약 카드** |
| S8 | 지출 추가 | 금액·통화·카테고리·결제자·영수증 폼 |
| S9 | 설정 | 프로필(표시 이름/사진), 테마, 로그아웃 |

### 3.3 와이어프레임 개념 (텍스트)

```
┌─────────────────────────┐   ┌─────────────────────────┐
│  ▼ 오사카 여행 (3/14~17) │   │  ← 채팅                 │
├─────────────────────────┤   ├─────────────────────────┤
│  [Day1][Day2][Day3]      │   │            안녕! 도착했어 │
│                          │   │  나야 곧 갈게  ░░        │
│  09:00  공항 도착         │   │            [사진]        │
│  11:30  호텔 체크인       │   │                          │
│  13:00  도톤보리 🍜       │   │                          │
│         + 일정 추가       │   ├─────────────────────────┤
├─────────────────────────┤   │ [📷] 메시지 입력...  [전송]│
│ 일정 채팅 메모 체크 경비 │   │ 일정 채팅 메모 체크 경비 │
└─────────────────────────┘   └─────────────────────────┘
```

디자인 톤: 모바일 단일 컬럼, 큰 터치 타깃(≥44px), 바텀시트 기반 입력, 다크/라이트 지원(선택).

---

## 4. 데이터베이스 설계

### 4.1 ERD 개요

```
auth.users (Supabase 내장)
   │ 1:1
profiles ──┐
           │  couple_id
couples ◄──┴──────────────────────────────┐
   │                                       │
   ├─< trips ──< itinerary_items           │
   │      └──< expenses                    │
   │      └──< checklists ──< checklist_items
   │      └──< notes                       │
   └─< messages ──────────────────────────┘
```
모든 사용자 데이터 테이블은 `couple_id`(직접 또는 `trip_id` 경유)를 가지며, RLS가 이 값으로 접근을 제한한다.

### 4.2 테이블 정의 (Postgres)

```sql
-- 커플 단위 (실사용상 row 1개)
create table couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

-- auth.users 와 1:1 프로필
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- 여행
create table trips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  title text not null,
  destination text,
  start_date date,
  end_date date,
  cover_image_url text,
  created_at timestamptz default now()
);

-- 일정 아이템
create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_date date not null,
  start_time time,
  end_time time,
  title text not null,
  location text,
  memo text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 채팅 메시지 (Realtime 대상)
create table messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  type text not null default 'text' check (type in ('text','image')),
  content text,
  image_url text,
  created_at timestamptz default now()
);

-- 공유 메모
create table notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  title text,
  content text,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 체크리스트 / 항목
create table checklists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists(id) on delete cascade,
  content text not null,
  is_checked boolean default false,
  assignee_id uuid references profiles(id),
  checked_by uuid references profiles(id),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 경비
create table expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  payer_id uuid not null references profiles(id),
  amount numeric(12,2) not null,
  currency text not null default 'KRW',
  category text not null default 'etc'
    check (category in ('food','transport','lodging','sightseeing','shopping','etc')),
  split_ratio numeric default 0.5,   -- 상대 부담 비율(기본 5:5)
  description text,
  receipt_url text,
  paid_at date default current_date,
  created_at timestamptz default now()
);
```

### 4.3 보안 — Row Level Security (RLS)
2인 전용이라 핵심은 "내 `couple_id` 데이터만 접근". 모든 테이블에 RLS를 켜고 아래 패턴을 적용한다.

```sql
-- 헬퍼: 현재 로그인 사용자의 couple_id
create or replace function my_couple_id() returns uuid
language sql stable as $$
  select couple_id from profiles where id = auth.uid()
$$;

alter table trips enable row level security;
create policy "same couple" on trips
  for all using (couple_id = my_couple_id())
  with check (couple_id = my_couple_id());
-- itinerary_items 등 trip_id 경유 테이블은 trip의 couple_id로 검사
```
`couple_id`를 직접 가진 테이블은 위 패턴을 그대로, `trip_id`만 가진 테이블(itinerary_items 등)은 상위 trip의 couple_id를 조인해 검사한다.

### 4.4 인덱스 & Realtime
- `messages(couple_id, created_at desc)` — 채팅 페이지네이션.
- `itinerary_items(trip_id, day_date, sort_order)` — 일정 정렬.
- `expenses(trip_id, paid_at)` — 경비 조회.
- Supabase Realtime: `messages` 테이블 Postgres Changes 구독(필수). `checklist_items`, `notes`는 선택적으로 구독해 협업 반영.

### 4.5 스토리지 (Supabase Storage)
- 버킷: `avatars`(프로필), `chat-images`(채팅 첨부), `receipts`(영수증).
- 업로드 전 클라이언트에서 리사이즈/압축(예: 최대 1280px, WebP) → 1GB·5GB 한도 절약. CDN 경유 제공으로 대역폭 절감.

---

## 5. API 설계

별도 백엔드 서버를 만들지 않는다. **Supabase 클라이언트 SDK가 곧 API 계층**이며, RLS가 인가를 담당한다. 아래는 기능별 데이터 접근 계약(서비스 레이어 함수)으로 정의한다.

### 5.1 접근 방식
- 읽기/쓰기: `supabase.from('table').select/insert/update/delete()` (PostgREST 자동 생성).
- 실시간: `supabase.channel(...).on('postgres_changes', ...)`.
- 파일: `supabase.storage.from(bucket).upload(...)`.
- 모든 호출은 `src/lib/services/*`에 래핑하고, 컴포넌트는 TanStack Query 훅을 통해서만 접근.

### 5.2 서비스 레이어 계약 (요약)

| 도메인 | 함수 | 동작 |
|--------|------|------|
| Trip | `listTrips()` / `createTrip(dto)` / `updateTrip(id,dto)` / `deleteTrip(id)` | 여행 CRUD |
| Itinerary | `listItems(tripId)` / `createItem(dto)` / `updateItem(id,dto)` / `reorder(ids)` / `deleteItem(id)` | 일정 CRUD·정렬 |
| Chat | `listMessages(cursor)` / `sendMessage(dto)` / `subscribeMessages(cb)` | 무한스크롤·전송·실시간 |
| Notes | `listNotes()` / `upsertNote(dto)` / `deleteNote(id)` | 메모 |
| Checklist | `listChecklists(tripId)` / `addItem(dto)` / `toggleItem(id)` / `deleteItem(id)` | 체크리스트 |
| Expense | `listExpenses(tripId)` / `addExpense(dto)` / `updateExpense(id,dto)` / `deleteExpense(id)` | 경비 |
| Storage | `uploadImage(bucket, file)` | 압축 후 업로드, public URL 반환 |

### 5.3 실시간 채팅 흐름

```
[A 전송] sendMessage()
   → insert into messages (낙관적 업데이트로 즉시 UI 반영)
   → Supabase Realtime(postgres_changes: INSERT)
   → [B 수신] subscribeMessages 콜백 → React Query 캐시에 머지 → UI 갱신
```

### 5.4 경비 정산 로직 (클라이언트 계산, 2인)
- 각 지출의 상대 부담액 = `amount * split_ratio` (기본 0.5).
- 순잔액 = Σ(내가 결제하고 상대가 부담해야 할 금액) − Σ(상대가 결제하고 내가 부담해야 할 금액).
- 결과: "상대 → 나 ₩X" 또는 "나 → 상대 ₩X" 한 줄로 요약. 서버 라운드트립 불필요.

---

## 6. 폴더 구조

기능(feature) 중심 구조. 도메인별로 컴포넌트·훅·서비스를 같은 폴더에 둔다.

```
src/
├── main.tsx
├── App.tsx                      # 라우터 + Provider
├── lib/
│   ├── supabase.ts              # Supabase 클라이언트 생성
│   ├── queryClient.ts           # TanStack Query 설정
│   └── utils/                   # 날짜·통화·이미지 압축 등
├── components/                  # 공용 UI (Button, BottomSheet, Avatar...)
│   └── layout/                  # AppShell, BottomTabBar, TripSwitcher
├── features/
│   ├── auth/                    # 로그인, useSession
│   ├── trips/                   # 여행 목록/생성, useTrips, tripsService
│   ├── itinerary/               # 일정, useItinerary, itineraryService
│   ├── chat/                    # 채팅, useMessages, useRealtimeChat
│   ├── notes/                   # 메모
│   ├── checklist/               # 체크리스트
│   └── expense/                 # 경비 + 정산 계산
├── store/
│   └── appStore.ts              # Zustand (currentTripId, theme, UI상태)
├── types/
│   └── database.types.ts        # supabase gen types로 생성된 DB 타입
├── routes/                      # 라우트 정의
└── styles/                      # tailwind, 글로벌

public/
├── manifest.webmanifest         # PWA
└── icons/                       # 앱 아이콘 (192/512)

.github/workflows/keepalive.yml  # Supabase 일시정지 방지 cron
```

각 feature 폴더 내부 권장 구성: `components/`, `hooks/`, `service.ts`, `types.ts`, `index.ts`.

---

## 7. 상태 관리 전략

상태를 성격별로 분리해 도구를 고른다. (과한 전역 상태 도입을 피함)

| 상태 종류 | 도구 | 예시 |
|-----------|------|------|
| 서버 상태(원격 데이터) | **TanStack Query** | 여행·일정·경비·메시지 목록. 캐싱·재검증·낙관적 업데이트 |
| 실시간 동기화 | **Supabase Realtime → Query 캐시 머지** | 새 채팅 메시지를 구독해 `queryClient.setQueryData`로 반영 |
| 전역 클라이언트 상태 | **Zustand** | `currentTripId`, 테마, 바텀시트 열림 여부 |
| 인증 세션 | Supabase Auth + 얇은 Zustand/Context | `session`, `profile` |
| 폼 상태 | React Hook Form (+ Zod) | 일정/경비 입력 폼 |
| URL 상태 | React Router 파라미터 | `/trips/:id`, 선택된 day 등 |

### 7.1 핵심 패턴
- **낙관적 업데이트:** 여행 중 네트워크 지연을 가리기 위해 메시지 전송·체크 토글·일정 추가는 UI 먼저 갱신 후 서버 반영, 실패 시 롤백.
- **쿼리 키 규칙:** `['trips']`, `['itinerary', tripId]`, `['messages', coupleId]`, `['expenses', tripId]` 등 일관된 키로 무효화 관리.
- **실시간 ↔ 캐시 일원화:** 실시간 이벤트를 별도 상태에 쌓지 않고 항상 Query 캐시에 머지해 "단일 진실 공급원" 유지.

---

## 8. 배포 구조

### 8.1 구성도

```
┌──────────────┐   git push    ┌───────────────┐
│  GitHub Repo │ ────────────► │ Vercel (Hobby)│  정적 빌드 호스팅 + CDN + HTTPS
└──────┬───────┘   자동배포    └──────┬────────┘
       │                              │ 브라우저(PWA)
       │ schedule(cron)               ▼
       │                       ┌───────────────┐
       └─ GitHub Actions ────► │   Supabase    │  Postgres / Auth / Realtime / Storage
          keep-alive ping      └───────────────┘
```

### 8.2 프론트엔드 (Vercel)
- GitHub 연동 → `main` push 시 자동 빌드·배포, PR 프리뷰.
- 빌드: `vite build` → 정적 자산 CDN 서빙(서버리스 함수 불필요 → 비용 0).
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon 키는 공개 가능, 보안은 RLS가 담당).

### 8.3 PWA
- `vite-plugin-pwa`로 매니페스트 + 서비스워커 생성.
- 캐싱: 앱 셸(precache) + 정적 자산. API 응답은 TanStack Query가 메모리/세션 캐싱(Supabase 데이터를 SW로 과캐싱하지 않음 — stale 위험).
- 설치: 홈 화면 추가. iOS Safari는 standalone 모드 동작 확인 필요.

### 8.4 Supabase 일시정지 방지 (운영비 0 유지 핵심)
무료 프로젝트는 7일 무요청 시 정지되므로 `.github/workflows/keepalive.yml`로 5~6일 주기 가벼운 쿼리를 보낸다.

```yaml
name: supabase-keepalive
on:
  schedule:
    - cron: '0 0 */5 * *'   # 5일마다
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -s "$SUPABASE_URL/rest/v1/couples?select=id&limit=1" \
            -H "apikey: $SUPABASE_ANON_KEY"
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### 8.5 푸시 알림에 대한 현실적 입장
모바일 웹 푸시(특히 iOS PWA)는 설정이 까다롭고 동작이 들쭉날쭉하다. 2인 사용이라 **MVP에서는 푸시를 빼고**, 앱을 켜고 있을 때의 인앱 실시간(채팅)만 보장한다. 푸시는 안정화 후 "Could" 범위에서 검토.

---

## 9. 개발 일정 (4주)

1인 개발, 주당 가용 시간에 따라 조정. "매주 끝에 배포된 무언가가 있다"를 원칙으로.

### Week 1 — 기반 구축
- [ ] 레포·Vite·TS·Tailwind·라우터·Query·Zustand 셋업
- [ ] Supabase 프로젝트 생성, 스키마 + RLS 적용, 타입 생성(`supabase gen types`)
- [ ] 로그인 + 세션, 2계정 생성, AppShell + 하단탭 + Trip Switcher
- [ ] Vercel 연결(스켈레톤 배포), PWA 기본 설정, keep-alive cron
- **산출:** 로그인 후 빈 탭 화면까지 배포 완료

### Week 2 — 일정 + 체크리스트
- [ ] 여행 CRUD (목록/생성/편집)
- [ ] 일정: 일자 탭, 아이템 CRUD, 정렬
- [ ] 체크리스트: CRUD, 진행률, 담당자
- **산출:** 여행을 만들고 일정·체크리스트를 채울 수 있음

### Week 3 — 채팅(반드시) + 메모
- [ ] 채팅: 메시지 테이블, 텍스트 전송, Realtime 구독, 내/상대 구분, 시간 표시, 낙관적 업데이트
- [ ] 공유 메모: 목록/편집/자동 저장 (시간 남으면)
- **산출:** 둘이 실시간 대화 가능 (채팅은 반드시; 메모는 시간 부족 시 컷 가능)

### Week 4 — 경비(초반 즉시) + 마무리
- [ ] **경비: 지출 CRUD, 카테고리 합계, 2인 정산 요약** (Week 4 시작 즉시 착수)
- [ ] 오프라인/낙관적 동작 점검, 실기기(내 폰·여친 폰) 테스트, 버그픽스
- [ ] PWA 설치 확인, 아이콘/스플래시, 다크모드(선택)
- **산출:** 실여행 투입 가능한 v1

> 버퍼: 일정이 빠듯하면 메모·다크모드·정렬 드래그를 후순위로 미룬다. **채팅과 경비는 절대 컷하지 않는다.**

---

## 10. MVP 범위

MoSCoW로 우선순위를 명확히 해, 1개월 안에 "쓸 수 있는 것"을 확실히 확보한다.

### ✅ Must (반드시 — 이게 v1)
- 2계정 로그인 / 커플 단위 데이터 공유 (RLS)
- 여행 1개 이상 생성·선택
- **일정**: 일자별 아이템 CRUD
- **채팅**: 실시간 텍스트 메시지
- **체크리스트**: 항목 추가/체크
- **메모**: 작성/수정
- **경비**: 지출 기록 + 카테고리 합계 + 2인 정산 요약
- Vercel 배포 + PWA 설치 + keep-alive

### 🟡 Should (시간 되면)
- 채팅 이미지 첨부, 영수증 사진
- 여러 여행 관리(과거/예정)
- 일정 드래그 정렬
- 통화 표시 / 간단 환율 입력
- 프로필(이름·사진), 다크모드

### 🔵 Could (나중에)
- 채팅 읽음 표시, 입력 중 표시(typing indicator)
- 채팅 고급 무한스크롤(과거 메시지 페이지네이션)
- WebSocket 서버 직접 구현(후속 학습 과제 — Supabase Realtime과 별개)
- 웹 푸시 알림
- 지도/장소 연동(일정 위치 핀)
- 메모 동시편집 표시·실시간 협업 커서
- 경비 분담 비율 커스터마이즈, 정산 내역 히스토리
- 여행 회고/사진 앨범

### ❌ Won't (이번엔 안 함)
- 3인 이상·친구 초대·다중 커플
- 결제·외부 예약 연동
- 관리자·통계 대시보드
- 네이티브 앱(스토어 배포)

---

### 부록 A — 무료 티어 한도 메모 (2026 기준, 변동 가능)
- Supabase Free: DB 500MB / 파일 1GB / 대역폭 5GB / MAU 50,000 / 동시 실시간 연결 200 / 실시간 메시지 월 200만. **7일 무활동 시 일시정지** → keep-alive로 대응.
- Vercel Hobby: 개인·비상업 프로젝트 무료. (상업화 시 Pro 전환 필요)
- 2인·저트래픽에서는 위 한도 중 어느 것에도 근접하지 않음. 가장 큰 리스크는 한도가 아니라 **무료 티어 무백업** → 중요 데이터는 가끔 수동 export 권장.

*문서 버전 v1 · 작성 기준 2026-06. 무료 티어 수치는 공급사 정책에 따라 바뀔 수 있으니 배포 전 공식 페이지로 재확인.*