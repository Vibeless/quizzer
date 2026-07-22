import { QuizGroup, Question, Attempt, GroupStats } from './types';
import { parseRawQuestions, SAMPLE_QUESTION_TEXT } from './parser';
import { db, auth, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  GROUPS: 'quizzer_groups',
  QUESTIONS: 'quizzer_questions',
  ATTEMPTS: 'quizzer_attempts',
  SEEDED: 'quizzer_has_seeded',
};

// Helper for safe SSR window check
const isClient = () => typeof window !== 'undefined';

// Returns the current user's uid, or null if not authenticated
function getCurrentUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

// Safe JSON parser helper to prevent unhandled SyntaxError crashes
function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('Error parsing JSON from localStorage:', err);
    return fallback;
  }
}

// Initial seed data generator
function seedDefaultData() {
  if (!isClient()) return;

  const hasSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
  const existingGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);

  // Only seed if app has never been seeded AND no groups key exists
  if (!hasSeeded && existingGroups === null) {
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

    // Seed questions for Networking demo if not already populated
    const existingQuestions = safeParseJSON<Question[]>(localStorage.getItem(STORAGE_KEYS.QUESTIONS), []);
    if (existingQuestions.length === 0) {
      const parsed = parseRawQuestions(SAMPLE_QUESTION_TEXT, netGroupId);
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(parsed.questions));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
    }

    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  }
}

// FIRESTORE BACKGROUND ASYNC SYNC
async function syncGroupToFirestore(group: QuizGroup) {
  if (!db || !isFirebaseConfigured()) return;
  const uid = getCurrentUid();
  if (!uid) return;
  try {
    await setDoc(doc(db, 'groups', group.id), { ...group, userId: uid }, { merge: true });
  } catch (err) {
    console.warn('Firestore group sync error:', err);
  }
}

async function removeGroupFromFirestore(groupId: string) {
  if (!db || !isFirebaseConfigured()) return;
  if (!getCurrentUid()) return;
  try {
    await deleteDoc(doc(db, 'groups', groupId));
  } catch (err) {
    console.warn('Firestore group delete error:', err);
  }
}

async function syncQuestionsToFirestore(questions: Question[]) {
  if (!db || !isFirebaseConfigured() || questions.length === 0) return;
  const uid = getCurrentUid();
  if (!uid) return;
  try {
    const batch = writeBatch(db);
    for (const q of questions) {
      const ref = doc(db, 'questions', q.id);
      batch.set(ref, { ...q, userId: uid }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn('Firestore questions sync error:', err);
  }
}

async function removeQuestionsFromFirestore(questionIds: string[]) {
  if (!db || !isFirebaseConfigured() || questionIds.length === 0) return;
  if (!getCurrentUid()) return;
  try {
    const batch = writeBatch(db);
    for (const qId of questionIds) {
      batch.delete(doc(db, 'questions', qId));
    }
    await batch.commit();
  } catch (err) {
    console.warn('Firestore questions delete error:', err);
  }
}

async function syncAttemptToFirestore(attempt: Attempt) {
  if (!db || !isFirebaseConfigured()) return;
  const uid = getCurrentUid();
  if (!uid) return;
  try {
    await setDoc(doc(db, 'attempts', attempt.id), { ...attempt, userId: uid }, { merge: true });
  } catch (err) {
    console.warn('Firestore attempt sync error:', err);
  }
}

// GROUPS CRUD
export function getGroups(): QuizGroup[] {
  if (!isClient()) return [];
  seedDefaultData();
  const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
  return safeParseJSON<QuizGroup[]>(raw, []);
}

export function getGroup(groupId: string): QuizGroup | null {
  const groups = getGroups();
  return groups.find((g) => g.id === groupId) || null;
}

export function createGroup(name: string): QuizGroup {
  const groups = getGroups();
  const newGroup: QuizGroup = {
    id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name: name.trim(),
    questionCount: 0,
    createdAt: new Date().toISOString(),
  };

  groups.unshift(newGroup);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  syncGroupToFirestore(newGroup);
  return newGroup;
}

export function renameGroup(groupId: string, newName: string): QuizGroup | null {
  const groups = getGroups();
  const index = groups.findIndex((g) => g.id === groupId);
  if (index === -1) return null;

  groups[index].name = newName.trim();
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  syncGroupToFirestore(groups[index]);
  return groups[index];
}

export function deleteGroup(groupId: string): void {
  let groups = getGroups();
  groups = groups.filter((g) => g.id !== groupId);
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  removeGroupFromFirestore(groupId);

  // Remove questions belonging to this group
  let questions = getAllQuestions();
  const questionsToRemove = questions.filter((q) => q.groupId === groupId);
  questions = questions.filter((q) => q.groupId !== groupId);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  removeQuestionsFromFirestore(questionsToRemove.map((q) => q.id));

  // Remove attempts belonging to this group
  let attempts = getAllAttempts();
  attempts = attempts.filter((a) => a.groupId !== groupId);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
}

// QUESTIONS CRUD
function getAllQuestions(): Question[] {
  if (!isClient()) return [];
  const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  return safeParseJSON<Question[]>(raw, []);
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

  const existingIds = new Set(formatted.map((q) => q.id));
  const updatedAll = [...all.filter((q) => !existingIds.has(q.id)), ...formatted];
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updatedAll));
  syncQuestionsToFirestore(formatted);

  // Update group question count
  const groups = getGroups();
  const grp = groups.find((g) => g.id === groupId);
  if (grp) {
    grp.questionCount = updatedAll.filter((q) => q.groupId === groupId).length;
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    syncGroupToFirestore(grp);
  }
}

