'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackAction } from '@/lib/analytics';
import styles from './PFlow.module.css';

// P-Flow: geführter Klärungsprozess für den KI-Einsatz im Unterricht.
// Schritt 1: Ziel/Prozess/Output klären → Schritt 2: Austausch KI↔Mensch → Schritt 3: Werkzeug.
// Am Ende: Empfehlung mit Links zu Prompts bzw. Gen Biblio.

type ZielKey = 'material' | 'assistent' | 'feedback' | 'organisation' | 'lernende';
type AustauschKey = 'einmalig' | 'iterativ' | 'dialog';
type WerkzeugKey = 'toteach' | 'fobizz' | 'gemini' | 'chatki';

interface Option<K extends string> { key: K; label: string; desc: string }

const ZIELE: Option<ZielKey>[] = [
  { key: 'material', label: 'Unterrichtsmaterial erstellen', desc: 'Arbeitsblätter, Aufgaben, Quiz – anpassbar statt statisch, mit Niveaustufen.' },
  { key: 'assistent', label: 'KI-Assistenten entwickeln', desc: 'Ein Bot, der Lernende begleitet: Lern-Bot, Gesprächsbot, Korrekturbot.' },
  { key: 'feedback', label: 'Feedback & Korrektur unterstützen', desc: 'Formatives Feedback: Stärken + nächste Schritte statt nur Note.' },
  { key: 'organisation', label: 'Unterricht organisieren & planen', desc: 'Abläufe, Stundenplanung, Übersichten, Kommunikation.' },
  { key: 'lernende', label: 'Lernende gestalten selbst mit KI', desc: 'Lernende erzeugen eigene Beispiele, Übungen oder Produkte – aktiv statt konsumierend.' },
];

const AUSTAUSCH: Option<AustauschKey>[] = [
  { key: 'einmalig', label: 'Einmaliger Output', desc: 'Die KI liefert ein Ergebnis, ich prüfe und passe es an.' },
  { key: 'iterativ', label: 'Iteratives Verfeinern', desc: 'Mehrere Runden: erzeugen → kritisch prüfen lassen → verbessern.' },
  { key: 'dialog', label: 'Laufender Dialog mit Lernenden', desc: 'Lernende interagieren selbst und wiederholt mit der KI.' },
];

const WERKZEUGE: Option<WerkzeugKey>[] = [
  { key: 'toteach', label: 'to-teach', desc: 'Generator für Arbeitsblätter, Übungen und Quiz – fertige Beispiele lassen sich remixen.' },
  { key: 'fobizz', label: 'fobizz', desc: 'Datenschutzkonforme KI-Assistenten und Tools für die Schule – teilbar mit Klassen.' },
  { key: 'gemini', label: 'Gemini / Canva', desc: 'Visuell gestalten, recherchieren, Dokumente und Medien erzeugen.' },
  { key: 'chatki', label: 'Chat-KI mit eigenem Prompt', desc: 'ChatGPT, Claude & Co. – flexibel über einen guten Prompt steuern.' },
];

// Welche Werkzeuge passen besonders gut zu welchem Ziel (werden markiert, nichts wird versteckt).
const EMPFOHLEN: Record<ZielKey, WerkzeugKey[]> = {
  material: ['toteach', 'gemini'],
  assistent: ['fobizz', 'chatki'],
  feedback: ['chatki', 'fobizz'],
  organisation: ['chatki', 'gemini'],
  lernende: ['fobizz', 'gemini'],
};

const AUSTAUSCH_TIPP: Record<AustauschKey, string> = {
  einmalig: 'Output nie ungeprüft einsetzen: Lass die KI ihr Ergebnis selbst kritisch prüfen (Review-Prompt) und passe es dann an deine Klasse an.',
  iterativ: 'Arbeite in Runden: erzeugen → von der KI kritisch prüfen lassen → verfeinern. Die Review-Schleife gehört zum Prozess.',
  dialog: 'Lege Rolle, Tonfall und Grenzen im System-Prompt fest (Hinweise statt Lösungen!) und teste den Dialog selbst, bevor Lernende ihn nutzen.',
};

const WERKZEUG_EMPFEHLUNG: Record<WerkzeugKey, { text: string; links: { href: string; label: string }[] }> = {
  toteach: {
    text: 'In der Gen Biblio findest du unter to-teach fertige Beispiele, die du kopieren oder direkt remixen kannst.',
    links: [{ href: '/ki-tools', label: '→ Gen Biblio öffnen' }],
  },
  fobizz: {
    text: 'In der Gen Biblio findest du unter fobizz Assistenten-Beispiele zum Remixen — der System-Prompt steckt im Remix.',
    links: [{ href: '/ki-tools', label: '→ Gen Biblio öffnen' }],
  },
  gemini: {
    text: 'In der Gen Biblio findest du unter Gemini Beispiele (z. B. geteilte Konversationen), die du als Vorlage nutzen kannst.',
    links: [{ href: '/ki-tools', label: '→ Gen Biblio öffnen' }],
  },
  chatki: {
    text: 'Im Prompts-Register findest du erprobte Prompts zum Kopieren — filtere nach Plattform, Anwendungsfall oder Rolle und passe den Prompt an.',
    links: [{ href: '/', label: '→ Prompts durchsuchen' }],
  },
};

const ZIEL_HINWEIS: Record<ZielKey, string> = {
  material: 'Denke an Niveaustufen und Wahlaufgaben — Material, das Lernräume öffnet statt zu selektieren.',
  assistent: 'Ein guter Assistent gibt Hinweise statt Lösungen und fragt nach — so bleibt die Aktivität bei den Lernenden.',
  feedback: 'Formativ heisst: Stärken benennen + konkrete nächste Schritte — keine Note, keine fertige Lösung.',
  organisation: 'Gewonnene Zeit fliesst in Begleitung und individuelle Lernräume.',
  lernende: 'Lernende prompten selbst und prüfen die Ergebnisse kritisch — das stärkt Selbstwirksamkeit.',
};

