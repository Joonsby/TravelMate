-- ============================================================
-- TravelMate — Supabase Schema
-- Postgres 15 / Supabase Free Tier 기준
--
-- 적용 순서:
--   1. Supabase 대시보드 → SQL Editor 열기
--   2. 이 파일 전체 붙여넣기 → Run
--   3. Database > Tables 에서 9개 테이블 생성 확인
--   4. Database > Replication 에서 messages 활성화 확인
--   5. Auth > Users 에서 2계정 수동 생성
--   6. SQL Editor 에서 profiles INSERT 2건 수동 실행 (아래 주석 참조)
--
-- 주의: auth.users 는 Supabase 내장 테이블, 직접 수정 불가
-- ============================================================


-- ============================================================
-- 섹션 1: 헬퍼 함수
-- ============================================================

-- 현재 로그인 사용자의 couple_id 반환
-- SECURITY DEFINER: 이 함수가 profiles 를 조회할 때 RLS 를 우회
-- → my_couple_id() 가 profiles RLS 에서 다시 호출되는 무한 재귀 방지
-- set search_path: search_path 인젝션 방어
create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id
  from public.profiles
  where id = auth.uid()
$$;


-- updated_at 컬럼 자동 갱신 트리거 함수
-- notes 테이블에만 적용 (updated_at 보유 테이블)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 섹션 2: 테이블 생성
-- ============================================================

-- 커플 단위 (실사용상 row 1개)
-- INSERT/UPDATE/DELETE 는 Supabase 대시보드에서만 수행
create table public.couples (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null    default now()
);


-- auth.users 와 1:1 프로필
-- id 는 auth.users.id 와 동일한 UUID 사용
-- 초기 2계정 생성 후 대시보드 SQL Editor 에서 INSERT 필요:
--   insert into public.profiles (id, couple_id, display_name)
--   values ('<auth_user_id>', '<couple_id>', '이름');
create table public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  couple_id    uuid        not null references public.couples(id) on delete cascade,
  display_name text        not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);


-- 여행
-- cover_image_url: Supabase Storage 업로드 후 public URL 저장 (Backlog)
create table public.trips (
  id              uuid        primary key default gen_random_uuid(),
  couple_id       uuid        not null references public.couples(id) on delete cascade,
  title           text        not null,
  destination     text,
  start_date      date,
  end_date        date,
  cover_image_url text,
  created_at      timestamptz not null default now()
);


-- 일정 아이템
-- couple_id 없음: trips 테이블 경유 RLS 적용 (섹션 5 참조)
-- end_time 없음: MVP 에서 종료 시간 UI 없음 (Backlog 에서 추가 가능)
create table public.itinerary_items (
  id         uuid        primary key default gen_random_uuid(),
  trip_id    uuid        not null references public.trips(id) on delete cascade,
  day_date   date        not null,
  start_time time,
  title      text        not null,
  location   text,
  memo       text,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);


-- 채팅 메시지 (Supabase Realtime 구독 대상 — 섹션 6 참조)
-- 텍스트 전용 MVP: type/image_url 제거 (이미지 첨부는 Backlog)
-- sender_id: auth.users.id 가 아닌 profiles.id 참조 (앱 레벨 신원)
create table public.messages (
  id         uuid        primary key default gen_random_uuid(),
  couple_id  uuid        not null references public.couples(id) on delete cascade,
  sender_id  uuid        not null references public.profiles(id),
  content    text        not null,
  created_at timestamptz not null default now()
);


