// src/app/dashboard/page.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import GroupFilter from '@/components/GroupFilter';
import type { Habit, Group } from '@/types';

// 鼓励语库
const encouragements = [
  '每一步都是进步 💪',
  '坚持就是胜利 ✨',
  '今天的你比昨天更棒 🌟',
  '好习惯是人生最好的投资 💎',
  '不积跬步，无以至千里 🏔️',
  '你正在变成更好的自己 🦋',
  '打卡不易，坚持更难，你做到了 🔥',
  '每一天都在为未来铺路 🛤️',
  '相信积累的力量 📈',
  '今天的努力，明天的骄傲 🏆',
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // 使用本地日期，避免 toISOString() 返回 UTC 日期导致的时区偏移问题
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 鼓励语
  const [encouragement, setEncouragement] = useState('');
  // 修改习惯弹窗
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  // 新建分组
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#6B7280');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  // 删除确认
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  // 分组筛选
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // 打卡备注
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('获取习惯失败');
      const data = await res.json();
      setHabits(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (!res.ok) throw new Error('获取分组失败');
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      fetchHabits();
      fetchGroups();
      // 随机选一句鼓励语
      setEncouragement(encouragements[Math.floor(Math.random() * encouragements.length)]);
    }
  }, [status, router, fetchHabits, fetchGroups]);

  // 创建新习惯
  const createHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    let groupId: string | undefined = undefined;

    // 如果正在新建分组，先创建分组
    if (showNewGroupInput && newGroupName.trim()) {
      const groupRes = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim(), color: newGroupColor }),
      });
      if (groupRes.ok) {
        const newGroup = await groupRes.json();
        groupId = newGroup.id;
        await fetchGroups();
      }
      setShowNewGroupInput(false);
      setNewGroupName('');
    } else if (editGroupId) {
      groupId = editGroupId;
    }

    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newHabitName,
        description: '',
        ...(groupId !== undefined && { groupId }),
      }),
    });
    if (res.ok) {
      setNewHabitName('');
      setEditGroupId(null);
      fetchHabits();
    }
  };

  // 打卡
  const doCheckin = async (habitId: string) => {
    setActionLoading(habitId);
    const note = noteInputs[habitId]?.trim() || undefined;
    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId, date: todayStr, ...(note ? { note } : {}) }),
    });
    if (res.ok) {
      const newNoteInputs = { ...noteInputs };
      delete newNoteInputs[habitId];
      setNoteInputs(newNoteInputs);
      await fetchHabits();
    } else {
      const data = await res.json();
      alert(data.error || '打卡失败');
    }
    setActionLoading(null);
  };

  // 取消打卡
  const doCancelCheckin = async (habitId: string) => {
    setActionLoading(habitId);
    const res = await fetch('/api/checkins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId, date: todayStr }),
    });
    if (res.ok) {
      await fetchHabits();
    }
    setActionLoading(null);
  };

  // 删除习惯
  const deleteHabit = async (habitId: string) => {
    const res = await fetch(`/api/habits/${habitId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setDeletingHabitId(null);
      fetchHabits();
    }
  };

  // 打开修改弹窗
  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setEditName(habit.name);
    setEditDescription(habit.description || '');
    setEditColor(habit.color);
    setEditGroupId(habit.groupId || null);
  };

  // 提交修改
  const updateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit) return;
    const res = await fetch(`/api/habits/${editingHabit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDescription, color: editColor, groupId: editGroupId }),
    });
    if (res.ok) {
      setEditingHabit(null);
      fetchHabits();
    }
  };

  // 删除分组
  const deleteGroup = async (groupId: string) => {
    if (!confirm('确定要删除此分组吗？关联的习惯将变为"未分类"。')) return;
    const res = await fetch(`/api/groups/${groupId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchGroups();
      fetchHabits();
      if (selectedGroupId === groupId) setSelectedGroupId(null);
    }
  };

  // 判断今天是否已打卡
  const isCheckedToday = (habit: Habit) => {
    return habit.checkins.some(c => c.date === todayStr);
  };

  // 获取今天打卡的备注
  const getTodayNote = (habit: Habit) => {
    const checkin = habit.checkins.find(c => c.date === todayStr);
    return checkin?.note || null;
  };

  // 计算连续打卡天数
  const calculateStreak = (habit: Habit) => {
    const dates = habit.checkins.map(c => c.date);
    dates.sort();
    let streak = 0;
    const now = new Date();
    const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (true) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (dates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // 分组筛选
  const filteredHabits = habits.filter((habit) => {
    if (selectedGroupId === null) return true;
    if (selectedGroupId === '__ungrouped__') return !habit.groupId;
    return habit.groupId === selectedGroupId;
  });

  // 按分组归类
  const groupedHabits: Record<string, { group: Group | null; habits: Habit[] }> = {};
  for (const h of filteredHabits) {
    const key = h.groupId || '__ungrouped__';
    if (!groupedHabits[key]) {
      const group = h.groupId ? groups.find(g => g.id === h.groupId) || null : null;
      groupedHabits[key] = { group, habits: [] };
    }
    groupedHabits[key].habits.push(h);
  }

  const todayDone = habits.filter(h => isCheckedToday(h)).length;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <div className="text-gray-500 dark:text-gray-400 text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm dark:shadow-gray-900/30 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span className="text-2xl">✅</span> 习惯打卡
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/stats"
              className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
            >
              📊 统计
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* 鼓励语 */}
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">{encouragement}</p>
        </div>

        {/* 今日进度 */}
        {habits.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-6 mb-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">今日完成</span>
              <span className="text-sm font-bold text-blue-500 dark:text-blue-400">{todayDone}/{habits.length}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-400 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: habits.length ? `${(todayDone / habits.length) * 100}%` : '0%' }}
              />
            </div>
            {todayDone === habits.length && habits.length > 0 && (
              <div className="mt-4 text-center">
                <span className="inline-block bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                  🎉 太棒了！今日所有习惯已完成！
                </span>
              </div>
            )}
          </div>
        )}

        {/* 分组筛选 */}
        {groups.length > 0 && (
          <div className="mb-4">
            <GroupFilter groups={groups} selectedGroupId={selectedGroupId} onSelect={setSelectedGroupId} />
          </div>
        )}

        {/* 添加新习惯 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span>🌟</span> 添加新习惯
          </h2>
          <form onSubmit={createHabit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例如：每天跑步、读书30分钟..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-xl transition whitespace-nowrap shadow-sm hover:shadow-md"
              >
                + 添加
              </button>
            </div>
            {/* 分组选择 */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={editGroupId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__new__') {
                    setShowNewGroupInput(true);
                    setEditGroupId(null);
                  } else {
                    setEditGroupId(val || null);
                    setShowNewGroupInput(false);
                  }
                }}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">未分类</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
                <option value="__new__">+ 新建分组</option>
              </select>
              {showNewGroupInput && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="分组名称"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 w-28"
                    maxLength={20}
                  />
                  <input
                    type="color"
                    value={newGroupColor}
                    onChange={(e) => setNewGroupColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0"
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* 习惯列表 */}
        {filteredHabits.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              {habits.length === 0 ? '还没有任何习惯' : '该分组下没有习惯'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {habits.length === 0 ? '添加你的第一个习惯，开始打卡之旅吧！' : '切换分组查看其他习惯'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedHabits).map(([key, { group, habits: groupHabits }]) => (
              <div key={key}>
                {group && (
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{group.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({groupHabits.length})</span>
                    </div>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition px-2 py-1"
                      title="删除分组"
                    >
                      🗑️
                    </button>
                  </div>
                )}
                {key === '__ungrouped__' && groupHabits.length > 0 && (
                  <div className="flex items-center mb-2 px-1">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">未分类</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({groupHabits.length})</span>
                  </div>
                )}
                <div className="space-y-3">
                  {groupHabits.map((habit) => {
                    const checkedToday = isCheckedToday(habit);
                    const streak = calculateStreak(habit);
                    const isLoading = actionLoading === habit.id;
                    const todayNote = getTodayNote(habit);

                    return (
                      <div
                        key={habit.id}
                        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/30 p-5 transition-all border ${
                          checkedToday ? 'border-green-200 dark:border-green-700 bg-green-50/30 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* 颜色标记 */}
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: habit.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{habit.name}</h3>
                              {habit.description && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{habit.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-xs text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                                  🔥 连续 {streak} 天
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                  共 {habit.checkins.length} 次
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* 打卡/取消按钮 */}
                            {checkedToday ? (
                              <>
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium mr-1">已打卡 ✓</span>
                                {todayNote && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[80px] truncate" title={todayNote}>
                                    "{todayNote}"
                                  </span>
                                )}
                                <button
                                  onClick={() => doCancelCheckin(habit.id)}
                                  disabled={isLoading}
                                  className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition border border-red-200 dark:border-red-800 hover:border-red-300"
                                  title="取消打卡"
                                >
                                  取消
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    placeholder="备注(选填)"
                                    value={noteInputs[habit.id] || ''}
                                    onChange={(e) => {
                                      if (e.target.value.length <= 100) {
                                        setNoteInputs(prev => ({ ...prev, [habit.id]: e.target.value }));
                                      }
                                    }}
                                    maxLength={100}
                                    className="w-20 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 mr-1"
                                  />
                                  <button
                                    onClick={() => doCheckin(habit.id)}
                                    disabled={isLoading}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
                                  >
                                    {isLoading ? '...' : '打卡'}
                                  </button>
                                </div>
                              </>
                            )}

                            {/* 修改按钮 */}
                            <button
                              onClick={() => openEdit(habit)}
                              className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1.5 rounded-lg transition"
                              title="修改习惯"
                            >
                              ✏️
                            </button>

                            {/* 删除按钮 */}
                            <button
                              onClick={() => setDeletingHabitId(habit.id)}
                              className="text-xs text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 px-2 py-1.5 rounded-lg transition"
                              title="删除习惯"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 修改习惯弹窗 */}
      {editingHabit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">修改习惯</h3>
            <form onSubmit={updateHabit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">习惯名称</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">描述（可选）</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="简短描述这个习惯..."
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">分组</label>
                <select
                  value={editGroupId || ''}
                  onChange={(e) => setEditGroupId(e.target.value || null)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">未分类</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">颜色</label>
                <div className="flex gap-2 flex-wrap">
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-8 h-8 rounded-full transition transform hover:scale-110 ${
                        editColor === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deletingHabitId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 p-6 w-full max-w-xs text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              删除后，该习惯及所有打卡记录将不可恢复。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingHabitId(null)}
                className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                取消
              </button>
              <button
                onClick={() => deleteHabit(deletingHabitId)}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
