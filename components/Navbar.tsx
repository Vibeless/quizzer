'use client';

import Link from 'next/link';
import { BookOpen, Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#080c14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group focus-ring rounded-xl p-1 -m-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/90 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:bg-indigo-500 transition-all duration-200">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                Quizzer
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium">Question Bank Converter & Exam Prep</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors font-medium px-3.5 py-1.5 rounded-lg hover:bg-white/[0.06] active:scale-95"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}

