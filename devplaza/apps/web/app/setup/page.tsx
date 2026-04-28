import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SetupForm from "@/components/SetupForm";

export default async function SetupPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.nickname) redirect("/lobby");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">캐릭터 설정</h1>
        <p className="text-gray-400 text-sm">광장에서 사용할 내 캐릭터를 꾸며보세요</p>
      </div>
      <SetupForm />
    </div>
  );
}
