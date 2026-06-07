'use client';

import { useState, useEffect } from 'react';
import { trackAction } from '@/lib/analytics';
import styles from './InfoButton.module.css';

const GRUND_TIPPS = [
  'Rolle, Ziel, Zielgruppe und gewünschtes Format angeben.',
  'Kontext und ein, zwei Beispiele mitgeben — zeigen statt nur beschreiben.',
  'Zielgruppe explizit adressieren: Stufe, Vorwissen, Sprache, Niveau.',
  'Iterieren: die Antwort nachschärfen statt neu zu beginnen.',
  'Kritisch prüfen: KI kann irren — Fakten und Quellen verifizieren.',
  'Datenschutz: keine echten Personendaten oder vertrauliche Inhalte eingeben.',
];

interface Szenario {
  titel: string;
  idee: string;
  tipp: string;
  beispiel: string;
}

const SZENARIEN: Szenario[] = [
  {
    titel: 'Differenzieren: ein Inhalt, mehrere Niveaus',
    idee: 'Statt einer einzigen Version denselben Inhalt auf mehreren Niveaustufen anbieten, damit alle einen Zugang finden.',
    tipp: 'Niveaustufen, Zielgruppe und Umgang mit Fachbegriffen klar vorgeben.',
    beispiel: 'Formuliere diesen Text in drei Niveaustufen (einfach / mittel / anspruchsvoll) für Lernende im 1. Lehrjahr. Behalte die Fachbegriffe, erkläre sie aber kurz.',
  },
  {
    titel: 'Mehrsprachigkeit / Deutsch als Zweitsprache',
    idee: 'Schlüsselbegriffe zweisprachig und Glossare bereitstellen, damit sprachliche Hürden den Inhalt nicht verdecken.',
    tipp: 'Erstsprache(n) nennen und um Glossar mit einfachen Beispielsätzen bitten.',
    beispiel: 'Erstelle ein zweisprachiges Glossar (Deutsch ↔ …) zu diesem Text mit je einem einfachen Beispielsatz.',
  },
  {
    titel: 'Mehrere Darstellungsformen (UDL)',
    idee: 'Denselben Inhalt zusätzlich als Zusammenfassung, Struktur/Mindmap und Alltagsbeispiel anbieten — verschiedene Zugänge für verschiedene Lernende.',
    tipp: 'Mehrere Formate in einem Prompt anfordern.',
    beispiel: 'Wandle dieses Kapitel um in: (a) eine 5-Satz-Zusammenfassung, (b) eine Stichwort-Mindmap, (c) ein Alltagsbeispiel aus dem Berufsalltag.',
  },
  {
    titel: 'Barrierearm aufbereiten (klare Sprache)',
    idee: 'Komplexe Texte in klare Sprache bringen und Bilder mit Alt-Texten zugänglich machen.',
    tipp: 'Um kurze Sätze, aktive Form, erklärte Fachbegriffe und Alt-Text-Vorschläge bitten.',
    beispiel: 'Überarbeite den Text in klarer Sprache (kurze Sätze, aktive Form, Fachbegriffe kurz erklärt) und schlage Alt-Texte für die Abbildungen vor.',
  },
  {
    titel: 'Verständnis prüfen statt nur „durchnehmen"',
    idee: 'Fragen und Selbsttests erzeugen, die das Verständnis sichtbar machen — inkl. typischer Fehlvorstellungen.',
    tipp: 'Fragen mit Lösungen anfordern und nach häufigen Fehlvorstellungen fragen.',
    beispiel: 'Erstelle 5 Verständnisfragen mit Lösungen zu diesem Text und nenne je eine häufige Fehlvorstellung dazu.',
  },
  {
    titel: 'Lernende als Gestaltende',
    idee: 'Lernende erstellen mit Prompts eigene Beispiele und Übungen zu ihren Interessen — das stärkt Selbstwirksamkeit statt blossem Konsum.',
    tipp: 'Lernende geben Kontext/Interesse vor; die KI liefert, sie prüfen kritisch.',
    beispiel: 'Erkläre [Thema] anhand eines Beispiels aus [mein Beruf/Hobby] und gib mir 3 Übungsaufgaben mit Lösungen.',
  },
  {
    titel: 'Feedback-Coach statt Lösungs-Automat',
    idee: 'KI gibt formatives Feedback, das den nächsten Lernschritt zeigt — ohne die Arbeit abzunehmen.',
    tipp: 'Stärken + konkrete nächste Schritte anfordern, ausdrücklich ohne fertige Lösung.',
    beispiel: 'Gib Feedback zu meinem Text: 2 Stärken und 2 konkrete nächste Schritte. Schreibe den Text NICHT für mich um.',
  },
];

export function InfoButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => { setOpen(true); trackAction('open-tipps'); }}
        aria-label="Tipps & Szenarien öffnen"
      >
        💡 Tipps &amp; Szenarien
      </button>

      {open && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className={styles.panel} role="dialog" aria-modal="true">
            <div className={styles.header}>
              <div>
                <h2 className={styles.headerTitle}>Mit Prompts Inhalte zugänglicher machen</h2>
                <p className={styles.headerLead}>
                  Nutze KI nicht nur, um Altes schneller zu erledigen — sondern um Lerninhalte für alle zugänglicher zu machen.
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Schließen">×</button>
            </div>

            <div className={styles.body}>
              <div className={styles.sectionTitle}>Wichtigste Tipps fürs Promptern</div>
              <ul className={styles.tippList}>
                {GRUND_TIPPS.map((t, i) => <li key={i}>{t}</li>)}
              </ul>

              <div className={styles.sectionTitle}>Szenarien für Unterrichtsmaterial</div>
              {SZENARIEN.map((s, i) => (
                <details key={i} className={styles.szenario}>
                  <summary className={styles.szenarioSummary}>
                    <span className={styles.szChevron} aria-hidden>▸</span>
                    {s.titel}
                  </summary>
                  <div className={styles.szenarioBody}>
                    <div className={styles.szIdee}>{s.idee}</div>
                    <div className={styles.szTipp}>💡 {s.tipp}</div>
                    <div className={styles.szBeispielLabel}>Beispiel-Prompt</div>
                    <div className={styles.szBeispiel}>{s.beispiel}</div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
