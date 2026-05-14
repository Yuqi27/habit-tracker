export interface Checkin {
  id: string;
  date: string;       // "YYYY-MM-DD"
  habitId: string;
  note?: string | null;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  checkins: Checkin[];
  groupId?: string | null;
  group?: Group | null;
}

export interface StatsResponse {
  streak: number;
  total: number;
  dates: string[];
  monthlyData: { month: string; count: number }[];
  last7Days: { date: string; checked: boolean }[];
  bestStreak: number;
  completionRate: number;
  totalDaysSinceStart: number;
  heatmapData: { date: string; checked: boolean }[];
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDark: boolean;
}

export interface GroupFilterProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
}
