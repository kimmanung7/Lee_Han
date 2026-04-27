# DevPlaza — 프로젝트 명세서 v2

개발자 전용 실시간 2D 오픈월드 커뮤니티 플랫폼.
GitHub으로 로그인하면 캐릭터가 생성되고, 사이버펑크 미래도시 맵에서 다른 개발자들과 실시간으로 돌아다니며 소통한다.
건물에 입장하면 맵이 전환되고 해당 공간 전용 채팅 UI가 활성화된다.

---

## 컨셉

- **세계관**: 사이버펑크 미래도시로 변한 지구
- **광장/방 개념 없음**: 맵 자체가 세계이고 건물이 방 역할
- **건물은 미리 배치**: 유저가 건물을 짓지 않음, 맵에 고정 배치
- **구역(Zone)**: 맵을 여러 구역으로 나눠 테마별 건물 배치 (구역 설계는 맵 구현 단계에서 확정)
- **타겟**: 글로벌 개발자

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) + TypeScript | 로그인/프로필/설정 등 앱 부분 담당 |
| 2D 맵 엔진 | Phaser.js 3 | Canvas 기반 게임 엔진, 대형 맵 + 캐릭터 이동에 최적 |
| 맵 제작 | Tiled Map Editor | 무료 맵 에디터, Phaser와 궁합 최고 (.tmj 포맷) |
| 인증 | NextAuth.js v5 | GitHub OAuth |
| 실시간 | Socket.IO (별도 서버) | 캐릭터 위치 동기화, 건물별 채팅 |
| DB | Supabase (PostgreSQL) | 유저/캐릭터/건물 데이터 |
| ORM | Prisma | 타입 안전, 마이그레이션 |
| 스타일 | Tailwind CSS | 채팅 UI 등 Next.js 부분 |
| 배포 | Vercel (Next.js) + Render (Socket.IO 서버, 무료) |

---

## 아키텍처 개요

```
[브라우저]
    │
    ├── Next.js (Vercel)
    │       ├── /login          — GitHub OAuth 로그인
    │       ├── /setup          — 캐릭터 설정 (닉네임, 외형)
    │       └── /world          — Phaser.js 게임 마운트 포인트
    │               └── Phaser Scene
    │                       ├── WorldScene     — 야외 맵 (돌아다니기)
    │                       └── BuildingScene  — 건물 내부 맵 + 채팅 UI
    │
    └── Socket.IO 서버 (Render)
            ├── 야외 위치 동기화  — 캐릭터 이동 브로드캐스트
            └── 건물별 채팅방    — 건물 ID 기준으로 룸 분리
```

---

## 폴더 구조

```
devplaza/
├── apps/
│   ├── web/                        # Next.js 앱
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/          — 로그인 페이지
│   │   │   ├── setup/              — 캐릭터 설정
│   │   │   ├── world/              — Phaser 마운트 페이지
│   │   │   └── api/
│   │   │       ├── auth/           — NextAuth
│   │   │       ├── user/           — 유저 프로필 API
│   │   │       └── buildings/      — 건물 목록 API
│   │   ├── components/
│   │   │   ├── game/
│   │   │   │   └── GameCanvas.tsx  — Phaser 동적 임포트 래퍼
│   │   │   ├── chat/
│   │   │   │   └── ChatUI.tsx      — 건물 내부 채팅 UI
│   │   │   └── ui/                 — 공통 컴포넌트
│   │   ├── game/                   # Phaser 게임 코드 (순수 TS)
│   │   │   ├── index.ts            — Phaser 게임 인스턴스 생성
│   │   │   ├── scenes/
│   │   │   │   ├── BootScene.ts    — 에셋 로딩
│   │   │   │   ├── WorldScene.ts   — 야외 맵
│   │   │   │   └── BuildingScene.ts — 건물 내부
│   │   │   ├── objects/
│   │   │   │   ├── Player.ts       — 내 캐릭터
│   │   │   │   └── OtherPlayer.ts  — 다른 유저 캐릭터
│   │   │   └── utils/
│   │   │       └── socketManager.ts — Socket.IO 클라이언트
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── prisma.ts
│   │   │   └── github.ts
│   │   └── public/
│   │       └── assets/
│   │           ├── maps/           — Tiled .tmj 맵 파일
│   │           ├── tilesets/       — 타일셋 이미지
│   │           └── sprites/        — 캐릭터 스프라이트
│   │
│   └── socket-server/              # Socket.IO 서버
│       ├── index.ts
│       └── handlers/
│           ├── movement.ts         — 캐릭터 이동 동기화
│           └── chat.ts             — 건물별 채팅
│
├── prisma/
│   └── schema.prisma
└── .env.example
```

---

## DB 스키마 (Prisma)

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
}

