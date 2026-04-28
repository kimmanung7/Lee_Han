"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function saveSetup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const nickname = (formData.get("nickname") as string).trim();
  const gender = formData.get("gender") as string;
  const skinColor = formData.get("skinColor") as string;

  if (!nickname || !gender || !skinColor) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { nickname, gender, skinColor },
  });

  redirect("/lobby");
}
