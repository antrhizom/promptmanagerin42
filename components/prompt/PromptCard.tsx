'use client';

import { Prompt } from '@/lib/types';
import { EMOJIS } from '@/lib/constants';
import { Badge } from '@/components/common/Badge';
import { CommentSection } from './CommentSection';
import { useAuthContext } from '@/components/auth/AuthContext';
import styles from './PromptCard.module.css';

interface PromptCardProps {
  prompt: Prompt;
  onRate: (emoji: string) => void;
  onCopy: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onComment: (text: string) => Promise<void>;
  onReport?: () => void;
  onTagClick?: (tag: string) => void;
  onFilterClick?: (filterType: string, value: string) => void;
}

export function PromptCard({
  prompt, onRate, onCopy, onEdit, onDelete,
  onComment, onReport, onTagClick, onFilterClick
}: PromptCardProps) {
  const { isAdmin, isAuthenticated, userCode } = useAuthContext();
  const canEdit = isAdmin || (isAuthenticated && (prompt.erstelltVon === userCode || prompt.erstelltVon === `user_${userCode}`));
  const canDelete = isAdmin || (isAuthenticated && (prompt.erstelltVon === userCode || prompt.erstelltVon === `user_${userCode}`));

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return '';
    if (typeof timestamp === 'object' && 'seconds' in (timestamp as Record<string, unknown>)) {
      const ts = timestamp as { seconds: number };
      return new Date(ts.seconds * 1000).toLocaleDateString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    }
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('de-CH', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        });
      }
    }
    return '';
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(prompt.promptText);
    onCopy();
  };

  const handleDownload = () => {
    const content = `Titel: ${prompt.titel}\n\n${prompt.promptText}${prompt.zusatzinstruktionen ? `\n\nZusatzinstruktionen:\n${prompt.zusatzinstruktionen}` : ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.titel.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onCopy();
  };

  const hasProcess = prompt.problemausgangslage || prompt.loesungsbeschreibung ||
    prompt.schwierigkeiten || prompt.endproduktLink;

  return (
    <article className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>{prompt.titel}</h3>
          {prompt.beschreibung && (
            <p className={styles.description}>{prompt.beschreibung}</p>
          )}
        </div>
        {(canEdit || canDelete) && (
          <div className={styles.actions}>
            {canEdit && onEdit && (
              <button className={styles.editBtn} onClick={onEdit}>Bearbeiten</button>
            )}
            {canDelete && onDelete && (
              <button className={styles.deleteBtn} onClick={onDelete}>Loschen</button>
            )}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className={styles.meta}>
        {prompt.erstelltVonRolle && (
          typeof prompt.erstelltVonRolle === 'string' && prompt.erstelltVonRolle.includes(',')
            ? prompt.erstelltVonRolle.split(',').map(r => r.trim()).filter(Boolean).map(r => (
              <Badge key={r} variant="role" onClick={() => onFilterClick?.('rolle', r)}>{r}</Badge>
            ))
            : <Badge variant="role" onClick={() => onFilterClick?.('rolle', prompt.erstelltVonRolle as string)}>{prompt.erstelltVonRolle}</Badge>
        )}
        {prompt.bildungsstufe && (
          typeof prompt.bildungsstufe === 'string' && prompt.bildungsstufe.includes(',')
            ? prompt.bildungsstufe.split(',').map(b => b.trim()).filter(Boolean).map(b => (
              <Badge key={b} variant="level" onClick={() => onFilterClick?.('bildungsstufe', b)}>{b}</Badge>
            ))
            : <Badge variant="level" onClick={() => onFilterClick?.('bildungsstufe', prompt.bildungsstufe as string)}>{prompt.bildungsstufe}</Badge>
        )}
        <span className={styles.metaText}>{formatDate(prompt.erstelltAm)}</span>
      </div>

      {/* Platforms & Models */}
      {Object.keys(prompt.plattformenUndModelle || {}).length > 0 && (
        <div className={styles.badgeSection}>
          {Object.entries(prompt.plattformenUndModelle).map(([plattform, modelle]) => (
            <div key={plattform} className={styles.badgeGroup}>
              <Badge variant="platform" onClick={() => onFilterClick?.('plattform', plattform)}>{plattform}</Badge>
              {(modelle || []).map(m => (
                <Badge key={m} variant="model" onClick={() => onFilterClick?.('suchbegriff', m)}>{m}</Badge>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Functions */}
      {prompt.plattformFunktionen && Object.keys(prompt.plattformFunktionen).length > 0 && (
        <div className={styles.badgeSection}>
          <span className={styles.badgeGroupLabel}>Funktionen:</span>
          {Object.values(prompt.plattformFunktionen).flat().map(f => (
            <Badge key={f} variant="function">{f}</Badge>
          ))}
        </div>
      )}

      {/* Prompt text */}
      <div className={styles.promptBlock}>
        <div className={styles.promptText}>{prompt.promptText}</div>
      </div>

      {/* Additional instructions */}
      {prompt.zusatzinstruktionen && (
        <div className={styles.zusatzBlock}>
          <div className={styles.zusatzLabel}>Zusatzinstruktionen</div>
          <div className={styles.zusatzText}>{prompt.zusatzinstruktionen}</div>
        </div>
      )}

      {/* Output formats, use cases, tags */}
      <div className={styles.badgeSection}>
        {(prompt.outputFormate || []).map(f => (
          <Badge key={f} variant="format" onClick={() => onFilterClick?.('format', f)}>{f}</Badge>
        ))}
        {(prompt.anwendungsfaelle || []).map(a => (
          <Badge key={a} variant="usecase" onClick={() => onFilterClick?.('anwendungsfall', a)}>{a}</Badge>
        ))}
        {(prompt.tags || []).map(t => (
          <Badge key={t} variant="tag" onClick={() => onTagClick?.(t)}>#{t}</Badge>
        ))}
      </div>

      {/* Links */}
      {(prompt.link1 || prompt.link2) && (
        <div className={styles.linksSection}>
          {prompt.link1 && (
            <a href={prompt.link1} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
              ↗ Link 1
            </a>
          )}
          {prompt.link2 && (
            <a href={prompt.link2} target="_blank" rel="noopener noreferrer" className={styles.linkItem}>
              ↗ Link 2
            </a>
          )}
        </div>
      )}

      {/* Process description */}
      {hasProcess && (
        <div className={styles.processSection}>
          <div className={styles.processTitle}>Problemsituation / Kontextualisierung</div>
          {prompt.problemausgangslage && (
            <div className={styles.processItem}>
              <div className={styles.processLabel}>Problemausgangslage</div>
              <div className={styles.processText}>{prompt.problemausgangslage}</div>
            </div>
          )}
          {prompt.loesungsbeschreibung && (
            <div className={styles.processItem}>
              <div className={styles.processLabel}>Losungsbeschreibung</div>
              <div className={styles.processText}>{prompt.loesungsbeschreibung}</div>
            </div>
          )}
          {prompt.schwierigkeiten && (
            <div className={styles.processItem}>
              <div className={styles.processLabel}>Schwierigkeiten</div>
              <div className={styles.processText}>{prompt.schwierigkeiten}</div>
            </div>
          )}
          {prompt.endproduktLink && (
            <div className={styles.processItem}>
              <div className={styles.processLabel}>Endprodukt</div>
              <a href={prompt.endproduktLink} target="_blank" rel="noopener noreferrer" className={styles.processLink}>
                ↗ {prompt.endproduktLink}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className={styles.actionBar}>
        <div className={styles.reactions}>
          {EMOJIS.map(emoji => (
            <button key={emoji} className={styles.reactionBtn} onClick={() => onRate(emoji)}>
              {emoji}
              {(prompt.bewertungen?.[emoji] || 0) > 0 && (
                <span className={styles.reactionCount}>{prompt.bewertungen[emoji]}</span>
              )}
            </button>
          ))}
          <span className={styles.usageCount}>
            📋 {prompt.nutzungsanzahl || 0}x kopiert
          </span>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.copyBtn} onClick={handleCopyToClipboard}>
            Kopieren
          </button>
          <button className={styles.downloadBtn} onClick={handleDownload}>
            Download
          </button>
          {isAuthenticated && !canDelete && onReport && (
            <button className={styles.reportBtn} onClick={onReport}>
              Melden
            </button>
          )}
        </div>
      </div>

      {/* Comments */}
      <CommentSection
        kommentare={prompt.kommentare || []}
        onAddComment={onComment}
      />
    </article>
  );
}
