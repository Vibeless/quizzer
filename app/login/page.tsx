'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight, CheckCircle } from 'lucide-react';
import AuthCard from '@/components/AuthCard';
import { signInWithEmail, subscribeAuthState, getAuthErrorMessage, sendPasswordReset } from '@/lib/firebase';

type View = 'login' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('login');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      if (user) router.push('/');
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await signInWithEmail(email.trim(), password);
      router.push('/');
    } catch (err: any) {
      setError(getAuthErrorMessage(err?.code || '', err?.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    try {
      setResetLoading(true);
      setResetError(null);
      await sendPasswordReset(resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setResetError(getAuthErrorMessage(err?.code || ''));
    } finally {
      setResetLoading(false);
    }
  };

  const switchToForgot = () => {
    setResetEmail(email); // pre-fill with login email if present
    setResetSent(false);
    setResetError(null);
    setError(null);
    setView('forgot');
  };

  const switchToLogin = () => {
    setResetSent(false);
    setResetError(null);
    setView('login');
  };

  /* ── Forgot Password View ─────────────────────────────────────── */
  if (view === 'forgot') {
    return (
      <AuthCard
        title="Reset Password"
        subtitle="Enter your email and we'll send you a reset link"
        errorMessage={resetError}
        onClearError={() => setResetError(null)}
        footerContent={
          <button
            type="button"
            onClick={switchToLogin}
            className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors inline-flex items-center gap-1 hover:underline min-h-[44px]"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Back to Sign In</span>
          </button>
        }
      >
        {resetSent ? (
          /* Success state */
          <div id="reset-success" className="flex flex-col items-center gap-4 py-4 animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white mb-1">Check your inbox</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                We sent a password reset link to{' '}
                <span className="text-indigo-300 font-medium">{resetEmail}</span>.
                Check your spam folder if you don&apos;t see it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setResetSent(false); setResetEmail(''); }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline min-h-[44px]"
            >
              Try a different email
            </button>
          </div>
        ) : (
          /* Reset form */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="reset-email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="glass-input !pl-10 text-xs sm:text-sm min-h-[44px]"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              id="reset-submit-btn"
              disabled={resetLoading}
              className="btn-primary w-full py-3 text-sm mt-2 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {resetLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending link…</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        )}
      </AuthCard>
    );
  }

  /* ── Login View ───────────────────────────────────────────────── */
  return (
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to sync your question banks and test progress"
      errorMessage={error}
      onClearError={() => setError(null)}
      footerContent={
        <p className="text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors inline-flex items-center gap-1 hover:underline min-h-[44px]"
          >
            <span>Create an account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-email">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="glass-input !pl-10 text-xs sm:text-sm min-h-[44px]"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="login-password">
              Password
            </label>
            <button
              type="button"
              id="forgot-password-link"
              onClick={switchToForgot}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors hover:underline min-h-[44px] flex items-center"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="glass-input !pl-10 !pr-10 text-xs sm:text-sm min-h-[44px]"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 pl-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors min-h-[44px] min-w-[44px] justify-center"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="login-submit-btn"
          disabled={isLoading}
          className="btn-primary w-full py-3 text-sm mt-2 flex items-center justify-center gap-2 min-h-[48px]"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>
    </AuthCard>
  );
}
