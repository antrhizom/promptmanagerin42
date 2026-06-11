'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackAction } from '@/lib/analytics';
import styles from './PFlow.module.css';

// P-Flow: geführter Klärungsprozess für den KI-Einsatz im Unterricht.
// Schritt 1: Was gestalten (konkreter Output)? → Schritt 2: Wie vorgehen (Herangehensweise)? → Schritt 3: Werkzeug.

type ZielKey = 'arbeitsblatt' | 'lernkontrolle' | 'erklaerung' | 'interaktiv' | 'assistent' | 'feedback' | 'organisation';
type AnsatzKey = 'generator' | 'vorlage' | 'bestehendes' | 'neu' | 'selbstbauen' | 'struktur';
type WerkzeugKey = 'toteach' | 'fobizz' | 'gemini' | 'chatki';

interface Option<K extends string> { key: K; label: string; desc: string }

const ZIELE: Option<ZielKey>[] = [
  { key: 'arbeitsblatt', label: 'Arbeitsblatt / Übungen', desc: 'Aufgaben zum Üben – idealerweise mit Niveaustufen und Lösungen.' },
  { key: 'lernkontrolle', label: 'Quiz / Lernkontrolle', desc: 'Fragen, Selbsttests, formative Checks.' },
  { key: 'erklaerung', label: 'Erklärung / Input', desc: 'Texte, Beispiele, Analogien, die einen Inhalt zugänglich machen.' },
  { key: 'interaktiv', label: 'Interaktive Lernseite', desc: 'Etwas Klickbares, z. B. eine HTML-Seite mit Aufgaben oder Visualisierung.' },
  { key: 'assistent', label: 'KI-Assistent / Lern-Bot', desc: 'Ein Bot, der Lernende begleitet und mit Fragen führt.' },
  { key: 'feedback', label: 'Korrektur / Feedback', desc: 'Formatives Feedback zu Arbeiten der Lernenden.' },
  { key: 'organisation', label: 'Organisation & Planung', desc: 'Abläufe, Stundenplanung, Übersichten, Kommunikation.' },
];

const ANSAETZE: Option<AnsatzKey>[] = [
  { key: 'generator', label: 'Content-Generator nutzen', desc: 'Ein Tool wie to-teach übernimmt das Prompten: du gibst Thema/Eckdaten ein, es erzeugt den Inhalt — ganz ohne eigene Prompts.' },
  { key: 'vorlage', label: 'Vorlage als Inspiration nutzen', desc: 'Bestehende Beispiele ansehen und übernehmen/anpassen.' },
  { key: 'bestehendes', label: 'Bestehenden Ablauf anpassen', desc: 'Etwas, das ich schon habe, mit KI verbessern oder differenzieren.' },
  { key: 'neu', label: 'Etwas Neues ausprobieren', desc: 'Von Grund auf etwas Neues entwickeln.' },
  { key: 'selbstbauen', label: 'Selbst interaktiv gestalten (z. B. HTML)', desc: 'Eine eigene klickbare Seite oder Anwendung bauen lassen.' },
  { key: 'struktur', label: 'Lernenden eine Struktur vermitteln', desc: 'Einen klaren Rahmen/Ablauf an die Hand geben.' },
];

const WERKZEUGE: Option<WerkzeugKey>[] = [
  { key: 'toteach', label: 'to-teach', desc: 'Generator für Arbeitsblätter, Übungen und Quiz – fertige Beispiele lassen sich remixen.' },
  { key: 'fobizz', label: 'fobizz', desc: 'Datenschutzkonforme KI-Assistenten und Tools für die Schule – teilbar mit Klassen.' },
  { key: 'gemini', label: 'Gemini / Canva', desc: 'Visuell gestalten, recherchieren, Dokumente und Medien erzeugen.' },
  { key: 'chatki', label: 'Chat-KI mit eigenem Prompt', desc: 'ChatGPT, Claude & Co. – flexibel über einen guten Prompt steuern (auch HTML).' },
];

// Welche Werkzeuge passen besonders gut zum Ziel (werden markiert, nichts wird versteckt).
const EMPFOHLEN: Record<ZielKey, WerkzeugKey[]> = {
  arbeitsblatt: ['toteach', 'gemini'],
  lernkontrolle: ['toteach', 'fobizz'],
  erklaerung: ['chatki', 'gemini'],
  interaktiv: ['chatki', 'gemini'],
  assistent: ['fobizz', 'chatki'],
  feedback: ['chatki', 'fobizz'],
  organisation: ['chatki', 'gemini'],
};

const ZIEL_HINWEIS: Record<ZielKey, string> = {
  arbeitsblatt: 'Denke an Niveaustufen und Wahlaufgaben — Material, das Lernräume öffnet statt zu selektieren.',
  lernkontrolle: 'Formativ statt selektiv: Fragen mit Lösungen und Hinweisen auf typische Fehlvorstellungen.',
  erklaerung: 'Biete mehrere Zugänge: Zusammenfassung, Beispiel, Analogie — für unterschiedliche Lernende.',
  interaktiv: 'Interaktivität senkt Hürden: klickbare Aufgaben, sofortiges Feedback, Selbststeuerung.',
  assistent: 'Der Assistent gibt Hinweise statt Lösungen und fragt nach — die Aktivität bleibt bei den Lernenden.',
  feedback: 'Stärken + konkrete nächste Schritte, keine Note, keine fertige Lösung.',
  organisation: 'Gewonnene Zeit fliesst in Begleitung und individuelle Lernräume.',
};

