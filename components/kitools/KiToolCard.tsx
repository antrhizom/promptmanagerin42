'use client';

import { KiTool } from '@/lib/types';
import { EMOJIS } from '@/lib/constants';
import { Badge } from '@/components/common/Badge';
import { trackAction } from '@/lib/analytics';
import styles from './KiToolCard.module.css';

interface KiToolCardProps {
  tool: KiTool;
  onLikeBeispiel: (beispielId: string, emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function KiToolCard({ tool, onLikeBeispiel, onEdit, onDelete }: KiToolCardProps) {
  const beispiele = tool.beispiele || [];
  const likes = tool.beispielBewertungen || {};

  return (
    <details className={styles.card}>
      <summary className={styles.summary}>
        <span className={styles.chevron} aria-hidden>▸</span>
        <span className={styles.summaryName}>{tool.name}</span>
        <span className={styles.summaryBadges}>
          {tool.typ && <Badge variant="role">{tool.typ}</Badge>}
          {tool.kategorie && <Badge variant="usecase">{tool.kategorie}</Badge>}
          {tool.plattform && <Badge variant="platform">{tool.plattform}</Badge>}
        </span>
        {beispiele.length > 0 && (
          <span className={styles.countPill}>{beispiele.length} Beispiel{beispiele.length === 1 ? '' : 'e'}</span>
        )}
      </summary>

      <div className={styles.body}>
        {tool.beschreibung && <p className={styles.description}>{tool.beschreibung}</p>}

        {(tool.tags || []).length > 0 && (
          <div className={styles.badgeRow}>
            {(tool.tags || []).map(t => <Badge key={t} variant="tag">#{t}</Badge>)}
          </div>
        )}

        {tool.link && (
          <div>
            <a
              className={styles.openBtn}
              href={tool.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAction('open-kitool')}
            >
              ↗ Tool öffnen
            </a>
          </div>
        )}

        {/* Konkrete Beispiele — jedes mit eigener Bewertung */}
        {beispiele.length > 0 && (
          <div className={styles.beispiele}>
            <div className={styles.beispieleTitle}>Konkrete Beispiele</div>
            {beispiele.map((b, i) => {
              const bId = b.id || String(i);
              const bw = likes[bId] || {};
              return (
                <div key={bId} className={styles.beispiel}>
                  <div className={styles.beispielTitel}>{b.titel}</div>
                  {b.beschreibung && <div className={styles.beispielText}>{b.beschreibung}</div>}
                  {b.autorEmail && <div className={styles.beispielAutor}>eingereicht von {b.autorEmail}</div>}
                  {b.promptText && (
                    <details className={styles.promptBox}>
                      <summary className={styles.promptBoxSummary}>Prompt anzeigen</summary>
                      <pre className={styles.promptPre}>{b.promptText}</pre>
                    </details>
                  )}
                  {b.link && (
                    <a
                      href={b.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.beispielLink}
                      onClick={() => trackAction('open-kitool-beispiel')}
                    >
                      ↗ Beispiel öffnen
                    </a>
                  )}
                  <div className={styles.reactions}>
                    {EMOJIS.map(emoji => (
                      <button key={emoji} className={styles.reactionBtn} onClick={() => onLikeBeispiel(bId, emoji)} title="Liken">
                        {emoji}
                        {(bw[emoji] || 0) > 0 && <span className={styles.reactionCount}>{bw[emoji]}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {beispiele.length === 0 && (
          <p className={styles.keineBeispiele}>Noch keine Beispiele hinterlegt.</p>
        )}

        {(onEdit || onDelete) && (
          <div className={styles.adminActions}>
            {onEdit && <button className={styles.editBtn} onClick={onEdit}>Bearbeiten</button>}
            {onDelete && <button className={styles.deleteBtn} onClick={onDelete}>Loschen</button>}
          </div>
        )}
      </div>
    </details>
  );
}
