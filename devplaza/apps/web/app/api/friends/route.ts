import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [accepted, incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender:   { select: { id: true, nickname: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, nickname: true, username: true, avatarUrl: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        sender: { select: { id: true, nickname: true, username: true, avatarUrl: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: {
        receiver: { select: { id: true, nickname: true, username: true, avatarUrl: true } },
      },
    }),
  ]);

  const friends = accepted.map((f) =>
    f.senderId === userId ? f.receiver : f.sender
  );

  return NextResponse.json({ friends, incoming, outgoing });
}
