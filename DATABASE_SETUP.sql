-- ============================================
-- PostgreSQL용 users 테이블 생성 SQL
-- DBeaver에서 Render PostgreSQL에 연결 후 실행하세요
-- ============================================

-- 1. 기존 테이블이 있다면 삭제 (주의: 데이터가 모두 삭제됩니다)
-- 처음 생성하는 경우 이 줄은 주석 처리하세요
-- DROP TABLE IF EXISTS users CASCADE;

-- 2. users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(255),
  "profileImageUrl" VARCHAR(255),
  bio TEXT,
  "refreshToken" VARCHAR(255),
  "refreshTokenExpiresAt" TIMESTAMP(6),
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS "IDX_email" ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_username" ON users(username);

-- 4. updatedAt 자동 업데이트를 위한 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP(6);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. updatedAt 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 테이블 생성 확인 (선택사항)
-- SELECT * FROM users;

