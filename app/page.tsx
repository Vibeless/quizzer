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
    <div className="mx-auto max-w-6xl px-3.5 py-6 sm:px-6 animate-fade-in">
      {/* Hero / Header Section */}
      <div className="relative overflow-hidden glass-panel p-5 sm:p-8 mb-6 sm:mb-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 via-slate-900/80 to-slate-950">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Interactive Study & Exam Platform
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Quizzer Dashboard
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Paste raw question banks, parse questions deterministically, and practice with instant feedback or timed exam simulation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs sm:text-sm py-3 px-5 shadow-lg shadow-indigo-600/20 w-full md:w-auto shrink-0 min-h-[48px] focus-ring"
          >
            <Plus className="h-4.5 w-4.5 shrink-0" />
            <span>New Quiz Group</span>
          </button>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-5 border-t border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Quiz Groups</p>
              <p className="text-lg sm:text-xl font-extrabold text-white">{groups.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Total Questions</p>
              <p className="text-lg sm:text-xl font-extrabold text-white">{totalQuestions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Modes Available</p>
              <p className="text-xs sm:text-sm font-bold text-white">Study & Practice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Recent Groups */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Folder className="h-5 w-5 text-indigo-400" />
            Your Quiz Collections
          </h2>
          <p className="text-xs text-slate-400">Select a group to start studying or import questions</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="glass-panel p-8 sm:p-12 text-center border-dashed border-white/15">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
            <Folder className="h-7 w-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">No Quiz Groups Yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            Create your first quiz group (e.g. Computer Networks, Biology, AWS) to start importing questions and practicing.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs py-3 px-5 min-h-[48px] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 stagger-children">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group relative glass-panel glass-panel-hover p-4 sm:p-5 flex flex-col justify-between"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-indigo-400 border border-indigo-500/25 shrink-0">
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
                      className="text-slate-400 hover:text-white p-2.5 rounded-xl hover:bg-white/10 transition-colors focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Group Options"
                      aria-expanded={activeMenuId === group.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {activeMenuId === group.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20 bg-black/10"
                          onClick={() => setActiveMenuId(null)}
                          aria-hidden="true"
                        />
                        <div className="absolute right-0 top-10 z-30 w-40 glass-panel bg-[#0b101d] p-1.5 shadow-2xl border border-white/10 rounded-xl animate-scale-in">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingGroup(group);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium min-h-[44px]"
                          >
                            <Edit3 className="h-4 w-4 text-indigo-400" />
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
                            className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors font-medium min-h-[44px]"
                          >
                            <Trash2 className="h-4 w-4 text-rose-400" />
                            Delete
                          </button>
                        </div>
                      </>
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
                  className="w-full flex items-center justify-between text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-2.5 px-2 focus-ring rounded-xl min-h-[44px]"
                >
                  <span>Open Collection</span>
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
