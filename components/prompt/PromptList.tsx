'use client';

import { Prompt } from '@/lib/types';
import { PromptCard } from './PromptCard';
import { useAuthContext } from '@/components/auth/AuthContext';
import styles from './PromptList.module.css';

interface PromptListProps {
  prompts: Prompt[];
  loading: boolean;
  error?: string | null;
  onRate: (promptId: string, emoji: string) => Promise<void>;
  onCopy: (promptId: string) => Promise<void>;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
  onComment: (promptId: string, kommentar: { userCode: string; userName: string; text: string }) => Promise<void>;
  onReport?: (promptId: string) => void;
  onTagClick?: (tag: string) => void;
  onFilterClick?: (filterType: string, value: string) => void;
}

export function PromptList({
  prompts, loading, error, onRate, onCopy,
  onEdit, onDelete, onComment, onReport, onTagClick, onFilterClick
}: PromptListProps) {
  const { userCode, username } = useAuthContext();

  if (error) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>⚠️ Fehler beim Laden</div>
        <div className={styles.emptyText}>{error}</div>
        <div className={styles.emptyText} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
          Bitte Seite neu laden oder später erneut versuchen.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.loading}>Prompts werden geladen...</div>;
  }

  if (prompts.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>Keine Prompts gefunden</div>
        <div className={styles.emptyText}>Versuche andere Suchbegriffe oder Filter.</div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {prompts.map(prompt => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onRate={(emoji) => onRate(prompt.id, emoji)}
          onCopy={() => onCopy(prompt.id)}
          onEdit={onEdit ? () => onEdit(prompt) : undefined}
          onDelete={onDelete ? () => onDelete(prompt.id) : undefined}
          onComment={(text) => onComment(prompt.id, { userCode, userName: username, text })}
          onReport={onReport ? () => onReport(prompt.id) : undefined}
          onTagClick={onTagClick}
          onFilterClick={onFilterClick}
        />
      ))}
    </div>
  );
}
