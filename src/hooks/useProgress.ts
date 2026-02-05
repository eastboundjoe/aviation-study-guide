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
    localStorage.setItem('aviation-study-progress', JSON.stringify(newProgress));
  };

  const completeCheckpoint = (bookTitle: string, chapterId: number, success: boolean) => {
    const key = `${bookTitle}-${chapterId}`;
    
    setProgress(prev => {
      const currentLevel = prev.reviewLevels[key] || 0;
      const newLevel = success ? Math.min(currentLevel + 1, 5) : Math.max(currentLevel - 1, 0);
      
      // Calculate next review date based on level
      const intervals = [0, 1, 3, 7, 30, 90]; // days
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervals[newLevel]);

      const newProgress = {
        ...prev,
        completedChapters: { ...prev.completedChapters, [key]: true },
        reviewLevels: { ...prev.reviewLevels, [key]: newLevel },
        reviewDates: { ...prev.reviewDates, [key]: nextDate.toISOString() }
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  };

  return { progress, completeCheckpoint };
}
