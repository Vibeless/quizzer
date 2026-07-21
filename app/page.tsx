'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Folder,
  Plus,
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  MoreVertical,
  Edit3,
  Trash2,
} from 'lucide-react';
import { QuizGroup } from '@/lib/types';
import { getGroups, createGroup, renameGroup, deleteGroup } from '@/lib/storage';
import GroupModal from '@/components/GroupModal';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function Dashboard() {
  const [groups, setGroups] = useState<QuizGroup[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<QuizGroup | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<QuizGroup | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const loadGroups = () => {
    const loaded = getGroups();
    setGroups(loaded);
  };

  const handleCreateGroup = (name: string) => {
    createGroup(name);
    loadGroups();
  };

  const handleRenameGroup = (name: string) => {
    if (editingGroup) {
      renameGroup(editingGroup.id, name);
      setEditingGroup(null);
      loadGroups();
    }
  };

  const confirmDeleteGroup = () => {
    if (deletingGroup) {
      deleteGroup(deletingGroup.id);
      setDeletingGroup(null);
      setActiveMenuId(null);
      loadGroups();
    }
  };

  const totalQuestions = groups.reduce((sum, g) => sum + g.questionCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* Hero / Header Section */}
      <div className="relative overflow-hidden glass-panel p-6 sm:p-8 mb-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/80 to-slate-950">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Interactive Study & Exam Platform
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Quizzer Dashboard
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Paste raw question banks, parse questions deterministically, and practice with instant feedback or timed exam simulation.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-sm py-3 px-5 shadow-lg shadow-indigo-600/20 self-start md:self-center shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            New Quiz Group
          </button>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Total Quiz Groups</p>
              <p className="text-xl font-extrabold text-white">{groups.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Total Questions</p>
              <p className="text-xl font-extrabold text-white">{totalQuestions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Modes Available</p>
              <p className="text-sm font-bold text-white">Study & Practice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Recent Groups */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Folder className="h-5 w-5 text-indigo-400" />
            Your Quiz Collections
          </h2>
          <p className="text-xs text-slate-400">Select a group to start studying or import questions</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-secondary text-xs py-2 px-3 sm:hidden"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="glass-panel p-12 text-center border-dashed border-white/15">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
            <Folder className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Quiz Groups Yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            Create your first quiz group (e.g. Computer Networks, Biology, AWS) to start importing questions and practicing.
          </p>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary text-xs py-2.5 px-4">
            <Plus className="h-4 w-4" />
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group relative glass-panel glass-panel-hover p-5 flex flex-col justify-between"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-indigo-400 border border-indigo-500/25 group-hover:scale-105 transition-transform shrink-0">
                      <Folder className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {group.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {group.questionCount} {group.questionCount === 1 ? 'Question' : 'Questions'}
                      </span>
                    </div>
                  </div>

                  {/* Options Dropdown Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === group.id ? null : group.id);
                      }}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors focus-ring"
                      aria-label="Options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === group.id && (
                      <div className="absolute right-0 top-8 z-30 w-36 glass-panel bg-[#0b101d] p-1 shadow-xl border border-white/10 rounded-xl animate-scale-in">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingGroup(group);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeletingGroup(group);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  Interactive question set for {group.name} subject review and practice testing.
                </p>
              </div>

              {/* Card Footer Action */}
              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between mt-auto">
                <Link
                  href={`/group/${group.id}`}
                  className="w-full flex items-center justify-between text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1 focus-ring rounded-lg"
                >
                  <span>Open Details</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <GroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
        title="Create New Quiz Group"
      />

      {/* Rename Group Modal */}
      <GroupModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        onSubmit={handleRenameGroup}
        initialName={editingGroup?.name || ''}
        title="Rename Quiz Group"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingGroup}
        title={`Delete "${deletingGroup?.name}"?`}
        message="This action will permanently delete this group, along with all its imported questions and attempt history. This cannot be undone."
        confirmText="Delete Group"
        onConfirm={confirmDeleteGroup}
        onCancel={() => setDeletingGroup(null)}
      />
    </div>
  );
}