const ANSATZ_TIPP: Record<AnsatzKey, string> = {
  generator: 'Ein Content-Generator (z. B. to-teach) übernimmt das Prompten: du gibst Thema, Stufe und Aufgabentyp vor — das Tool erzeugt den Inhalt. Beispiele und Links findest du in der Gen Biblio.',
  vorlage: 'Starte in der Gen Biblio: nimm ein remixbares Beispiel und passe es an deine Klasse an.',
  bestehendes: 'Gib der KI dein bestehendes Material als Kontext und bitte um eine zugänglichere oder differenzierte Variante.',
  neu: 'Beschreibe Ziel, Zielgruppe und Output klar — und lass die KI deinen Prompt zuerst kritisch prüfen (Review), bevor du loslegst.',
  selbstbauen: 'Für interaktive Seiten beschreibst du genau, was klickbar sein soll, lässt HTML erzeugen und testest das Ergebnis. Iterativ verfeinern.',
  struktur: 'Formuliere die Struktur explizit (Schritte, Kriterien) — so wird sie für Lernende nachvollziehbar und wiederverwendbar.',
};

const WERKZEUG_EMPFEHLUNG: Record<WerkzeugKey, { text: string; links: { href: string; label: string }[] }> = {
  toteach: {
    text: 'In der Gen Biblio findest du unter to-teach fertige Beispiele zum Kopieren oder Remixen.',
    links: [{ href: '/ki-tools', label: '→ Gen Biblio öffnen' }],
  },
  fobizz: {
    text: 'In der Gen Biblio findest du unter fobizz Assistenten-Beispiele zum Remixen — der System-Prompt steckt im Remix.',
    links: [{ href: '/ki-tools', label: '→ Gen Biblio öffnen' }],
  },
  gemini: {
    text: 'In der Gen Biblio findest du unter Gemini Beispiele (z. B. geteilte Konversationen) als Vorlage.',
    links: [{ href: '/ki-tools', label: '→ Gen Biblio öffnen' }],
  },
  chatki: {
    text: 'Im Prompts-Register findest du erprobte Prompts zum Kopieren — nach Plattform, Anwendungsfall oder Rolle filtern und anpassen.',
    links: [{ href: '/', label: '→ Prompts durchsuchen' }],
  },
};

export function PFlow() {
  const [ziel, setZiel] = useState<ZielKey | null>(null);
  const [ansatz, setAnsatz] = useState<AnsatzKey | null>(null);
  const [werkzeug, setWerkzeug] = useState<WerkzeugKey | null>(null);

  const restart = () => { setZiel(null); setAnsatz(null); setWerkzeug(null); };

  const zielOpt = ZIELE.find(z => z.key === ziel);
  const ansatzOpt = ANSAETZE.find(a => a.key === ansatz);
  const werkzeugOpt = WERKZEUGE.find(w => w.key === werkzeug);
  const fertig = !!(ziel && ansatz && werkzeug);

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
                <button className={styles.nodeEdit} onClick={() => { setZiel(null); setAnsatz(null); setWerkzeug(null); }}>ändern</button>
              </div>
            </div>
            <div className={styles.arrow}>↓</div>
          </>
        )}
        {ansatzOpt && (
          <>
            <div className={styles.node}>
              <div className={styles.nodeFrage}>2 · Wie möchte ich vorgehen?</div>
              <div className={styles.nodeAntwort}>
                {ansatzOpt.label}
                <button className={styles.nodeEdit} onClick={() => { setAnsatz(null); setWerkzeug(null); }}>ändern</button>
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
              Frage klären: Welchen Output sollen die Lernenden bekommen oder erreichen?
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

        {ziel && !ansatz && (
          <div className={styles.frageBox}>
            <h2 className={styles.frageTitel}>2 · Wie möchte ich vorgehen?</h2>
            <p className={styles.frageHinweis}>
              Frage klären: Eher eine Vorlage nutzen, Bestehendes anpassen, Neues bauen — oder selbst interaktiv gestalten?
            </p>
            <div className={styles.optionen}>
              {ANSAETZE.map(o => (
                <button key={o.key} className={styles.option} onClick={() => { setAnsatz(o.key); trackAction(`pflow:ansatz:${o.key}`); }}>
                  <div className={styles.optionLabel}>{o.label}</div>
                  <div className={styles.optionDesc}>{o.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {ziel && ansatz && !werkzeug && (
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

        {fertig && ziel && ansatz && werkzeug && (
          <div className={styles.ergebnis}>
            <h2 className={styles.ergebnisTitel}>✓ Dein Weg</h2>
            <p className={styles.ergebnisText}>{WERKZEUG_EMPFEHLUNG[werkzeug].text}</p>
            <div className={styles.ergebnisTipp}>💡 {ZIEL_HINWEIS[ziel]}</div>
            <div className={styles.ergebnisTipp}>🔧 {ANSATZ_TIPP[ansatz]}</div>
            <div className={styles.ergebnisLinks}>
              {WERKZEUG_EMPFEHLUNG[werkzeug].links.map(l => (
                <Link key={l.href} href={l.href} className={styles.linkBtn}>{l.label}</Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {(ziel || ansatz || werkzeug) && (
        <button className={styles.restart} onClick={restart}>↺ Von vorn beginnen</button>
      )}
    </div>
  );
}
