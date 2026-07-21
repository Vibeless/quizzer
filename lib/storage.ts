import { QuizGroup, Question, Attempt, GroupStats } from './types';
import { parseRawQuestions, SAMPLE_QUESTION_TEXT } from './parser';

const STORAGE_KEYS = {
  GROUPS: 'quizzer_groups',
  QUESTIONS: 'quizzer_questions',
  ATTEMPTS: 'quizzer_attempts',
};

// Helper for safe SSR window check
const isClient = () => typeof window !== 'undefined';

// Initial seed data generator
function seedDefaultData() {
  if (!isClient()) return;

  const existingGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);
  if (!existingGroups || JSON.parse(existingGroups).length === 0) {
    const netGroupId = 'group_networking_demo';
    const bioGroupId = 'group_biology_demo';
    const javaGroupId = 'group_java_demo';
    const awsGroupId = 'group_aws_demo';

    const defaultGroups: QuizGroup[] = [
      { id: netGroupId, name: 'Networking', questionCount: 4, createdAt: new Date().toISOString() },
      { id: bioGroupId, name: 'Biology', questionCount: 0, createdAt: new Date().toISOString() },
      { id: javaGroupId, name: 'Java', questionCount: 0, createdAt: new Date().toISOString() },
      { id: awsGroupId, name: 'AWS', questionCount: 0, createdAt: new Date().toISOString() },
    ];

    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(defaultGroups));

    // Seed questions for Networking
    const parsed = parseRawQuestions(SAMPLE_QUESTION_TEXT, netGroupId);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(parsed.questions));

    // Seed empty attempts
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
  }
}

// GROUPS CRUD
export function getGroups(): QuizGroup[] {
  if (!isClient()) return [];
  seedDefaultData();
  const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
  return raw ? JSON.parse(raw) : [];
}

export function getGroup(groupId: string): QuizGroup | null {
  const groups = getGroups();
  return groups.find((g) => g.id === groupId) || null;
}

export function createGroup(name: string): QuizGroup {
  const groups = getGroups();
  const newGroup: QuizGroup = {
    id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    questionCount: 0,
    createdAt: new Date().toISOString(),
  };

  groups.unshift(newGroup);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  return newGroup;
}

export function renameGroup(groupId: string, newName: string): QuizGroup | null {
  const groups = getGroups();
  const index = groups.findIndex((g) => g.id === groupId);
  if (index === -1) return null;

  groups[index].name = newName.trim();
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  return groups[index];
}

export function deleteGroup(groupId: string): void {
  let groups = getGroups();
  groups = groups.filter((g) => g.id !== groupId);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));

  // Remove questions belonging to this group
  let questions = getAllQuestions();
  questions = questions.filter((q) => q.groupId !== groupId);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));

  // Remove attempts belonging to this group
  let attempts = getAllAttempts();
  attempts = attempts.filter((a) => a.groupId !== groupId);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
}

// QUESTIONS CRUD
function getAllQuestions(): Question[] {
  if (!isClient()) return [];
  const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  return raw ? JSON.parse(raw) : [];
}

export function getQuestions(groupId: string): Question[] {
  const all = getAllQuestions();
  return all.filter((q) => q.groupId === groupId);
}

export function saveQuestions(groupId: string, newQuestions: Question[]): void {
  if (!isClient()) return;
  const all = getAllQuestions();

  // Assign groupId if not set
  const formatted = newQuestions.map((q) => ({
    ...q,
    groupId,
  }));

  const updatedAll = [...all, ...formatted];
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updatedAll));

  // Update group question count
  const groups = getGroups();
  const grp = groups.find((g) => g.id === groupId);
  if (grp) {
    grp.questionCount = updatedAll.filter((q) => q.groupId === groupId).length;
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }
}

export function updateQuestion(updatedQuestion: Question): void {
  if (!isClient()) return;
  const all = getAllQuestions();
  const index = all.findIndex((q) => q.id === updatedQuestion.id);
  if (index !== -1) {
    all[index] = updatedQuestion;
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(all));
  }
}

export function deleteQuestion(questionId: string): void {
  if (!isClient()) return;
  let all = getAllQuestions();
  const target = all.find((q) => q.id === questionId);
  if (!target) return;

  all = all.filter((q) => q.id !== questionId);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(all));

  // Update group question count
  const groups = getGroups();
  const grp = groups.find((g) => g.id === target.groupId);
  if (grp) {
    grp.questionCount = all.filter((q) => q.groupId === target.groupId).length;
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }
}

// ATTEMPTS & ANALYTICS
function getAllAttempts(): Attempt[] {
  if (!isClient()) return [];
  const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  return raw ? JSON.parse(raw) : [];
}

export function getAttempts(groupId: string): Attempt[] {
  const all = getAllAttempts();
  return all
    .filter((a) => a.groupId === groupId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function saveAttempt(attempt: Omit<Attempt, 'id' | 'timestamp'>): Attempt {
  if (!isClient()) throw new Error('Client side only');
  const all = getAllAttempts();

  const fullAttempt: Attempt = {
    ...attempt,
    id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  all.unshift(fullAttempt);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(all));
  return fullAttempt;
}

export function getGroupStats(groupId: string): GroupStats {
  const attempts = getAttempts(groupId);
  const questions = getQuestions(groupId);

  if (attempts.length === 0) {
    return {
      bestScore: null,
      avgScore: null,
      totalAttempts: 0,
      lastAttempt: null,
      avgTimeSeconds: 0,
      frequentlyMissed: [],
    };
  }

  // Best score
  let best = attempts[0];
  let totalScoreSum = 0;
  let totalCountSum = 0;
  let totalTimeSum = 0;

  const missMap: Record<string, { missCount: number; totalTimesSeen: number }> = {};

  attempts.forEach((att) => {
    if (att.percentage > best.percentage) {
      best = att;
    }
    totalScoreSum += att.score;
    totalCountSum += att.total;
    totalTimeSum += att.timeTaken;

    // Track missed questions
    att.answers.forEach((ans) => {
      if (!missMap[ans.questionId]) {
        missMap[ans.questionId] = { missCount: 0, totalTimesSeen: 0 };
      }
      missMap[ans.questionId].totalTimesSeen += 1;
      if (!ans.isCorrect) {
        missMap[ans.questionId].missCount += 1;
      }
    });
  });

  const avgPercentage = totalCountSum > 0 ? (totalScoreSum / totalCountSum) * 100 : 0;
  const avgTimeSeconds = Math.round(totalTimeSum / attempts.length);

  // Frequently missed questions list
  const frequentlyMissed = questions
    .map((q) => {
      const stats = missMap[q.id] || { missCount: 0, totalTimesSeen: 0 };
      const missPercentage =
        stats.totalTimesSeen > 0 ? (stats.missCount / stats.totalTimesSeen) * 100 : 0;
      return {
        question: q,
        missCount: stats.missCount,
        totalTimesSeen: stats.totalTimesSeen,
        missPercentage: Math.round(missPercentage),
      };
    })
    .filter((item) => item.missCount > 0)
    .sort((a, b) => b.missCount - a.missCount || b.missPercentage - a.missPercentage);

  return {
    bestScore: {
      score: best.score,
      total: best.total,
      percentage: Math.round(best.percentage * 10) / 10,
    },
    avgScore: {
      score: Math.round(totalScoreSum / attempts.length),
      total: Math.round(totalCountSum / attempts.length),
      percentage: Math.round(avgPercentage * 10) / 10,
    },
    totalAttempts: attempts.length,
    lastAttempt: attempts[0],
    avgTimeSeconds,
    frequentlyMissed,
  };
}
