'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Prompt } from '@/lib/types';
import { calculateStats } from '@/lib/utils/statsCalculations';
import { useAuthContext } from '@/components/auth/AuthContext';
import styles from './StatsDashboard.module.css';

interface StatsDashboardProps {
  prompts: Prompt[];
  loading: boolean;
}

interface AnalyticsSummary {
  visitors: number;
  visitEvents: number;
  totalFunctionClicks: number;
  totalActions: number;
  functions: { name: string; plattform: string; count: number }[];
  functionsByPlattform: { plattform: string; count: number }[];
  actions: { name: string; count: number }[];
}

function getRankClass(index: number) {
  if (index === 0) return styles.rankNumberGold;
  if (index === 1) return styles.rankNumberSilver;
  if (index === 2) return styles.rankNumberBronze;
  return styles.rankNumberDefault;
}

export function StatsDashboard({ prompts, loading }: StatsDashboardProps) {
  const { getIdToken } = useAuthContext();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Besucher- & Funktions-Auswertung (Admin-only, mit ID-Token).
  useEffect(() => {
    async function loadAnalytics() {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        setAnalytics(await res.json());
      } catch (error) {
        console.error('Fehler beim Laden der Analytics:', error);
      }
    }
    loadAnalytics();
  }, [getIdToken]);

  const stats = useMemo(() => calculateStats(prompts, {}), [prompts]);

  if (loading) {
    return <div className={styles.loading}>Dashboard wird geladen...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <Link href="/" className={styles.backLink}>&larr; Zurück zu den Prompts</Link>

      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Übersicht über alle Aktivitäten der Prompt Managerin</p>

      {/* Besucher & Funktionen (anonymes Tracking) */}
      <div className={styles.sectionPlatform}>
        <h2 className={styles.sectionTitle}>Besucher &amp; Funktionen (ohne Login)</h2>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCardBlue}>
            <div className={styles.overviewValue}>{analytics?.visitors ?? '–'}</div>
            <div className={styles.overviewLabel}>Besucher (Sessions)</div>
          </div>
          <div className={styles.overviewCardGreen}>
            <div className={styles.overviewValue}>{analytics?.visitEvents ?? '–'}</div>
            <div className={styles.overviewLabel}>Seitenaufrufe</div>
          </div>
          <div className={styles.overviewCardAmber}>
            <div className={styles.overviewValue}>{analytics?.totalFunctionClicks ?? '–'}</div>
            <div className={styles.overviewLabel}>KI-Funktionen angewählt</div>
          </div>
          <div className={styles.overviewCardPurple}>
            <div className={styles.overviewValue}>{analytics?.totalActions ?? '–'}</div>
            <div className={styles.overviewLabel}>Seiten-Aktionen</div>
          </div>
        </div>

        {analytics && analytics.functions.length > 0 && (
          <>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: '1.25rem' }}>
              Angewählte KI-Plattform-Funktionen
            </h3>
            <div className={styles.statGrid}>
              {analytics.functions.map(f => (
                <div key={`${f.plattform}-${f.name}`} className={styles.statItem}>
                  <span className={styles.statItemName}>
                    {f.name}{f.plattform ? ` · ${f.plattform}` : ''}
                  </span>
                  <span className={styles.statItemCount}>{f.count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {analytics && analytics.actions.length > 0 && (
          <>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: '1.25rem' }}>
              Seiten-Aktionen
            </h3>
            <div className={styles.statGrid}>
              {analytics.actions.map(a => (
                <div key={a.name} className={styles.statItem}>
                  <span className={styles.statItemName}>{a.name}</span>
                  <span className={styles.statItemCount}>{a.count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!analytics && (
          <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
            Besucher- und Funktionsdaten werden geladen … (erscheinen, sobald die Seite genutzt wird)
          </p>
        )}
      </div>

      {/* Overview - 5 Karten inkl. Kommentare */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCardBlue}>
          <div className={styles.overviewValue}>{stats.totalPrompts}</div>
          <div className={styles.overviewLabel}>Prompts gesamt</div>
        </div>
        <div className={styles.overviewCardGreen}>
          <div className={styles.overviewValue}>{stats.totalUsers}</div>
          <div className={styles.overviewLabel}>Nutzer</div>
        </div>
        <div className={styles.overviewCardAmber}>
          <div className={styles.overviewValue}>{stats.totalRatings}</div>
          <div className={styles.overviewLabel}>Bewertungen</div>
        </div>
        <div className={styles.overviewCardTeal}>
          <div className={styles.overviewValue}>{stats.totalComments}</div>
          <div className={styles.overviewLabel}>Kommentare</div>
        </div>
        <div className={styles.overviewCardPurple}>
          <div className={styles.overviewValue}>{stats.totalUsage}</div>
          <div className={styles.overviewLabel}>Kopien</div>
        </div>
      </div>

      {/* Per format - klickbar */}
      <div className={styles.sectionFormat}>
        <h2 className={styles.sectionTitle}>Nach Output-Format</h2>
        <div className={styles.statGrid}>
          {stats.promptsPerFormat.filter(s => s.count > 0).map(s => (
            <Link key={s.name} href={`/?format=${encodeURIComponent(s.name)}`} className={styles.statItem}>
              <span className={styles.statItemName}>{s.name}</span>
              <span className={styles.statItemCount}>{s.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Per platform - klickbar */}
      <div className={styles.sectionPlatform}>
        <h2 className={styles.sectionTitle}>Nach Plattform</h2>
        <div className={styles.statGrid}>
          {stats.promptsPerPlatform.map(s => (
            <Link key={s.name} href={`/?plattform=${encodeURIComponent(s.name)}`} className={styles.statItem}>
              <span className={styles.statItemName}>{s.name}</span>
              <span className={styles.statItemCount}>{s.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top models - klickbar (sucht nach Modellname) */}
      <div className={styles.sectionModels}>
        <h2 className={styles.sectionTitle}>Top 10 Modelle</h2>
        <div className={styles.rankList}>
          {stats.topModels.map((s, i) => (
            <Link key={s.name} href={`/?suche=${encodeURIComponent(s.name)}`} className={styles.rankItemLink}>
              <span className={getRankClass(i)}>{i + 1}</span>
              <span className={styles.rankName}>{s.name}</span>
              <span className={styles.rankValue}>{s.count} Prompts</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Per use case - klickbar */}
      <div className={styles.sectionUseCase}>
        <h2 className={styles.sectionTitle}>Nach Anwendungsfall</h2>
        <div className={styles.statGrid}>
          {stats.promptsPerUseCase.filter(s => s.count > 0).map(s => (
            <Link key={s.name} href={`/?anwendungsfall=${encodeURIComponent(s.name)}`} className={styles.statItem}>
              <span className={styles.statItemName}>{s.name}</span>
              <span className={styles.statItemCount}>{s.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Per role - klickbar */}
      <div className={styles.sectionRole}>
        <h2 className={styles.sectionTitle}>Nach Rolle</h2>
        <div className={styles.statGrid}>
          {stats.promptsPerRole.filter(s => s.count > 0).map(s => (
            <Link key={s.name} href={`/?rolle=${encodeURIComponent(s.name)}`} className={styles.statItem}>
              <span className={styles.statItemName}>{s.name}</span>
              <span className={styles.statItemCount}>{s.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Per education level - klickbar */}
      <div className={styles.sectionLevel}>
        <h2 className={styles.sectionTitle}>Nach Bildungsstufe</h2>
        <div className={styles.statGrid}>
          {stats.promptsPerLevel.filter(s => s.count > 0).map(s => (
            <Link key={s.name} href={`/?suche=${encodeURIComponent(s.name)}`} className={styles.statItem}>
              <span className={styles.statItemName}>{s.name}</span>
              <span className={styles.statItemCount}>{s.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top tags - klickbar */}
      <div className={styles.sectionTags}>
        <h2 className={styles.sectionTitle}>Top 15 Hashtags</h2>
        <div className={styles.statGrid}>
          {stats.topTags.map(s => (
            <Link key={s.name} href={`/?suche=${encodeURIComponent('#' + s.name)}`} className={styles.statItem}>
              <span className={styles.statItemName}>#{s.name}</span>
              <span className={styles.statItemCount}>{s.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top rated - klickbar (sucht nach Titel) */}
      <div className={styles.sectionTopRated}>
        <h2 className={styles.sectionTitle}>Beliebteste Prompts</h2>
        <div className={styles.rankList}>
          {stats.topRated.map((s, i) => (
            <Link key={s.id} href={`/?suche=${encodeURIComponent(s.titel)}`} className={styles.rankItemLink}>
              <span className={getRankClass(i)}>{i + 1}</span>
              <span className={styles.rankName}>{s.titel}</span>
              <span className={styles.rankValue}>{s.rating} Bewertungen</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top used - klickbar (sucht nach Titel) */}
      <div className={styles.sectionTopUsed}>
        <h2 className={styles.sectionTitle}>Meistgenutzte Prompts</h2>
        <div className={styles.rankList}>
          {stats.topUsed.map((s, i) => (
            <Link key={s.id} href={`/?suche=${encodeURIComponent(s.titel)}`} className={styles.rankItemLink}>
              <span className={getRankClass(i)}>{i + 1}</span>
              <span className={styles.rankName}>{s.titel}</span>
              <span className={styles.rankValue}>{s.usage}x kopiert</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top users - klickbar (filtert nach Nutzername) */}
      <div className={styles.sectionTopUsers}>
        <h2 className={styles.sectionTitle}>Aktivste Nutzer</h2>
        <div className={styles.rankList}>
          {stats.topUsers.map((s, i) => (
            <Link key={s.code} href={`/?suche=${encodeURIComponent(s.displayName)}`} className={styles.userItemLink}>
              <span className={styles.userRow}>
                <span className={getRankClass(i)}>{i + 1}</span>
                <span className={styles.rankName}>{s.displayName}</span>
              </span>
              <span className={styles.userDetails}>
                {s.bewertungen > 0 && (
                  <span className={styles.badgeBewertungen}>
                    ⭐ {s.bewertungen} Likes
                  </span>
                )}
                {s.kommentare > 0 && (
                  <span className={styles.badgeKommentare}>
                    💬 {s.kommentare} Kommentare
                  </span>
                )}
                {s.kopien > 0 && (
                  <span className={styles.badgeKopien}>
                    📋 {s.kopien} Kopien
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
