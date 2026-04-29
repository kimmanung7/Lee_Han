import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUsername } = await req.json();
  if (!targetUsername) return NextResponse.json({ error: "targetUsername required" }, { status: 400 });

  const senderId = session.user.id;

  const target = await prisma.user.findUnique({
    where: { username: targetUsername },
    select: { id: true, nickname: true, username: true, avatarUrl: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === senderId) return NextResponse.json({ error: "Can't add yourself" }, { status: 400 });

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId, receiverId: target.id },
        { senderId: target.id, receiverId: senderId },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "Already exists" }, { status: 409 });

  const friendship = await prisma.friendship.create({
    data: { senderId, receiverId: target.id },
  });

  return NextResponse.json({ friendship, target });
}
