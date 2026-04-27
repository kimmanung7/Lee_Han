-- Supabase SQL Editor에 붙여넣어 실행하세요.

-- Enum 타입
CREATE TYPE "UserLevel" AS ENUM ('NEWCOMER', 'JUNIOR', 'SENIOR', 'EXPERT', 'LEGEND');

-- User 테이블
CREATE TABLE "User" (
  "id"           TEXT        NOT NULL,
  "githubId"     TEXT        NOT NULL,
  "username"     TEXT        NOT NULL,
  "name"         TEXT        NOT NULL,
  "avatarUrl"    TEXT        NOT NULL,
  "bio"          TEXT,
  "githubUrl"    TEXT        NOT NULL,
  "topLanguages" TEXT[]      NOT NULL DEFAULT '{}',
  "totalStars"   INTEGER     NOT NULL DEFAULT 0,
  "totalRepos"   INTEGER     NOT NULL DEFAULT 0,
  "followers"    INTEGER     NOT NULL DEFAULT 0,
  "level"        "UserLevel" NOT NULL DEFAULT 'NEWCOMER',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Room 테이블
CREATE TABLE "Room" (
  "id"          TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "description" TEXT,
  "isPublic"    BOOLEAN      NOT NULL DEFAULT true,
  "maxMembers"  INTEGER      NOT NULL DEFAULT 10,
  "tags"        TEXT[]       NOT NULL DEFAULT '{}',
  "ownerId"     TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Room"
  ADD CONSTRAINT "Room_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- RoomMember 테이블
CREATE TABLE "RoomMember" (
  "userId"   TEXT         NOT NULL,
  "roomId"   TEXT         NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("userId", "roomId")
);

ALTER TABLE "RoomMember"
  ADD CONSTRAINT "RoomMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "RoomMember"
  ADD CONSTRAINT "RoomMember_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- Message 테이블
CREATE TABLE "Message" (
  "id"        TEXT         NOT NULL,
  "content"   TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"    TEXT         NOT NULL,
  "roomId"    TEXT         NOT NULL,

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id")
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- Prisma 마이그레이션 기록 테이블 (선택사항 — Prisma와 함께 쓸 경우 필요)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    VARCHAR(36)  NOT NULL,
  "checksum"              VARCHAR(64)  NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        VARCHAR(255) NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "applied_steps_count"   INTEGER      NOT NULL DEFAULT 0,

  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);
