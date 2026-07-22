'use client';

import React from 'react';

interface QuizzerLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function QuizzerLogo({
  className = '',
  size = 'md',
  showText = true,
}: QuizzerLogoProps) {
  const dimensions = {
    sm: { container: 'h-7 w-7', icon: 'w-4 h-4', text: 'text-base' },
    md: { container: 'h-9 w-9', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { container: 'h-11 w-11', icon: 'w-6 h-6', text: 'text-2xl' },
    xl: { container: 'h-14 w-14', icon: 'w-8 h-8', text: 'text-3xl' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Dynamic Q & Spark Logo Icon Container */}
      <div
        className={`relative flex items-center justify-center ${dimensions.container} rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300 border border-white/20`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 text-white"
        >
          {/* Q Loop */}
          <circle
            cx="19"
            cy="18"
            r="10.5"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Checkmark inside Q (Mastery/Quiz) */}
          <path
            d="M14.5 18.5L17.8 21.8L23.8 14.8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Q Tail Accent */}
          <path
            d="M22.5 23.5L28.5 29.5"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Knowledge Sparkle */}
          <circle cx="28" cy="10" r="1.5" fill="#a5b4fc" />
        </svg>
      </div>

      {showText && (
        <span className={`${dimensions.text} font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors`}>
          Quizzer
        </span>
      )}
    </div>
  );
}
