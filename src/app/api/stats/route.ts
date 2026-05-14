import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/stats?habitId=xxx
 * 返回指定习惯的统计数据：
 * - streak: 当前连续打卡天数（从今天往前数，直到缺卡）
 * - total: 总打卡次数
 * - dates: 所有打卡日期（YYYY-MM-DD 数组）
 * - monthlyData: 按月聚合的打卡次数（用于图表）
 */
export async function GET(req: Request) {
  // 1. 验证登录
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 2. 获取查询参数 habitId
  const { searchParams } = new URL(req.url);
  const habitId = searchParams.get("habitId");
  if (!habitId) {
    return NextResponse.json({ error: "缺少 habitId 参数" }, { status: 400 });
  }

  // 3. 查询该习惯的所有打卡记录（date 字段为 YYYY-MM-DD 字符串）
  const checkins = await prisma.checkin.findMany({
    where: {
      habitId: habitId,
      userId: session.user.id,
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "asc", // 按日期升序
    },
  });

  // 4. 提取打卡日期字符串数组（已经是 YYYY-MM-DD）
  const dates = checkins.map((c) => c.date);

  // 5. 计算当前连续天数
  let streak = 0;
  const now = new Date();
  // 用本地日期生成 YYYY-MM-DD
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (true) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    if (dates.includes(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 6. 按月统计打卡次数
  const monthlyMap = new Map<string, number>();
  for (const dateStr of dates) {
    const yearMonth = dateStr.substring(0, 7); // "2026-05" 格式
    monthlyMap.set(yearMonth, (monthlyMap.get(yearMonth) || 0) + 1);
  }

  const monthlyData = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // 7. 获取最近7天的打卡情况
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    last7Days.push({
      date: dateStr,
      checked: dates.includes(dateStr),
    });
  }

  // 8. 返回统计结果
  return NextResponse.json({
    streak,
    total: dates.length,
    dates,
    monthlyData,
    last7Days,
  });
}
