import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/groups - 获取当前用户所有分组
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(groups);
}

// POST /api/groups - 创建分组
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { name, color } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "分组名称不能为空" }, { status: 400 });
  }

  try {
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        color: color || "#6B7280",
        userId: session.user.id,
      },
    });
    return NextResponse.json(group);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "分组名已存在" }, { status: 400 });
    }
    console.error("创建分组失败:", err);
    return NextResponse.json({ error: "创建分组失败" }, { status: 500 });
  }
}
