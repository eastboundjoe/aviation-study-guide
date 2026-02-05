import { addDays, addWeeks, addMonths, format, isBefore, startOfDay } from 'date-fns';

export const REVIEW_INTERVALS = [
  0,  // New
  1,  // 1 day
  3,  // 3 days
  7,  // 7 days (Weekly)
  30, // 30 days (Monthly)
];

export function calculateNextReview(currentLevel: number): Date {
  const daysToAdd = REVIEW_INTERVALS[Math.min(currentLevel + 1, REVIEW_INTERVALS.length - 1)];
  return addDays(new Date(), daysToAdd);
}

export function getStatusLabel(level: number) {
  const labels = ['New', '1-Day Review', '3-Day Review', 'Weekly Review', 'Monthly Review', 'Mastered'];
  return labels[level] || 'Unknown';
}

export function isDue(dateString: string | undefined): boolean {
  if (!dateString) return true;
  const reviewDate = startOfDay(new Date(dateString));
  const today = startOfDay(new Date());
  return isBefore(reviewDate, today) || format(reviewDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}
