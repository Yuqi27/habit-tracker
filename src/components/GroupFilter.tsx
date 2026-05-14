'use client';

import type { Group } from '@/types';

interface GroupFilterProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
}

export default function GroupFilter({ groups, selectedGroupId, onSelect }: GroupFilterProps) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-2 pb-2 min-w-max">
        <button
          onClick={() => onSelect(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            selectedGroupId === null
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => onSelect('__ungrouped__')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            selectedGroupId === '__ungrouped__'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          未分类
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelect(group.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedGroupId === group.id
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            style={
              selectedGroupId === group.id
                ? { backgroundColor: group.color }
                : undefined
            }
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: group.color }}
            />
            {group.name}
          </button>
        ))}
      </div>
    </div>
  );
}
