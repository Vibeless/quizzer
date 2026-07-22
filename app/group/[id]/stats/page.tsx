'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart2,
  Award,
  Clock,
  AlertTriangle,
  Play,
  TrendingUp,
  History,
  CheckCircle2,
} from 'lucide-react';
import { QuizGroup, GroupStats } from '@/lib/types';
import { getGroup, getGroupStats } from '@/lib/storage';

export default function GroupStatistics({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);

  const [group, setGroup] = useState<QuizGroup | null>(null);
  const [stats, setStats] = useState<GroupStats | null>(null);

  useEffect(() => {
    if (!groupId) return;
    setGroup(getGroup(groupId));
    const st = getGroupStats(groupId);
    setStats(st);
  }, [groupId]);

  if (!group || !stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="h-8 w-48 skeleton mx-auto mb-4" />
        <div className="h-48 w-full skeleton rounded-2xl" />
      </div>
    );
  }

  const formatTime = (secs: number) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-6 sm:px-6 animate-fade-in">
      <Link
        href={`/group/${groupId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-5 focus-ring rounded-xl px-2 py-2 -ml-2 min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        <span>Back to {group.name}</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart2 className="h-7 w-7 text-emerald-400 shrink-0" />
            <span>{group.name} Statistics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Performance analytics, score trends, and frequently missed questions breakdown.
          </p>
        </div>

        <Link
          href={`/group/${groupId}/quiz?mode=practice`}
          className="btn-primary text-xs sm:text-sm py-3 px-5 self-start sm:self-center min-h-[48px] w-full sm:w-auto"
        >
          <Play className="h-4 w-4 fill-white shrink-0" />
          <span>Start Practice Exam</span>
        </Link>
      </div>

      {stats.totalAttempts === 0 ? (
        <div className="glass-panel p-8 sm:p-12 text-center border-dashed border-white/15">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
            <BarChart2 className="h-7 w-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">No Attempt Data Yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            Take a study or practice quiz to start tracking scores, average time, and identifying weak questions.
          </p>
          <Link href={`/group/${groupId}/quiz?mode=practice`} className="btn-primary text-xs py-3 px-5 min-h-[48px] w-full sm:w-auto">
            Start First Attempt
          </Link>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
            {/* Best Score */}
            <div className="glass-panel p-4 rounded-2xl border-emerald-500/30 bg-emerald-500/10">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-2">
                <Award className="h-3.5 w-3.5 shrink-0" /> Best Score
              </div>
              <p className="text-xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {stats.bestScore ? `${stats.bestScore.percentage}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-300 mt-1 font-mono">
                {stats.bestScore ? `${stats.bestScore.score} / ${stats.bestScore.total}` : 'No attempts'}
              </p>
            </div>

            {/* Average Score */}
            <div className="glass-panel p-4 rounded-2xl border-indigo-500/30 bg-indigo-500/10">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold mb-2">
                <TrendingUp className="h-3.5 w-3.5 shrink-0" /> Avg Score
              </div>
              <p className="text-xl sm:text-3xl font-extrabold text-indigo-300 font-mono">
                {stats.avgScore ? `${stats.avgScore.percentage}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-300 mt-1 font-mono">
                {stats.avgScore ? `${stats.avgScore.score} / ${stats.avgScore.total}` : 'No attempts'}
              </p>
            </div>

            {/* Total Attempts */}
            <div className="glass-panel p-4 rounded-2xl border-white/10 bg-black/40">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-2">
                <History className="h-3.5 w-3.5 text-purple-400 shrink-0" /> Total Attempts
              </div>
              <p className="text-xl sm:text-3xl font-extrabold text-white font-mono">
                {stats.totalAttempts}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Sessions finished</p>
            </div>

            {/* Last Attempt */}
            <div className="glass-panel p-4 rounded-2xl border-white/10 bg-black/40">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" /> Last Attempt
              </div>
              <p className="text-xl sm:text-3xl font-extrabold text-teal-300 font-mono">
                {stats.lastAttempt ? `${stats.lastAttempt.percentage}%` : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {stats.lastAttempt ? `${stats.lastAttempt.score} / ${stats.lastAttempt.total}` : 'No attempts'}
              </p>
            </div>

            {/* Average Time */}
            <div className="glass-panel p-4 rounded-2xl border-white/10 bg-black/40 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-2">
                <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" /> Avg Time
              </div>
              <p className="text-xl sm:text-3xl font-extrabold text-amber-300 font-mono">
                {formatTime(stats.avgTimeSeconds)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Per quiz session</p>
            </div>
          </div>

          {/* Frequently Missed Questions Section */}
          <div className="glass-panel p-5 sm:p-6 border border-rose-500/20 bg-gradient-to-r from-rose-950/20 to-slate-900/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                  Frequently Missed Questions
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Target these specific weak questions to improve your exam readiness</p>
              </div>
            </div>

            {stats.frequentlyMissed.length === 0 ? (
              <p className="text-xs text-emerald-400 font-semibold py-4">
                🎉 Great job! No frequently missed questions detected yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.frequentlyMissed.map((item, idx) => (
                  <div
                    key={item.question.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400 text-xs">Missed #{idx + 1}</span>
                        <span className="text-slate-400 text-[11px]">• Seen {item.totalTimesSeen} {item.totalTimesSeen === 1 ? 'time' : 'times'}</span>
                      </div>
                      <p className="text-slate-200 font-medium leading-relaxed">{item.question.question}</p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1 shrink-0">
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-mono font-bold text-xs">
                        Missed {item.missCount}x ({item.missPercentage}%)
                      </span>
                      <div className="w-full sm:w-28 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${item.missPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
