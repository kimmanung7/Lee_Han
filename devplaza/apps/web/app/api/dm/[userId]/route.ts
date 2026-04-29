import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = session.user.id;
  const { userId: otherId } = await params;

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      sender: { select: { id: true, nickname: true, avatarUrl: true } },
    },
  });

  await prisma.directMessage.updateMany({
    where: { senderId: otherId, receiverId: myId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = session.user.id;
  const { userId: receiverId } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const message = await prisma.directMessage.create({
    data: { senderId: myId, receiverId, content: content.trim() },
    include: { sender: { select: { id: true, nickname: true, avatarUrl: true } } },
  });

  return NextResponse.json({ message });
}
