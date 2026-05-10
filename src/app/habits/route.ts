import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/habits - 获取当前用户的所有习惯（包含每个习惯的打卡记录）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: { checkins: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(habits);
}

// POST /api/habits - 创建新习惯
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { name, description, color } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "习惯名称不能为空" }, { status: 400 });
  }
  const habit = await prisma.habit.create({
    data: {
      name,
      description: description || "",
      color: color || "#3B82F6",
      userId: session.user.id,
    },
  });
  return NextResponse.json(habit);
}