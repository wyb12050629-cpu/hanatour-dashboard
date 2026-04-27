-- 김기웅 선임님 거래처 엑셀 양식 지원
-- agencies 테이블에 대표자명(representative) 컬럼 추가
--
-- 적용 방법:
--   Supabase Dashboard → SQL Editor 에서 아래 문을 실행

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS representative TEXT DEFAULT '';
