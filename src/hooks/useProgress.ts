'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UserProgress, StudySession } from '@/types';
import {
  getProgressFromCloud,
  getStudyHistoryFromCloud,
  saveProgressToCloud,
  saveStudySessionToCloud,
  migrateLocalProgressToCloud,
} from '@/lib/cloud-storage';

const EMPTY_PROGRESS: UserProgress = {
  completedChapters: {},
  reviewDates: {},
  reviewLevels: {},
  quizScores: {},
  studyHistory: [],
};

const LOCAL_KEY = 'aviation-study-progress';

export function useProgress(userId?: string | null) {
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS);
  const [syncing, setSyncing] = useState(false);
  const hasMigrated = useRef(false);

  // Load progress on mount or when userId changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (userId) {
        // Logged in — try migration first, then load from cloud
        setSyncing(true);
        try {
          if (!hasMigrated.current) {
            await migrateLocalProgressToCloud(userId);
            hasMigrated.current = true;
          }

          const [cloudProgress, cloudHistory] = await Promise.all([
            getProgressFromCloud(userId),
            getStudyHistoryFromCloud(userId),
          ]);

          if (!cancelled) {
            setProgress({
              ...(cloudProgress ?? EMPTY_PROGRESS),
              studyHistory: cloudHistory,
            });
          }
        } catch (err) {
          console.error('Failed to load cloud progress:', err);
          // Fall back to localStorage on error
          if (!cancelled) loadLocal();
        } finally {
          if (!cancelled) setSyncing(false);
        }
      } else {
        // Guest — use localStorage
        loadLocal();
      }
    }

    function loadLocal() {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!parsed.studyHistory) parsed.studyHistory = [];
          setProgress(parsed);
        } catch (e) {
          console.error('Failed to load progress', e);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const saveLocal = useCallback((p: UserProgress) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  }, []);

  const completeCheckpoint = useCallback(
    (bookTitle: string, chapterId: number, success: boolean) => {
      const key = `${bookTitle}-${chapterId}`;

      setProgress((prev) => {
        const currentLevel = prev.reviewLevels[key] || 0;
        const newLevel = success
          ? Math.min(currentLevel + 1, 5)
          : Math.max(currentLevel - 1, 0);

        const intervals = [0, 1, 3, 7, 30, 90];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + intervals[newLevel]);

        const session: StudySession = {
          date: new Date().toISOString(),
          bookTitle,
          chapterId,
          success,
        };

        const newProgress: UserProgress = {
          ...prev,
          completedChapters: { ...prev.completedChapters, [key]: true },
          reviewLevels: { ...prev.reviewLevels, [key]: newLevel },
          reviewDates: { ...prev.reviewDates, [key]: nextDate.toISOString() },
          studyHistory: [...(prev.studyHistory || []), session],
        };

        if (userId) {
          // Save to cloud (fire-and-forget, errors logged)
          saveProgressToCloud(userId, newProgress).catch((err) =>
            console.error('Failed to save progress to cloud:', err)
          );
          saveStudySessionToCloud(userId, session).catch((err) =>
            console.error('Failed to save study session to cloud:', err)
          );
        } else {
          saveLocal(newProgress);
        }

        return newProgress;
      });
    },
    [userId, saveLocal]
  );

  return { progress, completeCheckpoint, syncing };
}
