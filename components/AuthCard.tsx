'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase';
import QuizzerLogo from '@/components/QuizzerLogo';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  errorMessage?: string | null;
  onClearError?: () => void;
  footerContent?: ReactNode;
}

export default function AuthCard({
  title,
  subtitle,
  children,
  errorMessage,
  onClearError,
  footerContent,
}: AuthCardProps) {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [socialError, setSocialError] = React.useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setSocialError(null);
      if (onClearError) onClearError();
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.error('Google Login Error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      setSocialError(getAuthErrorMessage(code, msg));
    } finally {
      setGoogleLoading(false);
    }
  };

  const displayError = errorMessage || socialError;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3.5 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -left-40 w-[350px] h-[350px] bg-indigo-800/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="glass-panel p-5 sm:p-8 shadow-2xl border border-white/10 backdrop-blur-2xl bg-[#0b101d]/85">

          {/* Header & Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <Link
              href="/"
              className="inline-flex items-center group p-1.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 sm:mb-5 hover:bg-indigo-500/20 transition-all duration-300 focus-ring min-h-[44px]"
              aria-label="Quizzer Home"
            >
              <QuizzerLogo size="lg" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">{title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">{subtitle}</p>
          </div>

          {/* Google Sign-In — full width, prominent */}
          <button
            type="button"
            id="auth-google-btn"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm
              bg-white text-gray-800
              border border-gray-200/20
              shadow-md shadow-black/20
              hover:bg-gray-50 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5
              active:scale-[0.98] active:translate-y-0
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              min-h-[48px] focus-ring
              mb-6"
          >
            {googleLoading ? (
              <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C1.2 8.7.8 10.3.8 12s.4 3.3 1.1 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting…' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase shrink-0">
              or continue with email
            </span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Error Banner */}
          {displayError && (
            <div
              id="auth-error-banner"
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-fade-in"
              role="alert"
            >
              <span className="text-rose-400 shrink-0 font-bold mt-0.5" aria-hidden="true">⚠️</span>
              <div className="flex-1">{displayError}</div>
            </div>
          )}

          {/* Form Content (email/password fields + submit button) */}
          {children}

          {/* Footer Navigation Link */}
          {footerContent && (
            <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-slate-400">
              {footerContent}
            </div>
          )}
        </div>

        {/* Bottom Badge */}
        <div className="mt-4 sm:mt-5 text-center flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Secure authentication powered by Firebase</span>
        </div>
      </div>
    </div>
  );
}
