export interface KeyPoint {
  id: string;
  text: string;
  keywords: string[]; // For checking the transcript
  checked: boolean;
}

export interface Checkpoint {
  bookTitle: string;
  chapterId: number;
  summary: string;
  keyPoints: KeyPoint[];
}
