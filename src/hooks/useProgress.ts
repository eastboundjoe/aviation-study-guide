'use client';

import { useState, useEffect } from 'react';
import { UserProgress } from '@/types';

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>({
    completedChapters: {},
    reviewDates: {},
    reviewLevels: {},
    quizScores: {},
  });

  useEffect(() => {
    const saved = localStorage.getItem('aviation-study-progress');
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load progress', e);
      }
    }
  }, []);

  const saveProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem('aviation-study-progress', JSON.stringify(newProgress));
  };

  const markChapterComplete = (bookTitle: string, chapterId: number) => {
    const key = `${bookTitle}-${chapterId}`;
    const newProgress = {
      ...progress,
      completedChapters: { ...progress.completedChapters, [key]: true },
      reviewLevels: { ...progress.reviewLevels, [key]: progress.reviewLevels[key] || 0 },
      reviewDates: { ...progress.reviewDates, [key]: new Date().toISOString() }
    };
    saveProgress(newProgress);
  };

  const updateReviewLevel = (bookTitle: string, chapterId: number, success: boolean) => {
    const key = `${bookTitle}-${chapterId}`;
    const currentLevel = progress.reviewLevels[key] || 0;
    const newLevel = success ? Math.min(currentLevel + 1, 5) : Math.max(currentLevel - 1, 0);
    
    // Calculate next review date based on level
    const intervals = [0, 1, 3, 7, 30, 90]; // days
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervals[newLevel]);

    const newProgress = {
      ...progress,
      reviewLevels: { ...progress.reviewLevels, [key]: newLevel },
      reviewDates: { ...progress.reviewDates, [key]: nextDate.toISOString() }
    };
    saveProgress(newProgress);
  };

  return { progress, markChapterComplete, updateReviewLevel };
}
