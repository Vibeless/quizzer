export interface QuizGroup {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
}

export interface QuestionOption {
  letter: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface Question {
  id: string;
  groupId: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: {
    letter: string;
    text: string;
  };
  explanation?: string;
  isValid?: boolean;
  validationError?: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedLetter: string;
  isCorrect: boolean;
}

export interface Attempt {
  id: string;
  groupId: string;
  mode: 'study' | 'practice';
  score: number;
  total: number;
  percentage: number;
  timeTaken: number; // in seconds
  answers: AttemptAnswer[];
  timestamp: string;
}

export interface GroupStats {
  bestScore: { score: number; total: number; percentage: number } | null;
  avgScore: { score: number; total: number; percentage: number } | null;
  totalAttempts: number;
  lastAttempt: Attempt | null;
  avgTimeSeconds: number;
  frequentlyMissed: Array<{
    question: Question;
    missCount: number;
    totalTimesSeen: number;
    missPercentage: number;
  }>;
}
