import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const LEVEL_BADGE: Record<string, { label: string; color: string }> = {
  NEWCOMER: { label: "Newcomer", color: "bg-gray-600 text-gray-200" },
  JUNIOR:   { label: "Junior",   color: "bg-green-700 text-green-200" },
  SENIOR:   { label: "Senior",   color: "bg-blue-700 text-blue-200" },
  EXPERT:   { label: "Expert",   color: "bg-purple-700 text-purple-200" },
  LEGEND:   { label: "Legend",   color: "bg-yellow-600 text-yellow-100" },
};

const MOCK_ROOMS = [
  { id: "1", name: "🦀 Rust 스터디",      description: "Rust 입문부터 실전까지", tags: ["rust", "systems"], members: 5,  maxMembers: 10, isPublic: true },
  { id: "2", name: "⚛️ React 심화",        description: "RSC, Suspense, 최신 패턴 탐구", tags: ["react", "frontend"], members: 8,  maxMembers: 10, isPublic: true },
  { id: "3", name: "🐍 Python ML",         description: "머신러닝 논문 리뷰 & 구현", tags: ["python", "ml"], members: 3,  maxMembers: 8,  isPublic: true },
  { id: "4", name: "🔐 보안 연구실",        description: "CTF, 취약점 분석",         tags: ["security"], members: 2,  maxMembers: 6,  isPublic: false },
  { id: "5", name: "☁️ DevOps & Cloud",   description: "AWS, k8s, CI/CD 실무 공유", tags: ["devops", "cloud"], members: 6,  maxMembers: 12, isPublic: true },
];

export default async function PlazaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    name?: string | null;
    image?: string | null;
    avatarUrl?: string;
    username?: string;
    level?: string;
    totalStars?: number;
    followers?: number;
  };

  const level = user.level ?? "NEWCOMER";
  const badge = LEVEL_BADGE[level] ?? LEVEL_BADGE.NEWCOMER;
  const avatarUrl = user.avatarUrl ?? user.image ?? "";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">DevPlaza</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-gray-700" />
          )}
          <span className="text-sm text-gray-300">{user.username ?? user.name}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 border-r border-gray-800 bg-gray-900 flex flex-col p-4 gap-1 shrink-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">메뉴</p>
          <NavItem icon="🏛️" label="광장" active />
          <NavItem icon="💬" label="내 방" />
          <NavItem icon="⭐" label="즐겨찾기" />
          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="text-xs text-gray-500 space-y-1">
              <p>⭐ {user.totalStars ?? 0} stars</p>
              <p>👥 {user.followers ?? 0} followers</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">광장</h1>
              <p className="text-gray-400 text-sm mt-1">개발자들이 모이는 공간</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg">
              + 방 만들기
            </button>
          </div>

          {/* Filter tags */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {["전체", "rust", "react", "python", "devops", "security"].map((tag) => (
              <button
                key={tag}
                className="text-xs px-3 py-1 rounded-full border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Room grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_ROOMS.map((room) => (
              <div
                key={room.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-600 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-semibold text-base leading-tight">{room.name}</h2>
                  {!room.isPublic && (
                    <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">비공개</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm flex-1">{room.description}</p>
                <div className="flex flex-wrap gap-1">
                  {room.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-500">
                    {room.members} / {room.maxMembers} 명
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: room.members }).map((_, i) => (
                      <div key={i} className="w-5 h-5 rounded-full bg-gray-700 border border-gray-600" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <button
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left transition-colors ${
        active
          ? "bg-indigo-900/50 text-indigo-300"
          : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
