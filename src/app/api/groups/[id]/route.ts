import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// PATCH /api/groups/[id] - 更新分组
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证分组属于当前用户
  const group = await prisma.group.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!group) {
    return NextResponse.json({ error: "分组不存在" }, { status: 404 });
  }

  const { name, color } = await req.json();

  try {
    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "分组名已存在" }, { status: 400 });
    }
    console.error("更新分组失败:", err);
    return NextResponse.json({ error: "更新分组失败" }, { status: 500 });
  }
}

// DELETE /api/groups/[id] - 删除分组（关联习惯的 groupId 置 null）
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  // 验证分组属于当前用户
  const group = await prisma.group.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!group) {
    return NextResponse.json({ error: "分组不存在" }, { status: 404 });
  }

  // 先将关联习惯的 groupId 置 null（虽然 onDelete: SetNull 会自动处理，但显式处理更安全）
  await prisma.habit.updateMany({
    where: { groupId: id },
    data: { groupId: null },
  });

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
