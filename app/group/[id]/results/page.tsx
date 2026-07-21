'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Home,
  FileText,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizGroup, Question, Attempt } from '@/lib/types';
import { getGroup, getQuestions, getAttempts } from '@/lib/storage';

export default function QuizResults({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  const group: QuizGroup | null = getGroup(groupId);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const qList = getQuestions(groupId);
    setQuestions(qList);

    const attemptsList = getAttempts(groupId);
    let targetAttempt: Attempt | undefined;

    if (attemptId) {
      targetAttempt = attemptsList.find((a) => a.id === attemptId);
    } else {
      targetAttempt = attemptsList[0];
    }

    if (targetAttempt) {
      setAttempt(targetAttempt);
      const pct = targetAttempt.percentage;

      const fire = (opts: confetti.Options) =>
        confetti({ zIndex: 9999, ...opts });

      if (pct === 100) {
        fire({ particleCount: 120, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } });
        fire({ particleCount: 120, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } });
        setTimeout(() => {
          fire({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: ['#ffd700', '#ff6b6b', '#4ecdc4'] });
          fire({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: ['#ffd700', '#ff6b6b', '#4ecdc4'] });
        }, 300);
      } else if (pct >= 80) {
        fire({ particleCount: 100, spread: 70, origin: { x: 0.5, y: 0.65 } });
      } else if (pct >= 50) {
        fire({ particleCount: 60, spread: 60, origin: { x: 0.5, y: 0.65 }, colors: ['#a8edea', '#fed6e3', '#d299c2'] });
      } else {
        fire({ particleCount: 30, spread: 50, startVelocity: 20, origin: { x: 0.5, y: 0.65 }, colors: ['#89f7fe', '#66a6ff'] });
      }
    }
  }, [groupId, attemptId]);

  if (!group || !attempt) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getGrade = (percentage: number) => {
    if (percentage === 100) return { grade: 'A+', color: 'text-amber-400', label: 'Perfect Score!' };
    if (percentage >= 85) return { grade: 'A', color: 'text-emerald-400', label: 'Excellent Job!' };
    if (percentage >= 70) return { grade: 'B', color: 'text-indigo-400', label: 'Good Performance' };
    if (percentage >= 50) return { grade: 'C', color: 'text-amber-400', label: 'Passed — Room to Grow' };
    return { grade: 'F', color: 'text-rose-400', label: 'Needs Practice' };
  };

  const gradeInfo = getGrade(attempt.percentage);

  const getAnswerMap = () => {
    const map: Record<string, { selectedLetter: string; isCorrect: boolean }> = {};
    attempt.answers.forEach((ans) => {
      map[ans.questionId] = {
        selectedLetter: ans.selectedLetter,
        isCorrect: ans.isCorrect,
      };
    });
    return map;
  };

  const answerMap = getAnswerMap();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* RESULTS CARD */}
      <div className="glass-panel p-6 sm:p-10 text-center mb-8 relative border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 via-slate-900/80 to-slate-950">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600/20 border border-indigo-500/30 text-white shadow-xl shadow-indigo-500/20 mb-4">
          <span className={`text-3xl font-extrabold font-mono ${gradeInfo.color}`}>{gradeInfo.grade}</span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Quiz Completed — {attempt.mode === 'study' ? 'Study Mode' : 'Practice Mode'}
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{group.name} Results</h1>
        <p className="text-xs text-slate-400 mb-6">{gradeInfo.label} • Attempted on {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

        {/* Big Percentage & Score Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
          <div className="glass-panel p-4 rounded-xl border border-white/10 bg-black/30">
            <p className="text-[11px] text-slate-400 font-medium mb-1">Score</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {attempt.score} / {attempt.total}
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-[11px] text-emerald-300 font-medium mb-1">Percentage</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {attempt.percentage}%
            </p>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-white/10 bg-black/30 col-span-2 sm:col-span-1">
            <p className="text-[11px] text-slate-400 font-medium mb-1">Time Taken</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 flex items-center justify-center gap-1.5 font-mono">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
              {formatTime(attempt.timeTaken)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setIsReviewOpen(!isReviewOpen)}
            className="btn-primary py-2.5 px-6 text-xs sm:text-sm w-full sm:w-auto"
          >
            <FileText className="h-4 w-4" />
            {isReviewOpen ? 'Hide Review' : 'Review Answers & Corrections'}
          </button>

          <Link href={`/group/${groupId}/quiz?mode=${attempt.mode}`} className="btn-secondary py-2.5 px-5 text-xs sm:text-sm w-full sm:w-auto">
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Link>

          <Link href="/" className="btn-secondary py-2.5 px-5 text-xs sm:text-sm w-full sm:w-auto">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* REVIEW & CORRECTIONS SECTION */}
      {isReviewOpen && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              Detailed Corrections Breakdown
            </h2>
            <span className="text-xs text-slate-400 font-mono">{questions.length} Questions</span>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const ansInfo = answerMap[q.id];
              const selectedLetter = ansInfo?.selectedLetter || '';
              const isCorrect = ansInfo?.isCorrect || false;
              const selectedOption = q.options.find((o) => o.letter === selectedLetter);

              return (
                <div
                  key={q.id}
                  className={`glass-panel p-5 border transition-all ${
                    isCorrect ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : 'border-rose-500/25 bg-rose-500/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-white text-sm sm:text-base leading-relaxed">
                      <span className="text-indigo-400 font-mono mr-2">Q{idx + 1}.</span>
                      {q.question}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {/* Options Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                      <p className="text-[11px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Your Answer:</p>
                      {selectedLetter ? (
                        <p className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <span>{selectedLetter}. {selectedOption?.text || selectedLetter}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-amber-400 font-semibold">No Answer Selected ❌</p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <p className="text-[11px] text-emerald-300 font-semibold mb-1 uppercase tracking-wider">Correct Answer:</p>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-400">
                        {q.correctAnswer.letter}. {q.correctAnswer.text}
                      </p>
                    </div>
                  </div>

                  {/* Explanation if present */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-indigo-300 block mb-0.5">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

