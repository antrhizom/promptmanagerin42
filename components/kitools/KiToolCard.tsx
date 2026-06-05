'use client';

import { KiTool } from '@/lib/types';
import { EMOJIS } from '@/lib/constants';
import { Badge } from '@/components/common/Badge';
import { trackAction } from '@/lib/analytics';
import styles from './KiToolCard.module.css';

interface KiToolCardProps {
  tool: KiTool;
  onLike: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onFilterClick?: (type: string, value: string) => void;
}

export function KiToolCard({ tool, onLike, onEdit, onDelete, onFilterClick }: KiToolCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{tool.name}</h3>
        {(onEdit || onDelete) && (
          <div className={styles.actions}>
            {onEdit && <button className={styles.editBtn} onClick={onEdit}>Bearbeiten</button>}
            {onDelete && <button className={styles.deleteBtn} onClick={onDelete}>Loschen</button>}
          </div>
        )}
      </div>

      <div className={styles.badgeRow}>
        {tool.typ && (
          <Badge variant="role" onClick={() => onFilterClick?.('typ', tool.typ)}>{tool.typ}</Badge>
        )}
        {tool.kategorie && (
          <Badge variant="usecase" onClick={() => onFilterClick?.('kategorie', tool.kategorie as string)}>{tool.kategorie}</Badge>
        )}
        {tool.plattform && (
          <Badge variant="platform" onClick={() => onFilterClick?.('plattform', tool.plattform as string)}>{tool.plattform}</Badge>
        )}
      </div>

      {tool.beschreibung && <p className={styles.description}>{tool.beschreibung}</p>}

      {(tool.tags || []).length > 0 && (
        <div className={styles.badgeRow}>
          {(tool.tags || []).map(t => (
            <Badge key={t} variant="tag" onClick={() => onFilterClick?.('tag', t)}>#{t}</Badge>
          ))}
        </div>
      )}

      <div className={styles.actionBar}>
        <div className={styles.reactions}>
          {EMOJIS.map(emoji => (
            <button key={emoji} className={styles.reactionBtn} onClick={() => onLike(emoji)} title="Liken">
              {emoji}
              {(tool.bewertungen?.[emoji] || 0) > 0 && (
                <span className={styles.reactionCount}>{tool.bewertungen[emoji]}</span>
              )}
            </button>
          ))}
        </div>
        {tool.link && (
          <a
            className={styles.openBtn}
            href={tool.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAction('open-kitool')}
          >
            ↗ Öffnen
          </a>
        )}
      </div>
    </article>
  );
}
