import { StudySession } from '@/types';
import { CalendarDay } from '@/components/HeatmapCalendar';

export function getHeatmapData(history: StudySession[] = [], daysBack: number = 365): CalendarDay[] {
  const dailyHistory: Record<string, number> = {};

  history.forEach(session => {
    const dateKey = new Date(session.date).toISOString().split('T')[0];
    dailyHistory[dateKey] = (dailyHistory[dateKey] || 0) + 1;
  });

  const calendar: CalendarDay[] = [];
  const today = new Date();

  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    calendar.push({
      date: dateKey,
      count: dailyHistory[dateKey] || 0,
    });
  }

  return calendar.reverse();
}
