'use client';

import { useState } from 'react';
import { Kommentar } from '@/lib/types';
import { useAuthContext } from '@/components/auth/AuthContext';
import styles from './CommentSection.module.css';

interface CommentSectionProps {
  kommentare: Kommentar[];
  onAddComment: (text: string) => Promise<void>;
}

export function CommentSection({ kommentare, onAddComment }: CommentSectionProps) {
  const { isAuthenticated } = useAuthContext();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment(text);
      setText('');
    } catch {
      alert('Fehler beim Hinzufugen des Kommentars.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: { seconds?: number }) => {
    if (!timestamp?.seconds) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.section}>
      <button className={styles.toggle} onClick={() => setExpanded(!expanded)}>
        {expanded ? '&#9660;' : '&#9654;'} Kommentare ({kommentare.length})
      </button>

      {expanded && (
        <>
          {kommentare.length > 0 && (
            <div className={styles.list}>
              {kommentare.map((k) => (
                <div key={k.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{k.userName}</span>
                    <span className={styles.commentDate}>{formatDate(k.timestamp)}</span>
                  </div>
                  <div className={styles.commentText}>{k.text}</div>
                </div>
              ))}
            </div>
          )}

          {isAuthenticated ? (
            <div className={styles.form}>
              <textarea
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Schreibe einen Kommentar..."
              />
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={submitting || !text.trim()}
              >
                {submitting ? '...' : 'Senden'}
              </button>
            </div>
          ) : (
            <p className={styles.loginHint}>
              Melde dich an, um Kommentare zu schreiben.
            </p>
          )}
        </>
      )}
    </div>
  );
}
