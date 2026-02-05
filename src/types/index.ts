export interface Chapter {
  id: number;
  title: string;
  completed: boolean;
  lastStudied?: string; // ISO date
  nextReview?: string; // ISO date
  reviewLevel: number; // 0: new, 1: 1-day, 2: 3-day, 3: weekly, 4: monthly, 5: mastered
}

export interface Book {
  title: string;
  filename: string;
  chapters: Chapter[];
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  chapterId: number;
  bookTitle: string;
  questions: Question[];
}

export interface UserProgress {
  completedChapters: Record<string, boolean>; // key: "BookTitle-ChapterId"
  reviewDates: Record<string, string>; // key: "BookTitle-ChapterId", value: nextReview ISO
  reviewLevels: Record<string, number>;
  quizScores: Record<string, number>;
}
