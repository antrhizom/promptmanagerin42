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
import { trackAction } from '@/lib/analytics';

export default function Home() {
  const { isAuthenticated, isAdmin } = useAuthContext();
  const {
    prompts, loading, error,
    addPrompt, updatePrompt, deletePrompt,
    copyPrompt, ratePrompt, addComment,
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
    if (!isAdmin) return;
    if (confirm('Mochtest du diesen Prompt wirklich loschen?')) {
      await deletePrompt(promptId);
      alert('Prompt geloscht!');
    }
  };

  const handleTagClick = (tag: string) => {
    trackAction('tag');
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
    trackAction(`filter:${filterType}`);
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
        onCopy={copyPrompt}
        onRate={ratePrompt}
        onComment={addComment}
        onLoginRequired={() => setShowLoginModal(true)}
        onEdit={isAdmin ? handleEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
        onTagClick={handleTagClick}
        onFilterClick={handleFilterClick}
      />
    </PageLayout>
  );
}
