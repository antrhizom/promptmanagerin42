'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Prompt } from '@/lib/types';
import { calculateStats } from '@/lib/utils/statsCalculations';
import { DASHBOARD_ZEITRAEUME, ZeitraumKey } from '@/lib/constants';
import { useAuthContext } from '@/components/auth/AuthContext';
import { markiereAlsIntern } from '@/lib/analytics';
import { SubmissionsReview } from '@/components/submit/SubmissionsReview';
import { WuenscheReview } from '@/components/wish/WuenscheReview';
import { UsageTimeline, ZeitraumAuswahl, TimelinePoint } from './UsageTimeline';
import styles from './StatsDashboard.module.css';

interface StatsDashboardProps {
  prompts: Prompt[];
  loading: boolean;
}

interface PageStat {
  name: string;
  count: number;
  visitors: number;
}

// Kennzahlen und Ranglisten fuer einen Zeitraum (oder gesamt).
interface Kennzahlen {
  visitors: number;
  visitEvents: number;
  totalFunctionClicks: number;
  totalActions: number;
  functions: { name: string; plattform: string; count: number }[];
  functionsByPlattform: { plattform: string; count: number }[];
  actions: { name: string; count: number }[];
  pages?: PageStat[];
}

interface AnalyticsSummary extends Kennzahlen {
  // Dieselben Kennzahlen je Zeitraum (Schluessel wie DASHBOARD_ZEITRAEUME).
  zeitraeume?: Partial<Record<ZeitraumKey, Kennzahlen>>;
  timeline?: TimelinePoint[];
  // Anzahl ausgeblendeter Browser/Tabs der Redaktion.
  interneBrowser?: number;
}

// Klarnamen fuer die Seitenpfade.
const PAGE_LABELS: Record<string, string> = {
  '/': 'Startseite (Prompts)',
  '/ki-tools': 'Gen Biblio',
  '/output': 'Output',
  '/p-flow': 'P-Flow',
  '/datenschutz': 'Datenschutz',
  '/admin': 'Dashboard',
  '/admin-login': 'Admin-Login',
  unbekannt: 'Ohne Seitenangabe (vor der Umstellung)',
};

// Klarnamen fuer die getrackten Klick-Aktionen.
const ACTION_LABELS: Record<string, string> = {
  'prompt-kopiert': 'Prompt kopiert',
  'prompt-heruntergeladen': 'Prompt heruntergeladen',
  'prompt-geliked': 'Prompt geliked',
  'prompt-link': 'Link im Prompt geoeffnet',
  'endprodukt-link': 'Endprodukt geoeffnet',
  download: 'Prompt heruntergeladen (alt)',
  tag: 'Hashtag angeklickt',
  'open-tipps': 'Tipps-Fenster geoeffnet',
  'open-kitool': 'Gen-Biblio-Tool geoeffnet',
  'open-kitool-beispiel': 'Beispiel eines Tools geoeffnet',
  'open-wunsch': 'Wunsch-Formular geoeffnet',
  'wunsch-gesendet': 'Wunsch abgeschickt',
  'output-vorschau': 'Output angesehen (Vorschau)',
  'output-neuer-tab': 'Output in neuem Tab geoeffnet',
  'output-download': 'Output heruntergeladen',
  'output-code-angezeigt': 'Output-Code angezeigt',
  'output-code-kopiert': 'Output-Code kopiert',
  'output-prompt-kopiert': 'Anpass-Prompt kopiert',
  'open-output-einreichen': 'Formular «Output vorschlagen» geoeffnet',
};

// Erklaerungen, die beim Hovern als Tooltip erscheinen.
const ACTION_HINTS: Record<string, string> = {
  'prompt-kopiert': 'Jemand hat den Prompt-Text ueber den Knopf «Kopieren» in die Zwischenablage genommen. Bester Hinweis darauf, dass ein Prompt wirklich eingesetzt wurde.',
  'prompt-heruntergeladen': 'Der Prompt wurde ueber «Download» als Textdatei gespeichert.',
  'prompt-geliked': 'Auf ein Emoji unter einem Prompt geklickt. Moeglich ohne Login.',
  'prompt-link': 'Einer der beiden weiterfuehrenden Links in einer Prompt-Karte wurde geoeffnet.',
  'endprodukt-link': 'Der Link zum Endprodukt in der Prozessbeschreibung wurde geoeffnet.',
  download: 'Alte Zaehlweise des Downloads, vor der Umbenennung erfasst.',
  tag: 'Auf einen Hashtag geklickt, wodurch die Liste nach diesem Hashtag gefiltert wurde.',
  'open-tipps': 'Der schwebende Knopf mit Prompting-Tipps und Unterrichts-Szenarien wurde geoeffnet.',
  'open-kitool': 'Ein Werkzeug in der Gen Biblio wurde angeklickt und in einem neuen Tab geoeffnet.',
  'open-kitool-beispiel': 'Ein Beispiel innerhalb eines Werkzeugs der Gen Biblio wurde geoeffnet.',
  'open-wunsch': 'Das Formular «Gestalte mit» wurde geoeffnet.',
  'wunsch-gesendet': 'Ein Gestaltungs-Wunsch wurde tatsaechlich abgeschickt.',
  'output-vorschau': 'Im Register Output wurde die Vorschau eines Outputs aufgeklappt.',
  'output-neuer-tab': 'Ein Output wurde in einem eigenen Tab geoeffnet.',
  'output-download': 'Die Datei eines Outputs wurde heruntergeladen. Bester Hinweis darauf, dass ein Output weiterverwendet wird.',
  'output-code-angezeigt': 'Der Quellcode eines Outputs wurde aufgeklappt.',
  'output-code-kopiert': 'Der Quellcode eines Outputs wurde in die Zwischenablage kopiert.',
  'output-prompt-kopiert': 'Der Startprompt zum Anpassen eines Outputs per Chat-KI oder KI-Agent wurde kopiert.',
  'open-output-einreichen': 'Im Register Output wurde das Formular zum Hochladen eines eigenen Outputs geoeffnet.',
};

