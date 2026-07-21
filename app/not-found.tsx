'use client';

import Link from 'next/link';
import { Home, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className="glass-panel p-10 max-w-md w-full border border-white/10 relative overflow-hidden">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 mb-5 border border-indigo-500/25">
          <HelpCircle className="h-8 w-8" />
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-2 font-mono">404</h1>
        <h2 className="text-lg font-bold text-slate-200 mb-2">Page or Group Not Found</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          The quiz group or page you are looking for does not exist or may have been deleted.
        </p>

        <Link href="/" className="btn-primary text-xs py-2.5 px-5 w-full">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
