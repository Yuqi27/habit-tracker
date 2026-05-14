// src/app/stats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import ThemeToggle from '@/components/ThemeToggle';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import type { Habit, StatsResponse } from '@/types';

export default function StatsPage() {
  const { data: session, status } = useSession({ required: true });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) return;
    fetch('/api/habits')
      .then((res) => res.json())
      .then((data) => {
        setHabits(data);
        if (data.length > 0) setSelectedHabitId(data[0].id);
      });
  }, [session]);

  useEffect(() => {
    if (!selectedHabitId) return;
    setStatsLoading(true);
    fetch(`/api/stats?habitId=${selectedHabitId}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .finally(() => setStatsLoading(false));
  }, [selectedHabitId]);

  const handleExportCSV = () => {
    if (!selectedHabitId) return;
    window.open(`/api/export?habitId=${selectedHabitId}`, '_blank');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-');
    return `${m}月`;
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  };

  // 完成率进度环尺寸
  const ringSize = 100;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const completionRate = stats ? Math.round((stats.completionRate || 0) * 100) : 0;
  const offset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm dark:shadow-gray-900/30 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition font-medium text-sm"
            >
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span className="text-2xl">📊</span> 打卡统计
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* 选择习惯 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 mb-6 border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2">
            <span>🎯</span> 选择习惯
          </label>
          {habits.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm">暂无习惯数据，请先在仪表盘添加习惯</p>
          ) : (
            <div className="flex gap-2">
              <select
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 dark:bg-gray-700"
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
              >
                {habits.map((habit: any) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
              </select>
              {selectedHabitId && (
                <button
                  onClick={handleExportCSV}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-3 rounded-xl transition shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  📥 导出 CSV
                </button>
              )}
            </div>
          )}
        </div>

        {selectedHabitId && stats && (
          <>
            {/* 概要卡片 - 3列 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-3xl font-bold text-orange-500">{stats.streak}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">当前连续天数</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-3xl font-bold text-yellow-500">{stats.bestStreak}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">最佳连续天数</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 border border-gray-100 dark:border-gray-700 text-center flex flex-col items-center justify-center">
                {/* 进度环 */}
                <svg width={ringSize} height={ringSize} className="mb-2">
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-100 dark:text-gray-700"
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-blue-500 dark:text-blue-400"
                    transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                  <text
                    x={ringSize / 2}
                    y={ringSize / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-gray-800 dark:fill-gray-100 text-lg font-bold"
                    fontSize="20"
                  >
                    {completionRate}%
                  </text>
                </svg>
                <div className="text-sm text-gray-500 dark:text-gray-400">完成率</div>
              </div>
            </div>

            {/* 最近7天 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 mb-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span>📅</span> 最近7天
              </h2>
              <div className="flex justify-between gap-1">
                {(stats.last7Days || []).map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-sm transition ${
                        day.checked
                          ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {day.checked ? '✓' : ''}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">周{formatDay(day.date)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 日历热力图 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 mb-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span>🗓️</span> 打卡热力图
              </h2>
              {statsLoading ? (
                <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  加载中...
                </div>
              ) : stats.heatmapData && stats.heatmapData.length > 0 ? (
                <HeatmapCalendar data={stats.heatmapData} habitColor={selectedHabit?.color} />
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">暂无打卡数据</p>
                </div>
              )}
            </div>

            {/* 月度趋势图表 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <span>📈</span> 月度打卡趋势
              </h2>
              {statsLoading ? (
                <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  加载中...
                </div>
              ) : !stats.monthlyData || stats.monthlyData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">暂无打卡数据</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.monthlyData.map(d => ({ ...d, month: formatMonth(d.month) }))} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(v: any) => [`${v} 次`, '打卡']}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {selectedHabitId && !stats && statsLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-lg">加载统计数据...</div>
          </div>
        )}
      </main>
    </div>
  );
}