function actionHint(name: string): string {
  if (ACTION_HINTS[name]) return ACTION_HINTS[name];
  if (name.startsWith('filter:')) {
    return `Ein Filter wurde gesetzt, hier nach ${name.slice(7)}. Gezaehlt wird jeder Klick auf ein Badge oder eine Auswahl im Filterbereich.`;
  }
  if (name.startsWith('pflow:')) {
    return 'Ein Schritt im P-Flow wurde gewaehlt. Die Kette zeigt, welchen Weg die Person durch das Flussdiagramm genommen hat.';
  }
  return 'Klick-Aktion auf der Seite.';
}

function actionLabel(name: string): string {
  if (ACTION_LABELS[name]) return ACTION_LABELS[name];
  if (name.startsWith('filter:')) return `Filter gesetzt: ${name.slice(7)}`;
  if (name.startsWith('pflow:')) return `P-Flow: ${name.slice(6).replace(/:/g, ' / ')}`;
  return name;
}

function pageLabel(name: string): string {
  return PAGE_LABELS[name] || name;
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
  const [zeitraum, setZeitraum] = useState<ZeitraumKey>('30');

  // Wer das Dashboard oeffnet, gehoert zur Redaktion: Dieser Browser wird in der
  // Besucher-Auswertung ausgeblendet und sendet ab jetzt keine Ereignisse mehr.
  useEffect(() => {
    markiereAlsIntern();
  }, []);

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

  // Alle Kennzahlen passend zum gewaehlten Zeitraum. Faellt auf die Gesamtzahlen zurueck,
  // falls der Server (noch) keine Aufteilung liefert.
  const imZeitraum: Kennzahlen | null = analytics?.zeitraeume?.[zeitraum] ?? analytics;
  const pagesImZeitraum = imZeitraum?.pages ?? [];
  const zeitraumTage = DASHBOARD_ZEITRAEUME.find(z => z.key === zeitraum)?.days ?? null;
  const zeitraumText = zeitraumTage ? `letzte ${zeitraumTage} Tage` : 'gesamter Zeitraum';
  const zeitraumZusatz = (
    <span style={{ fontWeight: 400, color: 'var(--color-gray-500, #6b7280)' }}> · {zeitraumText}</span>
  );

  if (loading) {
    return <div className={styles.loading}>Dashboard wird geladen...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <Link href="/" className={styles.backLink}>&larr; Zurück zu den Prompts</Link>

      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Übersicht über alle Aktivitäten der Promptmanagerin</p>

      {/* Offene Community-Einreichungen zur Freischaltung */}
      <SubmissionsReview />

      {/* Gestaltungs-Wünsche */}
      <WuenscheReview />

      {/* Besucher & Funktionen (anonymes Tracking) */}
      <div className={styles.sectionPlatform}>
        {/* Kopf mit Zeitraum-Auswahl: gilt fuer Kennzahlen, Verlauf und alle Listen */}
        <div
          style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: '0.5rem 1rem', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <h2 className={styles.sectionTitle} style={{ margin: 0, padding: 0, border: 0 }}>
            Besucher &amp; Klicks (ohne Login){zeitraumZusatz}
          </h2>
          <ZeitraumAuswahl range={zeitraum} onRangeChange={setZeitraum} />
        </div>
        <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>
          Anonym gezaehlt: Besucher sind verschiedene Browser, Seitenaufrufe zaehlen jede
          Seite einmal pro Browser und Tag, Funktions-Badges sind die Klicks auf die Badges
          &laquo;Funktionen&raquo; in einem Prompt (z.&nbsp;B. Web-Browsing, Bildanalyse),
          und Klick-Aktionen sind alle uebrigen Interaktionen wie Kopieren, Filtern oder
          Hashtags. Besuche der Redaktion sind ausgeblendet
          {analytics?.interneBrowser ? ` (${analytics.interneBrowser} Browser bzw. Sitzungen)` : ''}.
        </p>
        <div className={styles.overviewGrid}>
          <div
            className={styles.overviewCardBlue}
            title="Anzahl verschiedener Browser. Jeder Browser bekommt eine zufaellige, anonyme Nummer, die erhalten bleibt, bis die Website-Daten geloescht werden. Dieselbe Person an zwei Tagen zaehlt also einmal, am Handy und am Laptop zweimal. Aeltere Daten (vor der Umstellung) wurden pro Tab gezaehlt."
          >
            <div className={styles.overviewValue}>{imZeitraum?.visitors ?? '–'}</div>
            <div className={styles.overviewLabel}>Besucher (Browser)</div>
          </div>
          <div
            className={styles.overviewCardGreen}
            title="Aufgerufene Seiten insgesamt, also Startseite, Gen Biblio, Output, P-Flow und Datenschutz zusammen. Jede Seite zaehlt hoechstens einmal pro Browser und Tag, damit Neuladen und Hin- und Herwechseln die Zahl nicht aufblaehen."
          >
            <div className={styles.overviewValue}>{imZeitraum?.visitEvents ?? '–'}</div>
            <div className={styles.overviewLabel}>Seitenaufrufe</div>
          </div>
          <div
            className={styles.overviewCardAmber}
            title="Klicks auf die Badges unter «Funktionen» in einer Prompt-Karte, zum Beispiel Web-Browsing oder Bildanalyse. Diese Badges loesen nichts aus, sie zeigen nur, welche Faehigkeit der Prompt braucht. Es ist NICHT die Nutzung einer KI."
          >
            <div className={styles.overviewValue}>{imZeitraum?.totalFunctionClicks ?? '–'}</div>
            <div className={styles.overviewLabel}>Funktions-Badges geklickt</div>
          </div>
          <div
            className={styles.overviewCardPurple}
            title="Alle uebrigen Interaktionen zusammen: Prompt kopieren, herunterladen, liken, Links oeffnen, filtern, Hashtags anklicken, Tipps oeffnen, P-Flow durchlaufen."
          >
            <div className={styles.overviewValue}>{imZeitraum?.totalActions ?? '–'}</div>
            <div className={styles.overviewLabel}>Klick-Aktionen</div>
          </div>
        </div>

        {/* Zeitlicher Verlauf der Nutzung */}
        <UsageTimeline timeline={analytics?.timeline} range={zeitraum} />

        {analytics && (analytics.pages?.length || 0) > 0 && (
          <>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: '1.25rem' }}>
              Aufgerufene Seiten{zeitraumZusatz}
            </h3>
            {pagesImZeitraum.length === 0 && (
              <p className={styles.subtitle} style={{ marginTop: 0 }}>
                Im gewählten Zeitraum wurden keine Seiten aufgerufen.
              </p>
            )}
            <div className={styles.statGrid}>
              {pagesImZeitraum.map(p => (
                <div
                  key={p.name}
                  className={styles.statItem}
                  title={`${pageLabel(p.name)} (${p.name}): ${p.count} Aufrufe (hoechstens einer pro Browser und Tag) von ${p.visitors} verschiedenen Browsern. Ist die Zahl der Aufrufe deutlich hoeher als die der Browser, kommen die Leute an mehreren Tagen wieder.`}
                >
                  <span className={styles.statItemName}>
                    {pageLabel(p.name)} · {p.visitors} Besucher
                  </span>
                  <span className={styles.statItemCount}>{p.count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {imZeitraum && imZeitraum.functions.length > 0 && (
          <>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: '1.25rem' }}>
              Angeklickte Funktions-Badges in Prompts{zeitraumZusatz}
            </h3>
            <div className={styles.statGrid}>
              {imZeitraum.functions.map(f => (
                <div
                  key={`${f.plattform}-${f.name}`}
                  className={styles.statItem}
                  title={`Das Badge «${f.name}»${f.plattform ? ` der Plattform ${f.plattform}` : ''} wurde ${f.count}x in einer Prompt-Karte angeklickt. Das Badge beschreibt, welche Funktion der Prompt voraussetzt.`}
                >
                  <span className={styles.statItemName}>
                    {f.name}{f.plattform ? ` · ${f.plattform}` : ''}
                  </span>
                  <span className={styles.statItemCount}>{f.count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {imZeitraum && imZeitraum.actions.length > 0 && (
          <>
            <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', marginTop: '1.25rem' }}>
              Klick-Aktionen{zeitraumZusatz}
            </h3>
            <div className={styles.statGrid}>
              {imZeitraum.actions.map(a => (
                <div key={a.name} className={styles.statItem} title={`${actionHint(a.name)} (interner Name: ${a.name})`}>
                  <span className={styles.statItemName}>{actionLabel(a.name)}</span>
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
