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

  // 直接用 SQLite 的 date() 函数存储本地日期，不走任何 JS Date 时区转换
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM Checkin
    WHERE habitId = ${habitId}
      AND userId = ${session.user.id}
      AND date(date / 1000, 'unixepoch', 'localtime') = ${date}
  `;

  if (existing.length > 0) {
    return NextResponse.json({ error: "今日已打卡" }, { status: 400 });
  }

  // 用 Unix 时间戳存入 UTC，date() 函数保证存的是本地日期
  const localDate = new Date(`${date}T00:00:00`);
  const unixMs = localDate.getTime();

  await prisma.$executeRaw`
    INSERT INTO Checkin (id, habitId, userId, date)
    VALUES (
      ${crypto.randomUUID()},
      ${habitId},
      ${session.user.id},
      ${Math.floor(unixMs / 1000)}
    )
  `;

  return NextResponse.json({ success: true });
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

  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM Checkin
    WHERE habitId = ${habitId}
      AND userId = ${session.user.id}
      AND date(date / 1000, 'unixepoch', 'localtime') = ${date}
  `;

  if (existing.length === 0) {
    return NextResponse.json({ error: "今日未打卡" }, { status: 400 });
  }

  await prisma.$executeRaw`
    DELETE FROM Checkin WHERE id = ${existing[0].id}
  `;

  return NextResponse.json({ success: true });
}
