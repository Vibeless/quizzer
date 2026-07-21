'use client';

import { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Edit3 } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  title?: string;
}

export default function GroupModal({
  isOpen,
  onClose,
  onSubmit,
  initialName = '',
  title = 'New Quiz Group',
}: GroupModalProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-panel p-6 shadow-2xl relative border border-white/10 rounded-2xl bg-[#0b101d] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors focus-ring"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0">
            {initialName ? <Edit3 className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
            <p className="text-xs text-slate-400">Organize your questions by subject or exam category</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Group Name
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              maxLength={50}
              placeholder="e.g. Computer Networks, AWS Practitioner..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input text-sm"
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-slate-500 font-mono">{name.length}/50</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className="btn-primary text-xs py-2 px-4">
              {initialName ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

