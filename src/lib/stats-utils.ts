/**
 * 计算历史最佳连续打卡天数
 */
export function calculateBestStreak(dates: string[]): number {
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
 * 计算完成率
 */
export function calculateCompletionRate(checkedDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.round((checkedDays / totalDays) * 10000) / 100;
}

/**
 * 生成热力图数据（最近 N 天逐天标记是否打卡）
 */
export function generateHeatmapData(
  dates: string[],
  days: number = 365
): { date: string; checked: boolean }[] {
  const now = new Date();
  const data: { date: string; checked: boolean }[] = [];
  const dateSet = new Set(dates);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    data.push({
      date: dateStr,
      checked: dateSet.has(dateStr),
    });
  }

  return data;
}
