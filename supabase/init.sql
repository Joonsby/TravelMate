-- ============================================================
-- TravelMate — 초기 데이터 세팅 SQL
-- schema.sql 실행 완료 후 이 파일을 순서대로 실행
--
-- 실행 위치: Supabase 대시보드 → SQL Editor
-- 주의: SQL Editor는 service role(관리자) 권한 → RLS 우회됨
--       여기서 보이는 데이터가 앱에서도 보인다는 뜻이 아님
-- ============================================================


-- ============================================================
-- STEP 1: couples row 생성
-- ============================================================
-- 아래 쿼리 실행 후 반환된 id를 복사해 둡니다.
-- 이 UUID가 두 계정을 연결하는 핵심 값입니다.

insert into public.couples (id)
values (gen_random_uuid())
returning id as couple_id;

-- 결과 예시: 550e8400-e29b-41d4-a716-446655440000
-- → 이 값을 STEP 3에서 사용


-- ============================================================
-- STEP 2: Supabase Auth에서 계정 2개 생성 (SQL 아님)
-- ============================================================
-- 1. Supabase 대시보드 → Authentication → Users
-- 2. "Add user" 버튼 클릭
-- 3. 첫 번째 계정 (본인):
--    - Email: 본인 이메일
--    - Password: 비밀번호 설정
--    - "Auto Confirm User" 체크 (이메일 인증 생략)
-- 4. 두 번째 계정 (상대방) 동일하게 반복
-- 5. 두 계정 각각의 UUID 복사 (Users 목록의 "UUID" 컬럼)
--
-- 생성 후 각 UUID 메모:
--   User 1 UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
--   User 2 UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx


-- ============================================================
-- STEP 3: profiles에 두 사용자 연결
-- ============================================================
-- STEP 1의 couple_id, STEP 2의 user UUID로 값 교체 후 실행

insert into public.profiles (id, couple_id, display_name)
values
  (
    '76e2384c-f458-48e3-93f9-0701ebbd1255',    -- Auth > Users에서 복사한 첫 번째 UUID
    '0a2a3722-1d08-43b2-bfab-940b342a1b4c',    -- STEP 1에서 반환된 couple_id
    '준섭'               -- 앱에 표시될 이름 (예: 준섭)
  ),
  (
    '09bfec58-1c2b-49f7-a083-ced4de2a1341',    -- Auth > Users에서 복사한 두 번째 UUID
    '0a2a3722-1d08-43b2-bfab-940b342a1b4c',    -- 위와 동일한 couple_id
    '수연'               -- 상대방 이름 (예: 수연)
  );

-- 실행 후 "2 rows inserted" 확인
-- 에러 발생 시 → supabase/troubleshooting.md 참고


-- ============================================================
-- STEP 4: 연결 확인 쿼리
-- ============================================================
-- 아래 쿼리로 2건이 같은 couple_id인지 확인

select
  p.id          as user_id,
  p.display_name,
  p.couple_id,
  c.id          as couple_exists
from public.profiles p
join public.couples c on c.id = p.couple_id
order by p.created_at;

-- 기대 결과:
-- user_id                               | display_name | couple_id                            | couple_exists
-- xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  | 이름1        | 550e8400-e29b-41d4-a716-446655440000 | 550e8400-...
-- xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  | 이름2        | 550e8400-e29b-41d4-a716-446655440000 | 550e8400-...
-- → couple_id 두 줄이 동일하면 정상
