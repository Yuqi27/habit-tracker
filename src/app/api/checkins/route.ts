import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/checkins - 打卡
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { habitId, date } = await req.json();
  if (!habitId || !date) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  // 验证格式 YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式错误" }, { status: 400 });
  }

  try {
    await prisma.checkin.create({
      data: {
        id: crypto.randomUUID(),
        habitId,
        userId: session.user.id,
        date, // 直接存 YYYY-MM-DD 字符串，无时区问题
      },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // P2002 = 唯一约束冲突（同一个 habit + 同一天已打卡）
    if (err.code === "P2002") {
      return NextResponse.json({ error: "今日已打卡" }, { status: 400 });
    }
    console.error("打卡失败:", err);
    return NextResponse.json({ error: "打卡失败" }, { status: 500 });
  }
}

// DELETE /api/checkins - 取消打卡
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { habitId, date } = await req.json();
  if (!habitId || !date) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式错误" }, { status: 400 });
  }

  // 查找当天的打卡记录
  const checkin = await prisma.checkin.findFirst({
    where: {
      habitId,
      userId: session.user.id,
      date, // 直接匹配 YYYY-MM-DD 字符串
    },
  });

  if (!checkin) {
    return NextResponse.json({ error: "今日未打卡" }, { status: 400 });
  }

  await prisma.checkin.delete({
    where: { id: checkin.id },
  });

  return NextResponse.json({ success: true });
}
