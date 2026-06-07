'use client';

import { useState, useEffect } from 'react';
import { trackAction } from '@/lib/analytics';
import styles from './InfoButton.module.css';

const GRUND_TIPPS = [
  'Rolle, Ziel, Zielgruppe und gewünschtes Format angeben.',
  'Zielgruppe explizit adressieren: Stufe, Vorwissen, Sprache, Niveau.',
  'Kontext und ein, zwei Beispiele mitgeben — zeigen statt nur beschreiben.',
  'Iterieren: die Antwort nachschärfen statt neu zu beginnen.',
  'KI kann irren — Fakten und Quellen verifizieren.',
  'Datenschutz: keine echten Personendaten oder vertrauliche Inhalte eingeben.',
];

// KI als Review-Element: den eigenen Prompt zuerst kritisch prüfen lassen.
const REVIEW_PROMPT =
  'Prüfe diesen Prompt kritisch, bevor ich ihn einsetze: Ist er klar, zielgruppengerecht und ohne unnötige Hürden? Wo könnte er eher selektieren statt Lernräume zu öffnen? Schlage eine verbesserte Version vor.';

interface Szenario {
  titel: string;
  idee: string;
  tipp: string;
  beispiel: string;
  review: string;
}

const SZENARIEN: Szenario[] = [
  {
    titel: 'Unterrichtsmaterial erstellen (nicht statisch)',
    idee: 'Material, das sich anpassen lässt — mehrere Niveaus, Wahlaufgaben, offene Aufträge. So entstehen weniger Hürden und mehr Lernräume statt eines starren Arbeitsblatts.',
    tipp: 'Niveaustufen, Wahlmöglichkeiten und offene Aufgaben verlangen — mit Lösungen.',
    beispiel: 'Erstelle zum Thema [X] Material mit (a) Basis-, (b) Vertiefungs- und (c) offener Forscheraufgabe, je mit Lösung. Baue 2 Wahlaufgaben ein, damit Lernende selbst wählen können.',
    review: 'Prüfe dein Material: Wo entstehen unnötige Hürden? Schlage eine zugänglichere Variante vor.',
  },
  {
    titel: 'KI-Assistenten entwickeln',
    idee: 'Einen Lern-Assistenten bauen, der begleitet statt vorgibt — Lernende fragen jederzeit nach. Das fördert Aktivität und individuelle Lernräume.',
    tipp: 'Rolle, Tonfall, Grenzen (gibt Hinweise statt Lösungen) und Zielgruppe definieren.',
    beispiel: 'Entwirf einen System-Prompt für einen Lern-Bot zu [Thema], der mit Fragen führt, Tipps statt Lösungen gibt, ermutigend bleibt und auf Niveau [Stufe] eingeht.',
    review: 'Prüfe diesen System-Prompt: Wo sagt der Bot zu viel vor oder selektiert? Verbessere ihn.',
  },
  {
    titel: 'Korrekturhilfen (formatives Feedback)',
    idee: 'Lernförderliches Feedback (Stärken + nächste Schritte) statt nur Note/Fehler — mehr formatives Feedback, weniger Selektion.',
    tipp: 'Feedback-Kriterien vorgeben; keine Note, keine fertige Lösung — nur konkrete nächste Schritte.',
    beispiel: 'Gib zu dieser Schülerantwort formatives Feedback: 2 Stärken, 2 konkrete nächste Schritte, in wohlwollendem Ton. Keine Note, keine fertige Lösung.',
    review: 'Prüfe dein Feedback: Ist es ermutigend und konkret? Vermeidet es Bewertung/Selektion?',
  },
  {
    titel: 'Organisationshilfen für den Unterricht',
    idee: 'Routinearbeiten (Planung, Abläufe, Infos) abnehmen lassen — so bleibt mehr Zeit für Begleitung und individuelle Lernräume.',
    tipp: 'Kontext (Klasse, Zeit, Ziel) angeben und eine anpassbare Vorlage verlangen.',
    beispiel: 'Erstelle einen Stundenablauf (90 Min.) zu [Thema] mit Lernzielen, Sozialformen, Material und Zeitangaben — als anpassbare Vorlage.',
    review: 'Prüfe den Ablauf: Wo bleibt Raum für Eigenaktivität der Lernenden? Schlage Anpassungen vor.',
  },
  {
    titel: 'Daten in Excel visualisieren',
    idee: 'Zusammenhänge sichtbar machen statt nur Zahlen abzuschreiben — niederschwelliger Zugang zu Daten, mehr Aktivität.',
    tipp: 'Datenstruktur beschreiben; Schritt-für-Schritt-Anleitung + passenden Diagrammtyp verlangen.',
    beispiel: 'Ich habe eine Tabelle mit [Spalten]. Erkläre Schritt für Schritt, wie ich in Excel ein passendes Diagramm erstelle, und schlage den geeignetsten Diagrammtyp vor.',
    review: 'Prüfe deine Anleitung: Ist jeder Schritt auch ohne Excel-Vorwissen machbar?',
  },
  {
    titel: 'Sprachliche Zugänglichkeit / Differenzierung',
    idee: 'Inhalte in mehreren Niveaus und Sprachen — weniger sprachliche Hürden, mehr Teilhabe.',
    tipp: 'Niveau, Sprache(n) und ein Glossar in einfacher Sprache vorgeben.',
    beispiel: 'Formuliere diesen Text in 3 Niveaustufen und ergänze ein kurzes Glossar der Fachbegriffe in einfacher Sprache.',
    review: 'Prüfe: Welche Begriffe sind noch Hürden? Vereinfache sie.',
  },
  {
    titel: 'Verständnis sichtbar machen',
    idee: 'Fragen und Selbsttests erzeugen, die Verständnis zeigen — inkl. typischer Fehlvorstellungen, statt nur Stoff „durchzunehmen".',
    tipp: 'Fragen mit Lösungen verlangen und nach häufigen Fehlvorstellungen fragen.',
    beispiel: 'Erstelle 5 Verständnisfragen mit Lösungen zu diesem Text und nenne je eine häufige Fehlvorstellung dazu.',
    review: 'Prüfe die Fragen: Sind sie fair, klar und ohne Stolperfallen formuliert?',
  },
  {
    titel: 'Lernende als Gestaltende',
    idee: 'Lernende erstellen mit Prompts eigene Beispiele/Übungen zu ihren Interessen — stärkt Selbstwirksamkeit und Aktivität statt blossem Konsum.',
    tipp: 'Lernende geben Kontext/Interesse vor; die KI liefert, sie prüfen kritisch.',
    beispiel: 'Erkläre [Thema] anhand eines Beispiels aus [mein Beruf/Hobby] und gib mir 3 Übungsaufgaben mit Lösungen.',
    review: 'Prüfe das Ergebnis gemeinsam: Stimmt es fachlich? Was würdest du anders formulieren?',
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
                  Für einen Unterricht mit weniger Hürden und weniger Selektion — mehr Lernräume,
                  Individualisierung, Aktivität und formatives Feedback. Nicht: Altes nur schneller erledigen.
                </p>
              </div>
              <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Schließen">×</button>
            </div>

            <div className={styles.body}>
              <div className={styles.sectionTitle}>Wichtigste Tipps fürs Promptern</div>
              <ul className={styles.tippList}>
                {GRUND_TIPPS.map((t, i) => <li key={i}>{t}</li>)}
              </ul>

              <div className={styles.sectionTitle}>KI als Review nutzen</div>
              <div className={styles.szIdee} style={{ marginBottom: '0.5rem' }}>
                Lass die KI deinen Prompt zuerst kritisch prüfen und verbessern, bevor du ihn einsetzt:
              </div>
              <div className={styles.szBeispiel}>{REVIEW_PROMPT}</div>

              <div className={styles.sectionTitle}>Szenarien für den Unterricht</div>
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
                    <div className={styles.szTipp}>🔍 Review: {s.review}</div>
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
