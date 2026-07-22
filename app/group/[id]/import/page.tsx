'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';
import { QuizGroup, Question } from '@/lib/types';
import { getGroup, saveQuestions } from '@/lib/storage';
import { parseRawQuestions, SAMPLE_QUESTION_TEXT } from '@/lib/parser';

export default function ImportQuestions({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [group, setGroup] = useState<QuizGroup | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setGroup(getGroup(groupId));
    setIsLoading(false);
  }, [groupId]);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseRawQuestions(rawText, groupId);
    setParsedQuestions(result.questions);
    setHasParsed(true);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_QUESTION_TEXT);
  };

  const handleQuestionChange = (index: number, updated: Question) => {
    const next = [...parsedQuestions];
    
    // Re-verify validity
    const errors: string[] = [];
    let isValid = true;

    if (!updated.question.trim()) {
      isValid = false;
      errors.push('Missing question text');
    }

    if (updated.options.length < 2) {
      isValid = false;
      errors.push(`Requires at least 2 options (found ${updated.options.length})`);
    }

    if (!updated.correctAnswer.letter) {
      isValid = false;
      errors.push('Missing correct answer');
    } else if (!updated.options.some((o) => o.letter === updated.correctAnswer.letter)) {
      isValid = false;
      errors.push(`Answer key "${updated.correctAnswer.letter}" does not match any option`);
    }

    updated.isValid = isValid;
    updated.validationError = errors.join('; ');

    next[index] = updated;
    setParsedQuestions(next);
  };

  const handleDeleteQuestion = (index: number) => {
    const next = parsedQuestions.filter((_, i) => i !== index);
    setParsedQuestions(next);
  };

  const handleSave = () => {
    const validToSave = parsedQuestions.filter((q) => q.isValid);
    if (validToSave.length === 0) {
      alert('No valid questions to save. Please fix or remove malformed entries.');
      return;
    }

    saveQuestions(groupId, validToSave);
    router.push(`/group/${groupId}`);
  };

  if (isLoading || !group) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <div className="h-8 w-48 skeleton mx-auto mb-4" />
        <div className="h-48 w-full skeleton rounded-2xl" />
      </div>
    );
  }

  const validCount = parsedQuestions.filter((q) => q.isValid).length;
  const invalidCount = parsedQuestions.length - validCount;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
      <Link
        href={`/group/${groupId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 focus-ring rounded-lg p-1 -m-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {group.name}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-indigo-400" />
            Import Questions — {group.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Paste raw question bank text below. Our deterministic parser will extract questions, options, and answer keys.
          </p>
        </div>

        {hasParsed && (
          <button
            onClick={() => {
              setHasParsed(false);
              setParsedQuestions([]);
            }}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Edit Text
          </button>
        )}
      </div>

      {!hasParsed ? (
        /* STEP 1: TEXT AREA INPUT */
        <div className="glass-panel p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Paste Question Bank Content
            </label>
            <button
              onClick={handleLoadSample}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 active:scale-95 transition-transform"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Load Sample Data
            </button>
          </div>

          <textarea
            rows={14}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`1. Which protocol secures websites?
A. HTTP
B. FTP
C. HTTPS
D. SMTP
Answer: C
Explanation: HTTPS uses SSL/TLS encryption...`}
            className="w-full glass-input font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/30 bg-[#080c14]/80"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-[11px] text-slate-400">
              Supported formats: <span className="text-slate-300 font-mono">1., Q1, Question 1, A. B. C. D. E. F., Answer: C / Ans: C</span>
            </p>

            <button
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="btn-primary py-2.5 px-6 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              Parse Questions
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: INTERACTIVE PREVIEW & EDIT */
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900/60">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                {parsedQuestions.length} Questions Extracted
              </h2>
              <div className="flex items-center gap-3 text-xs mt-1">
                <span className="text-emerald-400 font-medium">✓ {validCount} Valid</span>
                {invalidCount > 0 && (
                  <span className="text-amber-400 font-medium">⚠ {invalidCount} Need Review</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={validCount === 0}
                className="btn-primary py-2.5 px-5 text-xs sm:text-sm disabled:opacity-50 shadow-lg shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none"
              >
                <Save className="h-4 w-4" />
                Save {validCount} Questions to Group
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-5">
            {parsedQuestions.map((q, qIndex) => (
              <div
                key={q.id}
                className={`glass-panel p-5 relative border transition-all ${
                  q.isValid ? 'border-white/10 hover:border-indigo-500/30' : 'border-amber-500/40 bg-amber-500/5'
                }`}
              >
                {/* Header Badge & Action */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-400 text-xs sm:text-sm font-mono">Question {qIndex + 1}</span>
                    {q.isValid ? (
                      <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Valid
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {q.validationError}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors focus-ring"
                    title="Remove Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Question Text Field */}
                <div className="mb-4">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">Question Text</label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, { ...q, question: e.target.value })
                    }
                    className="w-full glass-input text-xs sm:text-sm font-medium"
                  />
                </div>

                {/* Options List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {q.options.map((opt, optIndex) => (
                    <div key={opt.letter} className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 font-mono font-bold text-indigo-300 text-xs shrink-0 border border-indigo-500/25">
                        {opt.letter}
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const nextOpts = [...q.options];
                          nextOpts[optIndex] = { ...nextOpts[optIndex], text: e.target.value };
                          handleQuestionChange(qIndex, { ...q, options: nextOpts });
                        }}
                        className="w-full glass-input text-xs py-1.5"
                      />
                    </div>
                  ))}
                </div>

                {/* Answer Letter Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-300">Correct Answer Option:</span>
                    <select
                      value={q.options.some((o) => o.letter === q.correctAnswer.letter) ? q.correctAnswer.letter : ''}
                      onChange={(e) => {
                        const letter = e.target.value;
                        const match = q.options.find((o) => o.letter === letter);
                        handleQuestionChange(qIndex, {
                          ...q,
                          correctAnswer: {
                            letter,
                            text: match ? match.text : q.correctAnswer.text,
                          },
                        });
                      }}
                      className="glass-input py-1 px-3 bg-[#0b101d] text-indigo-300 font-bold text-xs"
                    >
                      <option value="">Select Answer</option>
                      {q.options.map((o) => (
                        <option key={o.letter} value={o.letter}>
                          {o.letter} – {o.text.length > 25 ? o.text.substring(0, 25) + '…' : o.text}
                        </option>
                      ))}
                    </select>
                  </div>

                  {q.explanation && (
                    <span className="text-slate-400 text-xs italic">
                      Explanation attached
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={validCount === 0}
              className="btn-primary py-3 px-8 text-xs sm:text-sm shadow-xl shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none"
            >
              <Save className="h-4.5 w-4.5" />
              Save {validCount} Questions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
