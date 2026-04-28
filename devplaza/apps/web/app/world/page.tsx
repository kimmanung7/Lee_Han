import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorldClient from "./WorldClient";

export default async function WorldPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.nickname) redirect("/setup");

  const { id, nickname, gender, skinColor } = session.user;

  return (
    <WorldClient
      userId={id}
      nickname={nickname!}
      gender={gender ?? "MALE"}
      skinColor={skinColor ?? "light"}
    />
  );
}
