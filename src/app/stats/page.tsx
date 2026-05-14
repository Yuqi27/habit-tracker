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

interface MonthlyData {
  month: string;
  count: number;
}

interface Last7Day {
  date: string;
  checked: boolean;
}

export default function StatsPage() {
  const { data: session, status } = useSession({ required: true });
  const [habits, setHabits] = useState<any[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [last7Days, setLast7Days] = useState<Last7Day[]>([]);
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
        setMonthlyData(data.monthlyData || []);
        setStreak(data.streak || 0);
        setTotal(data.total || 0);
        setLast7Days(data.last7Days || []);
      })
      .finally(() => setStatsLoading(false));
  }, [selectedHabitId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-gray-500 text-lg">加载中...</div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-blue-500 transition font-medium text-sm"
            >
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📊</span> 打卡统计
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* 选择习惯 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
          <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
            <span>🎯</span> 选择习惯
          </label>
          {habits.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无习惯数据，请先在仪表盘添加习惯</p>
          ) : (
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
            >
              {habits.map((habit: any) => (
                <option key={habit.id} value={habit.id}>
                  {habit.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedHabitId && (
          <>
            {/* 概要卡片 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-3xl font-bold text-orange-500">{streak}</div>
                <div className="text-sm text-gray-500 mt-1">当前连续天数</div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-3xl font-bold text-blue-500">{total}</div>
                <div className="text-sm text-gray-500 mt-1">累计打卡次数</div>
              </div>
            </div>

            {/* 最近7天 */}
            <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>📅</span> 最近7天
              </h2>
              <div className="flex justify-between gap-1">
                {last7Days.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-sm transition ${
                        day.checked
                          ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day.checked ? '✓' : ''}
                    </div>
                    <span className="text-xs text-gray-400">周{formatDay(day.date)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 月度趋势图表 */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span>📈</span> 月度打卡趋势
              </h2>
              {statsLoading ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  加载中...
                </div>
              ) : monthlyData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">暂无打卡数据</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData.map(d => ({ ...d, month: formatMonth(d.month) }))} barSize={28}>
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
      </main>
    </div>
  );
}
