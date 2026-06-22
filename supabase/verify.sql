-- ============================================================
-- TravelMate — RLS 검증 쿼리
-- init.sql 실행 완료 후 아래 체크리스트 순서대로 실행
--
-- ⚠️ 중요: SQL Editor는 service role(관리자) 권한이라 RLS를 우회합니다.
--    여기서는 "데이터가 올바르게 들어갔는가"만 확인합니다.
--    실제 RLS 동작은 앱에서 로그인 후 확인해야 합니다.
-- ============================================================


-- ============================================================
-- CHECK 1: 테이블 9개 생성 확인
-- ============================================================
select tablename
from pg_tables
where schemaname = 'public'
order by tablename;

-- 기대 결과 (9건):
-- checklist_items
-- checklists
-- couples
-- expenses
-- itinerary_items
-- messages
-- notes
-- profiles
-- trips


-- ============================================================
-- CHECK 2: RLS 활성화 확인 (모든 테이블 rowsecurity = true)
-- ============================================================
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 기대 결과: rowsecurity 컬럼이 모두 true
-- 하나라도 false면 → schema.sql의 "alter table ... enable row level security" 누락


-- ============================================================
-- CHECK 3: RLS 정책 목록 확인
-- ============================================================
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 기대 결과: 각 테이블마다 정책 1~2개 존재
-- couples: 1개 (select)
-- profiles: 2개 (select, update)
-- trips, messages, notes, checklists, expenses: 각 1개 (all)
-- itinerary_items, checklist_items: 각 1개 (all, via join)


-- ============================================================
-- CHECK 4: profiles 2건 + 동일 couple_id 확인
-- ============================================================
select
  display_name,
  couple_id,
  created_at
from public.profiles
order by created_at;

-- 기대 결과: 2건, couple_id가 동일한 UUID


-- ============================================================
-- CHECK 5: my_couple_id 함수 존재 확인
-- ============================================================
select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name   = 'my_couple_id';

-- 기대 결과:
-- routine_name | security_type
-- my_couple_id | DEFINER
-- security_type이 DEFINER 여야 함 (SECURITY DEFINER 적용 확인)


-- ============================================================
-- CHECK 6: Realtime publication 확인
-- ============================================================
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime';

-- 기대 결과: messages 테이블이 포함되어야 함
-- 없으면 → SQL Editor에서 아래 실행:
--   alter publication supabase_realtime add table public.messages;
-- 또는 대시보드 Database > Replication > supabase_realtime > messages 체크


-- ============================================================
-- CHECK 7: updated_at trigger 확인
-- ============================================================
select trigger_name, event_object_table, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public';

-- 기대 결과:
-- trigger_name            | event_object_table | action_timing | event_manipulation
-- notes_set_updated_at    | notes              | BEFORE        | UPDATE


-- ============================================================
-- CHECK 8: 인덱스 6개 생성 확인
-- ============================================================
select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and indexname like 'idx_%'
order by tablename, indexname;

-- 기대 결과 (6건):
-- idx_checklist_items_sort      | checklist_items
-- idx_checklists_trip            | checklists
-- idx_expenses_trip_paid         | expenses
-- idx_itinerary_trip_day_sort    | itinerary_items
-- idx_messages_couple_created    | messages
-- idx_profiles_couple            | profiles


-- ============================================================
-- RLS 실제 동작 확인 (앱에서 수행)
-- SQL Editor에서는 불가 — service role이 RLS를 우회하기 때문
-- ============================================================
--
-- 앱에서 각 계정으로 로그인한 뒤:
--
-- [계정 1로 로그인]
-- 1. 여행 1개 생성 → DB에 저장되는지 확인
-- 2. supabase.from('trips').select() → 방금 만든 여행만 보이는지 확인
--
-- [계정 2로 로그인]
-- 3. supabase.from('trips').select() → 계정 1이 만든 여행이 보이는지 확인
--    (같은 couple_id → 보여야 함)
--
-- [더미 3번째 계정으로 로그인 — 가능하면]
-- 4. supabase.from('trips').select() → 결과 0건이어야 함
--    (다른 couple_id → 차단되어야 함)
--
-- 3번째 계정 테스트가 어려우면 최소한 1-3번만 확인.