model User {
  id           String    @id @default(cuid())
  githubId     String    @unique
  username     String    @unique
  name         String
  avatarUrl    String
  githubUrl    String

  // GitHub 데이터
  topLanguages String[]
  totalStars   Int       @default(0)
  totalRepos   Int       @default(0)
  followers    Int       @default(0)

  // 캐릭터
  nickname     String?
  gender       Gender?
  skinColor    String?
  // spriteKey는 나중에 캐릭터 디자인 확정 후 추가

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  messages     Message[]
}

model Building {
  id          String    @id @default(cuid())
  name        String
  description String?
  zone        String    // 구역 이름 (나중에 확정)
  mapX        Int       // 맵 상 위치 X
  mapY        Int       // 맵 상 위치 Y

  messages    Message[]
}

model Message {
  id         String   @id @default(cuid())
  content    String
  createdAt  DateTime @default(now())

  userId     String
  user       User     @relation(fields: [userId], references: [id])

  buildingId String
  building   Building @relation(fields: [buildingId], references: [id])
}
```

---

## Socket.IO 이벤트 명세

### 야외 맵 (WorldScene)

| 이벤트 | 방향 | payload | 설명 |
|--------|------|---------|------|
| `player:join` | client→server | `{ userId, nickname, x, y, spriteKey }` | 월드 입장 |
| `player:move` | client→server | `{ x, y, direction }` | 내 캐릭터 이동 |
| `player:moved` | server→client | `{ userId, x, y, direction }` | 다른 유저 이동 브로드캐스트 |
| `player:leave` | server→client | `{ userId }` | 유저 퇴장 |
| `world:players` | server→client | `Player[]` | 입장 시 현재 접속자 목록 |

### 건물 내부 (BuildingScene)

| 이벤트 | 방향 | payload | 설명 |
|--------|------|---------|------|
| `building:enter` | client→server | `{ buildingId }` | 건물 입장 |
| `building:leave` | client→server | `{ buildingId }` | 건물 퇴장 |
| `chat:send` | client→server | `{ buildingId, content }` | 메시지 전송 |
| `chat:message` | server→client | `{ userId, nickname, content, createdAt }` | 메시지 브로드캐스트 |
| `building:users` | server→client | `User[]` | 현재 건물 내 유저 목록 |

---

## 라우팅 흐름

```
GitHub 로그인
    │
    ├── nickname 없음 → /setup (캐릭터 설정)
    │                       └── 완료 → /world
    │
    └── nickname 있음 → /world
                            │
                            └── Phaser 로드
                                    ├── BootScene  (에셋 로딩)
                                    └── WorldScene (야외 맵)
                                            └── 건물 충돌 감지
                                                    └── BuildingScene (내부 맵 + 채팅)
```

---

## 개발 순서

### Stage 1 (현재 완료)
- [x] GitHub OAuth 로그인
- [x] 캐릭터 설정 페이지 (/setup)
- [x] 로비 페이지 (/lobby) — v2에서 /world로 대체 예정
- [x] DB 저장 및 재로그인 유지

### Stage 2 — Phaser 기반 세계 구현
1. Phaser.js 설치 및 Next.js에 동적 임포트로 연결
2. BootScene — 에셋 로딩
3. WorldScene — 기본 맵 + 캐릭터 이동 (WASD/방향키)
4. Socket.IO 서버 세팅 — 위치 동기화
5. 다른 유저 캐릭터 실시간 표시
6. 건물 충돌 감지 → BuildingScene 전환
7. BuildingScene — 내부 맵 + 채팅 UI

### Stage 3 — 콘텐츠 확장
- 구역별 맵 디자인 (Tiled)
- 캐릭터 스프라이트 디자인 적용
- 건물 종류별 테마 UI
- 프로필 카드 (건물 안에서 유저 클릭 시)

### v2 이후
- 캐릭터 커스터마이징 고도화
- 아이템/악세사리
- 친구 시스템
- 미니맵

---

## 환경변수 (.env.local)

```env
# DB
DATABASE_URL=
DIRECT_URL=

# Auth
AUTH_SECRET=
GITHUB_ID=
GITHUB_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## 주요 라이브러리

```bash
# Next.js 앱
npm install phaser
npm install socket.io-client

# Socket.IO 서버
npm install socket.io express
npm install -D typescript ts-node @types/node
```

## 참고사항

- Phaser는 SSR 불가 → `dynamic(() => import('../game/GameCanvas'), { ssr: false })`로 반드시 클라이언트 전용 임포트
- 캐릭터 스프라이트 디자인은 미확정 → BootScene에서 임시 placeholder 사용
- 맵 구역 및 건물 배치는 Stage 2 진입 시 Tiled로 설계
- Socket.IO 서버는 Render 무료 티어 사용 (Railway 무료 티어 없음)