export function PFlow() {
  const [ziel, setZiel] = useState<ZielKey | null>(null);
  const [austausch, setAustausch] = useState<AustauschKey | null>(null);
  const [werkzeug, setWerkzeug] = useState<WerkzeugKey | null>(null);

  const restart = () => { setZiel(null); setAustausch(null); setWerkzeug(null); };

  const zielOpt = ZIELE.find(z => z.key === ziel);
  const austauschOpt = AUSTAUSCH.find(a => a.key === austausch);
  const werkzeugOpt = WERKZEUGE.find(w => w.key === werkzeug);
  const fertig = !!(ziel && austausch && werkzeug);

  return (
    <div className={styles.wrap}>
      <div className={styles.flow}>
        {/* Beantwortete Knoten */}
        {zielOpt && (
          <>
            <div className={styles.node}>
              <div className={styles.nodeFrage}>1 · Was möchte ich mit KI gestalten?</div>
              <div className={styles.nodeAntwort}>
                {zielOpt.label}
                <button className={styles.nodeEdit} onClick={() => { setZiel(null); setAustausch(null); setWerkzeug(null); }}>ändern</button>
              </div>
            </div>
            <div className={styles.arrow}>↓</div>
          </>
        )}
        {austauschOpt && (
          <>
            <div className={styles.node}>
              <div className={styles.nodeFrage}>2 · Was ist im Austausch KI ↔ Mensch gefordert?</div>
              <div className={styles.nodeAntwort}>
                {austauschOpt.label}
                <button className={styles.nodeEdit} onClick={() => { setAustausch(null); setWerkzeug(null); }}>ändern</button>
              </div>
            </div>
            <div className={styles.arrow}>↓</div>
          </>
        )}
        {werkzeugOpt && (
          <>
            <div className={styles.node}>
              <div className={styles.nodeFrage}>3 · Mit welchem Werkzeug?</div>
              <div className={styles.nodeAntwort}>
                {werkzeugOpt.label}
                <button className={styles.nodeEdit} onClick={() => setWerkzeug(null)}>ändern</button>
              </div>
            </div>
            <div className={styles.arrow}>↓</div>
          </>
        )}

        {/* Aktuelle Frage bzw. Ergebnis */}
        {!ziel && (
          <div className={styles.frageBox}>
            <h2 className={styles.frageTitel}>1 · Was möchte ich mit KI gestalten?</h2>
            <p className={styles.frageHinweis}>
              Frage klären: Welchen Prozess will ich steuern, welchen Output sollen die Lernenden erreichen?
            </p>
            <div className={styles.optionen}>
              {ZIELE.map(o => (
                <button key={o.key} className={styles.option} onClick={() => { setZiel(o.key); trackAction(`pflow:ziel:${o.key}`); }}>
                  <div className={styles.optionLabel}>{o.label}</div>
                  <div className={styles.optionDesc}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {ziel && !austausch && (
          <div className={styles.frageBox}>
            <h2 className={styles.frageTitel}>2 · Was ist im Austausch zwischen KI und Mensch gefordert?</h2>
            <p className={styles.frageHinweis}>
              Frage klären: Reicht ein einmaliges Ergebnis — oder braucht es Runden bzw. einen laufenden Dialog?
            </p>
            <div className={styles.optionen}>
              {AUSTAUSCH.map(o => (
                <button key={o.key} className={styles.option} onClick={() => { setAustausch(o.key); trackAction(`pflow:austausch:${o.key}`); }}>
                  <div className={styles.optionLabel}>{o.label}</div>
                  <div className={styles.optionDesc}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {ziel && austausch && !werkzeug && (
          <div className={styles.frageBox}>
            <h2 className={styles.frageTitel}>3 · Mit welchem Werkzeug will ich das machen?</h2>
            <p className={styles.frageHinweis}>
              Frage klären: Auch to-teach, fobizz oder Canva/Gemini können Lösungen bieten — nicht nur die Chat-KI.
            </p>
            <div className={styles.optionen}>
              {WERKZEUGE.map(o => (
                <button key={o.key} className={styles.option} onClick={() => { setWerkzeug(o.key); trackAction(`pflow:werkzeug:${o.key}`); }}>
                  <div className={styles.optionLabel}>
                    {o.label}
                    {ziel && EMPFOHLEN[ziel].includes(o.key) && <span className={styles.empfohlen}>passt gut</span>}
                  </div>
                  <div className={styles.optionDesc}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {fertig && ziel && austausch && werkzeug && (
          <div className={styles.ergebnis}>
            <h2 className={styles.ergebnisTitel}>✓ Dein Weg</h2>
            <p className={styles.ergebnisText}>{WERKZEUG_EMPFEHLUNG[werkzeug].text}</p>
            <div className={styles.ergebnisTipp}>💡 {ZIEL_HINWEIS[ziel]}</div>
            <div className={styles.ergebnisTipp}>🔄 {AUSTAUSCH_TIPP[austausch]}</div>
            <div className={styles.ergebnisLinks}>
              {WERKZEUG_EMPFEHLUNG[werkzeug].links.map(l => (
                <Link key={l.href} href={l.href} className={styles.linkBtn}>{l.label}</Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {(ziel || austausch || werkzeug) && (
        <button className={styles.restart} onClick={restart}>↺ Von vorn beginnen</button>
      )}
    </div>
  );
}
