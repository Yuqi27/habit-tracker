import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// DELETE /api/habits/[id] - 删除习惯
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证习惯属于当前用户
  const habit = await prisma.habit.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!habit) {
    return NextResponse.json({ error: "习惯不存在" }, { status: 404 });
  }

  await prisma.habit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/habits/[id] - 修改习惯
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const { name, description, color } = await req.json();

  // 验证习惯属于当前用户
  const habit = await prisma.habit.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!habit) {
    return NextResponse.json({ error: "习惯不存在" }, { status: 404 });
  }

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(color !== undefined && { color }),
    },
  });
  return NextResponse.json(updated);
}
