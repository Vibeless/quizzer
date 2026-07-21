'use client';

import { useState, useEffect, use, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { QuizGroup, Question, AttemptAnswer } from '@/lib/types';
import { getGroup, getQuestions, saveAttempt } from '@/lib/storage';

function QuizContent({ groupId }: { groupId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as 'study' | 'practice') || 'practice';

  const group: QuizGroup | null = getGroup(groupId);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Map of questionId -> selectedLetter
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const qList = getQuestions(groupId);
    if (qList.length === 0) {
      router.push(`/group/${groupId}`);
      return;
    }
    setQuestions(qList);
  }, [groupId, router]);

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentQuestion = questions[currentIndex];
  const userSelection = currentQuestion ? selectedAnswers[currentQuestion.id] || '' : '';
  const isAnswered = !!userSelection;

  const handleSelectOption = useCallback((letter: string) => {
    if (!currentQuestion) return;
    if (mode === 'study' && isAnswered) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: letter,
    }));
  }, [currentQuestion, mode, isAnswered]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleSubmitQuiz = useCallback(() => {
    if (isSubmitting || questions.length === 0) return;
    setIsSubmitting(true);

    let score = 0;
    const answers: AttemptAnswer[] = questions.map((q) => {
      const sel = selectedAnswers[q.id] || '';
      const isCorrect = sel.toUpperCase() === q.correctAnswer.letter.toUpperCase();
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        selectedLetter: sel,
        isCorrect,
      };
    });

    const percentage = (score / questions.length) * 100;

    const attempt = saveAttempt({
      groupId,
      mode,
      score,
      total: questions.length,
      percentage: Math.round(percentage * 10) / 10,
      timeTaken: elapsedSeconds,
      answers,
    });

    router.push(`/group/${groupId}/results?attemptId=${attempt.id}`);
  }, [isSubmitting, questions, selectedAnswers, groupId, mode, elapsedSeconds, router]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        const optionExists = currentQuestion.options.some((o) => o.letter === key);
        if (optionExists) handleSelectOption(key);
      } else if (['1', '2', '3', '4', '5'].includes(key)) {
        const idx = parseInt(key) - 1;
        if (currentQuestion.options[idx]) {
          handleSelectOption(currentQuestion.options[idx].letter);
        }
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Enter' && currentIndex === questions.length - 1) {
        handleSubmitQuiz();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, currentIndex, questions.length, handleSelectOption, handleNext, handlePrev, handleSubmitQuiz]);

  if (!group || questions.length === 0 || !currentQuestion) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 animate-fade-in">
      {/* Header Info & Progress Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/group/${groupId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors focus-ring rounded-lg p-1 -m-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Quiz
          </Link>

          <div className="flex items-center gap-2.5">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                mode === 'study'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}
            >
              {mode === 'study' ? 'Study Mode' : 'Practice Mode'}
            </span>

            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 glass-panel py-1 px-3">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>

        {/* Question Counter & Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mb-1.5">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="glass-panel p-6 sm:p-8 relative border-indigo-500/20 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
            <span className="text-indigo-400 font-mono mr-2">Q{currentIndex + 1}.</span>
            {currentQuestion.question}
          </h2>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="hidden sm:block text-[10px] text-slate-500 mb-4 font-mono">
          Tip: Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">A</kbd>-<kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">D</kbd> or <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">1</kbd>-<kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">4</kbd> to select option, <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">←</kbd> <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">→</kbd> to navigate
        </div>

        {/* Options List */}
        <div className="space-y-2.5 mb-6">
          {currentQuestion.options.map((opt) => {
            const isSelected = userSelection === opt.letter;
            const isCorrectOption = opt.letter === currentQuestion.correctAnswer.letter;

            let optionStyle = 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-indigo-500/40 hover:bg-white/[0.08]';

            if (mode === 'study' && isAnswered) {
              if (isCorrectOption) {
                optionStyle = 'border-emerald-500/60 bg-emerald-500/15 text-white font-bold ring-1 ring-emerald-500/30';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-rose-500/60 bg-rose-500/15 text-white font-bold';
              } else {
                optionStyle = 'border-white/5 bg-white/5 opacity-40';
              }
            } else if (isSelected) {
              optionStyle = 'border-indigo-500 bg-indigo-500/20 text-white font-bold shadow-md shadow-indigo-500/10';
            }

            return (
              <button
                key={opt.letter}
                onClick={() => handleSelectOption(opt.letter)}
                disabled={mode === 'study' && isAnswered}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs sm:text-sm focus-ring ${optionStyle} ${
                  mode === 'study' && isAnswered ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-mono font-extrabold shrink-0 border ${
                      mode === 'study' && isAnswered && isCorrectOption
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : mode === 'study' && isAnswered && isSelected && !isCorrectOption
                        ? 'bg-rose-500 text-white border-rose-400'
                        : isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {opt.letter}
                  </span>
                  <span className="leading-snug">{opt.text}</span>
                </div>

                {mode === 'study' && isAnswered && (
                  <div className="shrink-0">
                    {isCorrectOption && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                    {isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-rose-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {mode === 'study' && isAnswered && (
          <div
            className={`p-4 rounded-xl mb-2 border animate-fade-in ${
              userSelection === currentQuestion.correctAnswer.letter
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1 text-sm">
              {userSelection === currentQuestion.correctAnswer.letter ? (
                <>
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4.5 w-4.5 text-rose-400" />
                  <span>Incorrect</span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-200 mt-1">
              Correct Answer: <span className="font-bold text-white">Option {currentQuestion.correctAnswer.letter}</span> — {currentQuestion.correctAnswer.text}
            </p>

            {currentQuestion.explanation && (
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-indigo-300 block mb-0.5">Explanation:</span>
                {currentQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation & Submission Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="btn-secondary text-xs py-2.5 px-4 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            className="btn-primary py-2.5 px-6 text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none shadow-lg shadow-emerald-600/20"
          >
            Submit Quiz
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary py-2.5 px-5 text-xs sm:text-sm">
            <span>Next Question</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuizExecution({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);

  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div className="h-8 w-48 skeleton mx-auto mb-4" />
        <div className="h-40 w-full skeleton rounded-2xl" />
      </div>
    }>
      <QuizContent groupId={groupId} />
    </Suspense>
  );
}


