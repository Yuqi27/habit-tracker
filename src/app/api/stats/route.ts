// src/app/api/stats/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays, isSameDay } from "date-fns";

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

  // 3. 查询该习惯的所有打卡记录（仅日期字段）
  const checkins = await prisma.checkin.findMany({
    where: {
      habitId: habitId,
      userId: session.user.id,
    },
    select: {
      date: true,
    },
    orderBy: {
      date: "asc", // 按日期升序，方便后续统计
    },
  });

  // 4. 提取打卡日期字符串数组（YYYY-MM-DD）
  const dates = checkins.map((c) => format(c.date, "yyyy-MM-dd"));

  // 5. 计算当前连续天数（从今天开始往前推，遇到未打卡的日期就停止）
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 归一化到当天零点
  let currentDate = new Date(today);

  while (true) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    if (dates.includes(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1); // 往前一天
    } else {
      break;
    }
  }

  // 6. 按月统计打卡次数（用于图表展示）
  // 方法：遍历所有打卡记录，按年月分组计数
  const monthlyMap = new Map<string, number>();
  for (const checkin of checkins) {
    const yearMonth = format(checkin.date, "yyyy-MM");
    monthlyMap.set(yearMonth, (monthlyMap.get(yearMonth) || 0) + 1);
  }

  // 转换为图表组件需要的数组格式 [{ month: "2025-04", count: 8 }, ...]
  const monthlyData = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // 可选：获取最近7天的打卡情况（用于周趋势）
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  }).map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    checked: dates.includes(format(date, "yyyy-MM-dd")),
  }));

  // 7. 返回统计结果
  return NextResponse.json({
    streak,           // 连续打卡天数
    total: dates.length, // 总打卡次数
    dates,            // 所有打卡日期数组
    monthlyData,      // 按月统计数据
    last7Days,        // 最近7天详情
  });
}