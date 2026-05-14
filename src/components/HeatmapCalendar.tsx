'use client';

import { useMemo } from 'react';

interface HeatmapCalendarProps {
  data: { date: string; checked: boolean }[];
  habitColor?: string;
}

// 色阶定义
const LEVEL_COLORS_LIGHT = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const LEVEL_COLORS_DARK = ['#2d333b', '#0e4429', '#006d32', '#26a641', '#39d353'];

// 获取色阶等级（0-4）
function getLevel(checked: boolean, _habitColor: string, index: number, totalChecked: number): number {
  if (!checked) return 0;
  if (totalChecked === 0) return 1;
  // 根据在已打卡数据中的位置分配颜色级别
  const ratio = index / totalChecked;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export default function HeatmapCalendar({ data }: HeatmapCalendarProps) {
  const weeks = useMemo(() => {
    if (data.length === 0) return [];

    // 按周分组
    const result: { date: string; checked: boolean; level: number }[][] = [];
    let currentWeek: { date: string; checked: boolean; level: number }[] = [];

    // 获取所有已打卡的索引用于分配颜色级别
    const checkedIndices: number[] = [];
    data.forEach((d, i) => {
      if (d.checked) checkedIndices.push(i);
    });
    const totalChecked = checkedIndices.length;
    let checkedCounter = 0;

    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      const dateObj = new Date(d.date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday

      // 如果是周日（一周开始），且当前周已有数据，开始新的一周
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }

      let level = 0;
      if (d.checked) {
        level = getLevel(true, '', checkedCounter, totalChecked);
        checkedCounter++;
      }

      currentWeek.push({ date: d.date, checked: d.checked, level });
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [data]);

  // 判断是否是暗色模式
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const colors = isDark ? LEVEL_COLORS_DARK : LEVEL_COLORS_LIGHT;

  // 月份标签
  const monthLabels = useMemo(() => {
    const months: { index: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIdx) => {
      if (week.length > 0) {
        const firstDay = new Date(week[0].date);
        const month = firstDay.getMonth();
        if (month !== lastMonth) {
          months.push({ index: weekIdx, label: `${month + 1}月` });
          lastMonth = month;
        }
      }
    });
    return months;
  }, [weeks]);

  const dayLabels = ['', '一', '', '三', '', '五', ''];

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        {/* 月份标签行 */}
        <div className="flex ml-8">
          {monthLabels.map((m) => (
            <div
              key={m.index}
              className="text-xs text-gray-400 dark:text-gray-500"
              style={{ marginLeft: m.index === 0 ? 0 : undefined }}
            >
              {/* 通过空白占位简单对齐 */}
              {m.index > 0 && <span style={{ display: 'inline-block', width: `${(m.index - (monthLabels[monthLabels.indexOf(m) - 1]?.index || 0)) * 14}px` }} />}
              <span>{m.label}</span>
            </div>
          ))}
        </div>

        <div className="flex">
          {/* 星期标签列 */}
          <div className="flex flex-col gap-[3px] mr-1 pt-0">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-[14px] text-[10px] leading-[14px] text-gray-400 dark:text-gray-500 text-right pr-1 w-6">
                {label}
              </div>
            ))}
          </div>

          {/* 热力图网格 */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const day = week.find((d) => {
                    const dateObj = new Date(d.date);
                    return dateObj.getDay() === dayIdx;
                  });
                  return (
                    <div
                      key={dayIdx}
                      className="w-[14px] h-[14px] rounded-sm"
                      style={{
                        backgroundColor: day ? colors[day.level] : 'transparent',
                      }}
                      title={day ? `${day.date}: ${day.checked ? '已打卡' : '未打卡'}` : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-1 ml-8 mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">少</span>
          {colors.map((color, i) => (
            <div
              key={i}
              className="w-[14px] h-[14px] rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">多</span>
        </div>
      </div>
    </div>
  );
}
