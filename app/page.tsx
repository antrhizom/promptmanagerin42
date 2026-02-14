'use client';

import { useState } from 'react';
import { Prompt } from '@/lib/types';
import { usePrompts } from '@/lib/hooks/usePrompts';
import { useFilters } from '@/lib/hooks/useFilters';
import { useAuthContext } from '@/components/auth/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/layout/HeroSection';
import { UserLoginModal } from '@/components/auth/UserLoginModal';
import { PromptForm } from '@/components/prompt/PromptForm';
import { PromptList } from '@/components/prompt/PromptList';
import { FilterBar } from '@/components/filter/FilterBar';

export default function Home() {
  const { isAuthenticated, isAdmin, userCode, username } = useAuthContext();
  const {
    prompts, loading, error,
    addPrompt, updatePrompt, deletePrompt,
    ratePrompt, copyPrompt, addComment, requestDeletion
  } = usePrompts();
  const {
    filters, sortedPrompts, allTags,
    updateFilter, resetFilters, hasActiveFilters,
    totalCount, filteredCount
  } = useFilters(prompts);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const handleCreateClick = () => {
    setEditingPrompt(null);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = async (data: Partial<Prompt>) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, data);
    } else {
      await addPrompt(data as Omit<Prompt, 'id' | 'erstelltAm' | 'bewertungen' | 'nutzungsanzahl'>);
    }
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingPrompt(null);
  };

  const handleDelete = async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    const isOwn = isAdmin || prompt.erstelltVon === userCode || prompt.erstelltVon === `user_${userCode}`;

    if (isOwn) {
      if (confirm('Mochtest du diesen Prompt wirklich loschen?')) {
        await deletePrompt(promptId, userCode);
        alert('Prompt geloscht!');
      }
    } else {
      const deletionRequests = prompt.deletionRequests || [];
      if (deletionRequests.some(req => req.userCode === userCode)) {
        alert('Du hast bereits eine Loschanfrage fur diesen Prompt gestellt.');
        return;
      }

      const grund = window.prompt(
        'Warum mochtest du diesen Prompt melden?\n\n' +
        'Grunde konnen sein:\n' +
        '- Unangemessener Inhalt\n' +
        '- Fehlerhafte Information\n' +
        '- Spam\n' +
        '- Sonstiges'
      );

      if (!grund || !grund.trim()) return;

      await requestDeletion(promptId, {
        userCode,
        userName: username || 'Anonym',
        grund: grund.trim()
      });
      alert('Loschanfrage wurde gestellt! Der Admin wurde benachrichtigt.');
    }
  };

  const handleReport = (promptId: string) => {
    handleDelete(promptId);
  };

  const handleTagClick = (tag: string) => {
    updateFilter('suchbegriff', `#${tag}`);
    document.getElementById('prompts-liste')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFilterClick = (filterType: string, value: string) => {
    const filterMap: Record<string, string> = {
      plattform: 'filterPlattform',
      format: 'filterOutputFormat',
      anwendungsfall: 'filterAnwendungsfall',
      rolle: 'filterRolle',
      bildungsstufe: 'filterBildungsstufe',
      suchbegriff: 'suchbegriff',
      tag: 'filterTag',
    };
    const key = filterMap[filterType] || 'suchbegriff';
    updateFilter(key as keyof typeof filters, value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageLayout
      onLoginClick={() => setShowLoginModal(true)}
      onCreateClick={isAdmin ? handleCreateClick : undefined}
    >
      {showLoginModal && (
        <UserLoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {!isAuthenticated && !isAdmin && (
        <HeroSection onJoinClick={() => setShowLoginModal(true)} />
      )}

      {isAdmin && showCreateForm && (
        <PromptForm
          editingPrompt={editingPrompt}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      <FilterBar
        filters={filters}
        allTags={allTags}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      <PromptList
        prompts={sortedPrompts}
        loading={loading}
        error={error}
        onRate={ratePrompt}
        onCopy={copyPrompt}
        onEdit={isAdmin ? handleEdit : undefined}
        onDelete={isAdmin || isAuthenticated ? handleDelete : undefined}
        onComment={addComment}
        onReport={isAuthenticated ? handleReport : undefined}
        onTagClick={handleTagClick}
        onFilterClick={handleFilterClick}
      />
    </PageLayout>
  );
}