-- 공유 메모
-- trip_id nullable (on delete set null): 여행 삭제 시 메모는 공용으로 전환
-- updated_by: 마지막 수정자 표시용, 앱에서 명시 설정
create table public.notes (
  id         uuid        primary key default gen_random_uuid(),
  couple_id  uuid        not null references public.couples(id) on delete cascade,
  trip_id    uuid        references public.trips(id) on delete set null,
  title      text,
  content    text,
  updated_by uuid        references public.profiles(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);


-- 체크리스트 묶음
-- trip_id nullable (on delete cascade): 여행 삭제 시 함께 삭제
-- 여행별 또는 공용 체크리스트 지원
create table public.checklists (
  id         uuid        primary key default gen_random_uuid(),
  couple_id  uuid        not null references public.couples(id) on delete cascade,
  trip_id    uuid        references public.trips(id) on delete cascade,
  title      text        not null,
  created_at timestamptz not null default now()
);


-- 체크리스트 항목
-- couple_id 없음: checklists 테이블 경유 RLS 적용 (섹션 5 참조)
-- checked_by 없음: 2인 앱에서 불필요 (assignee_id 로 담당자 표시 충분)
create table public.checklist_items (
  id           uuid        primary key default gen_random_uuid(),
  checklist_id uuid        not null references public.checklists(id) on delete cascade,
  content      text        not null,
  is_checked   boolean     not null default false,
  assignee_id  uuid        references public.profiles(id),
  sort_order   int         not null default 0,
  created_at   timestamptz not null default now()
);


-- 경비
-- trip_id nullable (on delete cascade): 여행 삭제 시 함께 삭제
-- split_ratio 없음: MVP 는 5:5 고정, 클라이언트에서 amount / 2 계산
-- receipt_url 없음: 이미지 첨부는 Backlog
create table public.expenses (
  id          uuid           primary key default gen_random_uuid(),
  couple_id   uuid           not null references public.couples(id) on delete cascade,
  trip_id     uuid           references public.trips(id) on delete cascade,
  payer_id    uuid           not null references public.profiles(id),
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text           not null default 'KRW',
  category    text           not null default 'etc'
              check (category in ('food', 'transport', 'lodging', 'sightseeing', 'shopping', 'etc')),
  description text,
  paid_at     date           not null default current_date,
  created_at  timestamptz    not null default now()
);


-- ============================================================
-- 섹션 3: 트리거
-- ============================================================

-- notes.updated_at 자동 갱신
-- 앱에서 UPDATE 시 updated_at 을 명시 안 해도 now() 로 자동 설정
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();


-- ============================================================
-- 섹션 4: 인덱스
-- ============================================================

-- 채팅: 커플별 최신 메시지 조회 (DESC 정렬)
create index idx_messages_couple_created
  on public.messages (couple_id, created_at desc);

-- 일정: 여행 > 날짜 > 정렬순 조회
create index idx_itinerary_trip_day_sort
  on public.itinerary_items (trip_id, day_date, sort_order);

-- 경비: 여행 > 날짜순 조회
create index idx_expenses_trip_paid
  on public.expenses (trip_id, paid_at);

-- profiles: RLS 함수 조회 + 파트너 프로필 조회 성능
create index idx_profiles_couple
  on public.profiles (couple_id);

-- checklists: 여행별 목록 조회
create index idx_checklists_trip
  on public.checklists (trip_id);

-- checklist_items: 정렬순 조회
create index idx_checklist_items_sort
  on public.checklist_items (checklist_id, sort_order);


-- ============================================================
-- 섹션 5: ROW LEVEL SECURITY (RLS)
-- ============================================================
-- 핵심 원칙: 모든 테이블에 RLS ON
-- couple_id 직접 보유 테이블: my_couple_id() 비교 (단순)
-- couple_id 미보유 테이블: 부모 테이블 EXISTS 조인 (itinerary_items, checklist_items)


-- ----- couples -----
-- 자신이 속한 커플 row 만 조회 가능
-- INSERT/UPDATE/DELETE: 대시보드 전용 (클라이언트 정책 없음)
alter table public.couples enable row level security;

create policy "couples: 자신의 커플 조회"
  on public.couples
  for select
  using (id = my_couple_id());


-- ----- profiles -----
-- 같은 커플 구성원 프로필 조회 가능 (파트너 이름·아바타 UI 표시 필요)
-- INSERT: 대시보드 수동 생성, 클라이언트 정책 없음
-- UPDATE: 자신의 프로필만 수정 가능
alter table public.profiles enable row level security;

create policy "profiles: 같은 커플 조회"
  on public.profiles
  for select
  using (couple_id = my_couple_id());

create policy "profiles: 자신만 수정"
  on public.profiles
  for update
  using     (id = auth.uid())
  with check (id = auth.uid());


-- ----- trips -----
-- couple_id 직접 보유: 읽기·쓰기 모두 같은 커플만
alter table public.trips enable row level security;

create policy "trips: 같은 커플"
  on public.trips
  for all
  using     (couple_id = my_couple_id())
  with check (couple_id = my_couple_id());


-- ----- itinerary_items -----
-- trip_id 경유: 부모 trips 의 couple_id 검사
-- EXISTS 서브쿼리 → trips 테이블 RLS 를 거치지 않고 직접 조인
alter table public.itinerary_items enable row level security;

create policy "itinerary_items: trip 경유 같은 커플"
  on public.itinerary_items
  for all
  using (
    exists (
      select 1
      from public.trips
      where trips.id        = itinerary_items.trip_id
        and trips.couple_id = my_couple_id()
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where trips.id        = itinerary_items.trip_id
        and trips.couple_id = my_couple_id()
    )
  );


-- ----- messages -----
-- couple_id 직접 보유
alter table public.messages enable row level security;

create policy "messages: 같은 커플"
  on public.messages
  for all
  using     (couple_id = my_couple_id())
  with check (couple_id = my_couple_id());


-- ----- notes -----
-- couple_id 직접 보유
alter table public.notes enable row level security;

create policy "notes: 같은 커플"
  on public.notes
  for all
  using     (couple_id = my_couple_id())
  with check (couple_id = my_couple_id());


-- ----- checklists -----
-- couple_id 직접 보유
alter table public.checklists enable row level security;

create policy "checklists: 같은 커플"
  on public.checklists
  for all
  using     (couple_id = my_couple_id())
  with check (couple_id = my_couple_id());


-- ----- checklist_items -----
-- checklist_id 경유: 부모 checklists 의 couple_id 검사 (두 단계)
alter table public.checklist_items enable row level security;

create policy "checklist_items: checklist 경유 같은 커플"
  on public.checklist_items
  for all
  using (
    exists (
      select 1
      from public.checklists
      where checklists.id        = checklist_items.checklist_id
        and checklists.couple_id = my_couple_id()
    )
  )
  with check (
    exists (
      select 1
      from public.checklists
      where checklists.id        = checklist_items.checklist_id
        and checklists.couple_id = my_couple_id()
    )
  );


-- ----- expenses -----
-- couple_id 직접 보유
alter table public.expenses enable row level security;

create policy "expenses: 같은 커플"
  on public.expenses
  for all
  using     (couple_id = my_couple_id())
  with check (couple_id = my_couple_id());


-- ============================================================
-- 섹션 6: REALTIME
-- ============================================================

-- messages 테이블 Realtime 구독 활성화
-- 채팅 기능에서 supabase.channel().on('postgres_changes') 로 구독
-- 적용 확인: 대시보드 Database > Replication > supabase_realtime 에서 messages 체크 확인
alter publication supabase_realtime add table public.messages;


-- ============================================================
-- 섹션 7: 초기 데이터 설정 가이드 (실행 금지, 참고용)
-- ============================================================
--
-- Supabase 대시보드 Auth > Users 에서 2계정 생성 후
-- 아래 SQL 을 값만 채워서 실행:
--
-- step 1: 커플 row 생성
--   insert into public.couples (id) values ('<couple-uuid>');
--   -- 또는 gen_random_uuid() 결과를 복사해서 couple-uuid 로 사용
--
-- step 2: 두 프로필 연결 (auth user id 는 Auth > Users 에서 확인)
--   insert into public.profiles (id, couple_id, display_name)
--   values
--     ('<user1-auth-id>', '<couple-uuid>', '이름1'),
--     ('<user2-auth-id>', '<couple-uuid>', '이름2');
--
-- step 3: RLS 검증 (각 계정으로 로그인 후 아래 쿼리 결과가 1건이어야 함)
--   select * from public.couples;        -- 자신의 커플 1건
--   select * from public.profiles;       -- 파트너 포함 2건
--   select * from public.trips;          -- 빈 결과 (아직 여행 없음)
-- ============================================================
