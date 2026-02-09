'use client';

import { useState } from 'react';

export interface CalendarDay {
  date: string;
  count: number;
}

interface HeatmapCalendarProps {
  data: CalendarDay[];
}

export function HeatmapCalendar({ data }: HeatmapCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const totalDaysPracticed = data.filter(d => d.count > 0).length;

  // Get color based on chapters completed
  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (count === 1) return 'bg-emerald-200 dark:bg-emerald-900';
    if (count === 2) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count === 3) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  // Group data into weeks (7 days each)
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  // Get month labels
  const getMonthLabels = () => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';

    data.forEach((day, index) => {
      const date = new Date(day.date);
      const month = date.toLocaleString('default', { month: 'short' });
      const weekIndex = Math.floor(index / 7);

      if (month !== lastMonth) {
        labels.push({ month, weekIndex });
        lastMonth = month;
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();

  const handleMouseEnter = (day: CalendarDay, event: React.MouseEvent) => {
    setHoveredDay(day);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="relative bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalDaysPracticed}</span>
          <span className="text-slate-500 dark:text-slate-400 ml-2">days studied</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
            <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px] ml-8 mb-1 text-[9px] text-slate-400 dark:text-slate-500" style={{ minWidth: 'max-content' }}>
          {weeks.map((week, weekIndex) => {
            const label = monthLabels.find(l => l.weekIndex === weekIndex);
            return (
              <div key={weekIndex} className="w-[12px] text-center">
                {label ? label.month : ''}
              </div>
            );
          })}
        </div>

        <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
          <div className="flex flex-col gap-[3px] text-[9px] text-slate-400 dark:text-slate-500 mr-2">
            <div className="h-[12px]"></div>
            <div className="h-[12px] flex items-center">Mon</div>
            <div className="h-[12px]"></div>
            <div className="h-[12px] flex items-center">Wed</div>
            <div className="h-[12px]"></div>
            <div className="h-[12px] flex items-center">Fri</div>
            <div className="h-[12px]"></div>
          </div>

          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-[12px] h-[12px] rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-500 ${getColor(day.count)}`}
                  onMouseEnter={(e) => handleMouseEnter(day, e)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full border border-slate-700"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          <div className="font-medium">{formatDate(hoveredDay.date)}</div>
          <div className={hoveredDay.count > 0 ? "text-emerald-400" : "text-slate-400 dark:text-slate-500"}>
            {hoveredDay.count} {hoveredDay.count === 1 ? 'checkpoint' : 'checkpoints'} completed
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-slate-800" />
        </div>
      )}
    </div>
  );
}
