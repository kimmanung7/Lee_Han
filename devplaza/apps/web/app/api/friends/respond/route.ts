import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friendshipId, action } = await req.json() as { friendshipId: string; action: "accept" | "reject" };
  if (!friendshipId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const userId = session.user.id;

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.receiverId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: action === "accept" ? "ACCEPTED" : "REJECTED" },
    include: {
      sender: { select: { id: true, nickname: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ friendship: updated });
}
