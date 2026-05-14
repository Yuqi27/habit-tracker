import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 计算历史最佳连续打卡天数
function calculateBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...dates].sort();
  let bestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1]);
    const currDate = new Date(sorted[i]);
    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}

/**
 * GET /api/stats?habitId=xxx
 * 返回指定习惯的统计数据
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

  // 3. 查询该习惯的所有打卡记录
  const checkins = await prisma.checkin.findMany({
    where: {
      habitId: habitId,
      userId: session.user.id,
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // 4. 提取打卡日期字符串数组
  const dates = checkins.map((c) => c.date);

  // 5. 计算当前连续天数
  let streak = 0;
  const now = new Date();
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
    const yearMonth = dateStr.substring(0, 7);
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

  // 8. 计算最佳连续天数
  const bestStreak = calculateBestStreak(dates);

  // 9. 计算完成率（从第一次打卡到今天）
  let totalDaysSinceStart = 0;
  let completionRate = 0;
  if (dates.length > 0) {
    const firstDate = new Date(dates[0]);
    const startDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    totalDaysSinceStart = Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    completionRate = totalDaysSinceStart > 0
      ? Math.round((dates.length / totalDaysSinceStart) * 10000) / 10000
      : 0;
  }

  // 10. 生成热力图数据（最近365天）
  const heatmapData = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    heatmapData.push({
      date: dateStr,
      checked: dates.includes(dateStr),
    });
  }

  // 11. 返回统计结果
  return NextResponse.json({
    streak,
    total: dates.length,
    dates,
    monthlyData,
    last7Days,
    bestStreak,
    completionRate,
    totalDaysSinceStart,
    heatmapData,
  });
}
