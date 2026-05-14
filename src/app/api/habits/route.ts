import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  
  const { name, description, color, groupId } = await req.json();
  
  // 如果传了 groupId，验证分组存在且属于当前用户
  if (groupId) {
    const group = await prisma.group.findFirst({
      where: { id: groupId, userId: session.user.id },
    });
    if (!group) {
      return NextResponse.json({ error: "分组不存在" }, { status: 400 });
    }
  }

  const habit = await prisma.habit.create({
    data: {
      name,
      description,
      color: color || "#3B82F6",
      userId: session.user.id,
      ...(groupId !== undefined && { groupId }),
    },
    include: { checkins: true, group: true },
  });
  return NextResponse.json(habit);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([]);
  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: { checkins: true, group: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(habits);
}
