'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Cloud, CloudOff, LogIn, LogOut, User as UserIcon, UserPlus } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  isFirebaseConfigured,
  subscribeAuthState,
  signInWithGoogle,
  signOutUser,
} from '@/lib/firebase';
import { pullCloudDataToLocal } from '@/lib/storage';

import QuizzerLogo from '@/components/QuizzerLogo';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);

  useEffect(() => {
    setIsConfigured(isFirebaseConfigured());
    const unsubscribe = subscribeAuthState((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        pullCloudDataToLocal();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      setIsAuthMenuOpen(false);
    } catch (err) {
      alert('Google Login Failed. Check console or Firebase Auth domain settings.');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setIsAuthMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#080c14]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group focus-ring rounded-xl p-1 -m-1">
          <QuizzerLogo size="md" />
        </Link>

        <div className="flex items-center gap-3">
          {/* Cloud Sync Status Indicator */}
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Cloud Sync Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-400 border border-white/10" title="Firebase environment variables not set. Operating in LocalStorage mode.">
              <CloudOff className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Local Mode</span>
            </span>
          )}

          <Link
            href="/"
            className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/[0.06] active:scale-95"
          >
            Dashboard
          </Link>

          {/* Auth Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl glass-panel bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all text-xs text-slate-200"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="h-6 w-6 rounded-full" />
                ) : (
                  <UserIcon className="h-4 w-4 text-indigo-400" />
                )}
                <span className="max-w-[100px] truncate font-medium hidden sm:inline">
                  {user.displayName || (user.isAnonymous ? 'Guest' : user.email ? user.email.split('@')[0] : 'User')}
                </span>
              </button>

              {/* Logged in User Menu */}
              {isAuthMenuOpen && (
                <div className="absolute right-0 top-10 z-50 w-52 glass-panel bg-[#0b101d] p-2 shadow-2xl border border-white/10 rounded-xl animate-scale-in text-xs">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="font-bold text-white truncate">{user.displayName || 'Account'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email || (user.isAnonymous ? 'Anonymous Session' : '')}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="btn-secondary text-xs py-1.5 px-3 hidden sm:flex items-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
