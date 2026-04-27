-- Supabase SQL Editor에 붙여넣어 실행하세요.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "nickname"  TEXT,
  ADD COLUMN IF NOT EXISTS "gender"    TEXT,
  ADD COLUMN IF NOT EXISTS "skinColor" TEXT;
