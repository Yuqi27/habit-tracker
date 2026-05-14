import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/export?habitId=xxx - 导出 CSV
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const habitId = searchParams.get("habitId");
  if (!habitId) {
    return NextResponse.json({ error: "缺少 habitId 参数" }, { status: 400 });
  }

  // 获取习惯信息
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: session.user.id },
  });
  if (!habit) {
    return NextResponse.json({ error: "习惯不存在" }, { status: 404 });
  }

  // 获取所有打卡记录
  const checkins = await prisma.checkin.findMany({
    where: { habitId, userId: session.user.id },
    orderBy: { date: "asc" },
    select: { date: true, note: true },
  });

  // 构建 CSV 内容（UTF-8 with BOM）
  const BOM = "\uFEFF";
  const header = "日期,打卡状态,备注\n";
  const rows = checkins.map((c) => {
    const date = c.date;
    const status = "是";
    const note = c.note ? `"${c.note.replace(/"/g, '""')}"` : "";
    return `${date},${status},${note}`;
  });
  const csv = BOM + header + rows.join("\n");

  // 文件名：习惯名称-打卡记录.csv
  const fileName = encodeURIComponent(`${habit.name}-打卡记录.csv`);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
    },
  });
}
