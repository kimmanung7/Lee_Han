import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PixelCharacter from "@/components/PixelCharacter";

const LEVEL_BADGE: Record<string, { label: string; color: string }> = {
  NEWCOMER: { label: "Newcomer", color: "bg-gray-600 text-gray-200" },
  JUNIOR:   { label: "Junior",   color: "bg-green-700 text-green-200" },
  SENIOR:   { label: "Senior",   color: "bg-blue-700 text-blue-200" },
  EXPERT:   { label: "Expert",   color: "bg-purple-700 text-purple-200" },
  LEGEND:   { label: "Legend",   color: "bg-yellow-600 text-yellow-100" },
};

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.nickname) redirect("/setup");

  const user = session.user;
  const badge = LEVEL_BADGE[user.level ?? "NEWCOMER"] ?? LEVEL_BADGE.NEWCOMER;
  const gender = user.gender ?? "MALE";
  const skinColor = user.skinColor ?? "light";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between shrink-0">
        <span className="text-lg font-bold tracking-tight">DevPlaza</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
          {user.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-gray-700" />
          )}
          <span className="text-sm text-gray-300">{user.nickname}</span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Friends (placeholder) */}
        <aside className="w-56 border-r border-gray-800 bg-gray-900 flex flex-col p-4 shrink-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">친구</p>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-700 text-xs text-center">친구 기능<br />준비 중</p>
          </div>
        </aside>

        {/* Main — Character room */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Room background */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Floor grid */}
            <div
              className="absolute bottom-0 left-0 right-0 h-40 opacity-10"
              style={{
                backgroundImage: "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* Shadow under character */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-28 h-6 bg-black/40 rounded-full blur-md" />

            {/* Character */}
            <div className="relative z-10 flex flex-col items-center gap-3 mb-16">
              <div
                className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1 text-xs text-indigo-300"
              >
                {user.nickname}
              </div>
              <PixelCharacter gender={gender} skinColor={skinColor} pixelSize={20} />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="shrink-0 border-t border-gray-800 bg-gray-900/50 px-8 py-4 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              ⭐ {user.totalStars ?? 0} &nbsp; 👥 {user.followers ?? 0}
            </div>
            <Link
              href="/world"
              className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg shadow-indigo-900/40"
            >
              광장 입장 →
            </Link>
          </div>
        </main>

        {/* Right — Accessories (placeholder) */}
        <aside className="w-56 border-l border-gray-800 bg-gray-900 flex flex-col p-4 shrink-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">악세사리</p>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-700 text-xs text-center">악세사리 기능<br />준비 중</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
