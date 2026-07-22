'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Play,
  FileText,
  BarChart2,
  Trash2,
  Plus,
  HelpCircle,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { QuizGroup, Question, GroupStats } from '@/lib/types';
import { getGroup, getQuestions, getGroupStats, deleteGroup } from '@/lib/storage';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function GroupDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [group, setGroup] = useState<QuizGroup | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = () => {
    const grp = getGroup(groupId);
    if (!grp) {
      setIsLoading(false);
      return;
    }
    setGroup(grp);

    const qList = getQuestions(groupId);
    setQuestions(qList);

    const st = getGroupStats(groupId);
    setStats(st);
    setIsLoading(false);
  };

  const confirmDelete = () => {
    deleteGroup(groupId);
    router.push('/');
  };

  if (isLoading || !group) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="h-8 w-48 skeleton mx-auto mb-4" />
        <div className="h-48 w-full skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-6 sm:px-6 animate-fade-in">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-5 focus-ring rounded-xl px-2 py-2 -ml-2 min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Main Group Header Card */}
      <div className="glass-panel p-5 sm:p-8 mb-6 sm:mb-8 relative border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/80 to-slate-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-3">
              <BookOpen className="h-3.5 w-3.5" />
              Quiz Group Collection
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">{group.name}</h1>
            <p className="text-xs sm:text-sm text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'} Available
            </p>
          </div>

          {/* Quick Stats Summary Pill */}
          {stats && stats.totalAttempts > 0 && (
            <div className="glass-panel p-4 rounded-xl border border-white/10 bg-black/40 flex items-center gap-4 self-start md:self-center">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Best Score</p>
                <p className="text-lg font-extrabold text-emerald-400">
                  {stats.bestScore?.percentage ?? 0}%
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Attempts</p>
                <p className="text-lg font-extrabold text-white">{stats.totalAttempts}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Learning Mode Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-6 sm:mb-8">
        {/* Study Mode Button Card */}
        <Link
          href={questions.length > 0 ? `/group/${groupId}/quiz?mode=study` : `/group/${groupId}/import`}
          className={`glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col justify-between group min-h-[160px] ${
            questions.length === 0 ? 'opacity-75' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5.5 w-5.5" />
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Instant Feedback
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
              Study Mode
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Immediate feedback after every question. Shows correct option letter, answer text, and explanations as you learn.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/10 text-emerald-400 font-semibold text-xs sm:text-sm min-h-[44px]">
            <span>{questions.length > 0 ? 'Start Study Session' : 'Import Questions First'}</span>
            <Play className="h-4 w-4 fill-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Practice Mode Button Card */}
        <Link
          href={questions.length > 0 ? `/group/${groupId}/quiz?mode=practice` : `/group/${groupId}/import`}
          className={`glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl border-l-4 border-l-indigo-500 flex flex-col justify-between group min-h-[160px] ${
            questions.length === 0 ? 'opacity-75' : ''
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 group-hover:scale-105 transition-transform">
                <Award className="h-5.5 w-5.5" />
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Exam Simulator
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
              Practice Mode
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Simulates a real timed exam. Answers and corrections remain hidden until you complete and submit the quiz.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/10 text-indigo-400 font-semibold text-xs sm:text-sm min-h-[44px]">
            <span>{questions.length > 0 ? 'Start Practice Exam' : 'Import Questions First'}</span>
            <Play className="h-4 w-4 fill-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Secondary Actions Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 sm:mb-8">
        <Link
          href={`/group/${groupId}/import`}
          className="btn-secondary py-3 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[48px]"
        >
          <FileText className="h-4 w-4 text-indigo-400" />
          <span>Import Questions</span>
        </Link>

        <Link
          href={`/group/${groupId}/stats`}
          className="btn-secondary py-3 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[48px]"
        >
          <BarChart2 className="h-4 w-4 text-emerald-400" />
          <span>Statistics & Weak Areas</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsDeleting(true)}
          className="btn-danger py-3 px-4 text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Group</span>
        </button>
      </div>

      {/* Question Bank Preview */}
      <div className="glass-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-400" />
              Question Collection ({questions.length})
            </h3>
            <p className="text-xs text-slate-400">Questions currently parsed in this group</p>
          </div>

          <Link href={`/group/${groupId}/import`} className="btn-primary text-xs py-2 px-3.5 min-h-[44px]">
            <Plus className="h-4 w-4" />
            <span>Add More</span>
          </Link>
        </div>

        {questions.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-xs sm:text-sm text-slate-400 mb-4">No questions imported yet for this group.</p>
            <Link href={`/group/${groupId}/import`} className="btn-secondary text-xs py-2.5 px-4 min-h-[44px]">
              Paste & Import Questions
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/30 transition-colors flex items-start justify-between gap-3 text-xs sm:text-sm"
              >
                <div>
                  <span className="font-semibold text-indigo-400 mr-2">Q{idx + 1}.</span>
                  <span className="text-slate-200">{q.question}</span>
                </div>
                <span className="shrink-0 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                  Key: {q.correctAnswer.letter}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleting}
        title={`Delete "${group.name}"?`}
        message="This action will permanently delete this group, all questions inside it, and past attempt history. This cannot be undone."
        confirmText="Delete Group"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleting(false)}
      />
    </div>
  );
}