export function updateQuestion(updatedQuestion: Question): void {
  if (!isClient()) return;
  const all = getAllQuestions();
  const index = all.findIndex((q) => q.id === updatedQuestion.id);
  if (index !== -1) {
    all[index] = updatedQuestion;
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(all));
    syncQuestionsToFirestore([updatedQuestion]);
  }
}

export function deleteQuestion(questionId: string): void {
  if (!isClient()) return;
  let all = getAllQuestions();
  const target = all.find((q) => q.id === questionId);
  if (!target) return;

  all = all.filter((q) => q.id !== questionId);
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(all));
  removeQuestionsFromFirestore([questionId]);

  // Update group question count
  const groups = getGroups();
  const grp = groups.find((g) => g.id === target.groupId);
  if (grp) {
    grp.questionCount = all.filter((q) => q.groupId === target.groupId).length;
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    syncGroupToFirestore(grp);
  }
}

// ATTEMPTS & ANALYTICS
function getAllAttempts(): Attempt[] {
  if (!isClient()) return [];
  const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
  return safeParseJSON<Attempt[]>(raw, []);
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
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  all.unshift(fullAttempt);
  localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(all));
  syncAttemptToFirestore(fullAttempt);
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
    if (att.percentage > (best?.percentage ?? 0)) {
      best = att;
    }
    totalScoreSum += att.score;
    totalCountSum += att.total;
    totalTimeSum += att.timeTaken;

    // Track missed questions
    if (Array.isArray(att.answers)) {
      att.answers.forEach((ans) => {
        if (!missMap[ans.questionId]) {
          missMap[ans.questionId] = { missCount: 0, totalTimesSeen: 0 };
        }
        missMap[ans.questionId].totalTimesSeen += 1;
        if (!ans.isCorrect) {
          missMap[ans.questionId].missCount += 1;
        }
      });
    }
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
    bestScore: best
      ? {
          score: best.score,
          total: best.total,
          percentage: Math.round(best.percentage * 10) / 10,
        }
      : null,
    avgScore: {
      score: Math.round(totalScoreSum / attempts.length),
      total: Math.round(totalCountSum / attempts.length),
      percentage: Math.round(avgPercentage * 10) / 10,
    },
    totalAttempts: attempts.length,
    lastAttempt: attempts[0] || null,
    avgTimeSeconds,
    frequentlyMissed,
  };
}

// TWO-WAY CLOUD FIRESTORE & LOCALSTORAGE HYDRATION
export async function pullCloudDataToLocal() {
  if (!db || !isFirebaseConfigured()) return;
  const uid = getCurrentUid();
  if (!uid) return;
  try {
    // 1. GROUPS HYDRATION (TWO-WAY MERGE)
    const groupsSnap = await getDocs(
      query(collection(db, 'groups'), where('userId', '==', uid))
    );
    const remoteGroups: QuizGroup[] = [];
    groupsSnap.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data() as QuizGroup;
      remoteGroups.push(data);
    });

    const localGroups = getGroups();
    const groupMap = new Map<string, QuizGroup>();

    // Add local groups first
    localGroups.forEach((g) => groupMap.set(g.id, g));
    // Remote groups update/merge into local map
    remoteGroups.forEach((g) => groupMap.set(g.id, g));

    const mergedGroups = Array.from(groupMap.values());
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(mergedGroups));

    // Upload any local-only groups up to Firestore
    const remoteGroupIds = new Set(remoteGroups.map((g) => g.id));
    const localOnlyGroups = localGroups.filter((g) => !remoteGroupIds.has(g.id));
    for (const g of localOnlyGroups) {
      syncGroupToFirestore(g);
    }

    // 2. QUESTIONS HYDRATION (TWO-WAY MERGE)
    const questionsSnap = await getDocs(
      query(collection(db, 'questions'), where('userId', '==', uid))
    );
    const remoteQuestions: Question[] = [];
    questionsSnap.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data() as Question;
      remoteQuestions.push(data);
    });

    const localQuestions = getAllQuestions();
    const questionMap = new Map<string, Question>();

    // Add local questions first
    localQuestions.forEach((q) => questionMap.set(q.id, q));
    // Remote questions update/merge into local map
    remoteQuestions.forEach((q) => questionMap.set(q.id, q));

    const mergedQuestions = Array.from(questionMap.values());
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(mergedQuestions));

    // Upload any local-only questions up to Firestore
    const remoteQuestionIds = new Set(remoteQuestions.map((q) => q.id));
    const localOnlyQuestions = localQuestions.filter((q) => !remoteQuestionIds.has(q.id));
    if (localOnlyQuestions.length > 0) {
      syncQuestionsToFirestore(localOnlyQuestions);
    }

    // 3. ATTEMPTS HYDRATION (TWO-WAY MERGE)
    const attemptsSnap = await getDocs(
      query(collection(db, 'attempts'), where('userId', '==', uid))
    );
    const remoteAttempts: Attempt[] = [];
    attemptsSnap.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data() as Attempt;
      remoteAttempts.push(data);
    });

    const localAttempts = getAllAttempts();
    const attemptMap = new Map<string, Attempt>();

    localAttempts.forEach((a) => attemptMap.set(a.id, a));
    remoteAttempts.forEach((a) => attemptMap.set(a.id, a));

    const mergedAttempts = Array.from(attemptMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(mergedAttempts));

    const remoteAttemptIds = new Set(remoteAttempts.map((a) => a.id));
    const localOnlyAttempts = localAttempts.filter((a) => !remoteAttemptIds.has(a.id));
    for (const a of localOnlyAttempts) {
      syncAttemptToFirestore(a);
    }
  } catch (err) {
    console.warn('Error syncing cloud and local data:', err);
  }
}
