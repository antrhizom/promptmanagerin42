// Register «Output»: Sammlung fertiger KI-Outputs zum Ansehen, Herunterladen und
// Weiterverwenden.
//
// So kommt ein neuer Output dazu:
//   1. Datei nach public/outputs/ legen (bei HTML: alles in EINER Datei).
//   2. Unten in OUTPUTS einen Eintrag ergaenzen (datei = Pfad ab /outputs/).
//
// Hinweis zur Vorschau: Dateien unter /outputs/ laufen bewusst abgeschottet
// (Sandbox, siehe next.config.js). Scripts funktionieren, aber localStorage,
// Cookies und der Zugriff auf die Promptmanagerin sind gesperrt. Heruntergeladen
// laeuft die Datei ohne diese Einschraenkung.

export interface OutputTyp {
  key: string;
  label: string;
  beschreibung: string;
  // Dateiendung fuer den Download und ob sich der Typ direkt im Browser zeigen laesst.
  endung: string;
  vorschau: boolean;
}

export const OUTPUT_TYPEN: OutputTyp[] = [
  {
    key: 'HTML',
    label: 'HTML',
    beschreibung:
      'Interaktive Seiten in einer einzigen Datei: laufen in jedem Browser, ohne Installation und ohne Konto.',
    endung: 'html',
    vorschau: true,
  },
];

export interface OutputEintrag {
  slug: string; // eindeutig, wird zum Dateinamen beim Download
  typ: string; // key aus OUTPUT_TYPEN
  titel: string;
  beschreibung: string;
  datei: string; // Pfad ab public/, z. B. '/outputs/prompt-check.html'
  tags: string[];
  erstelltMit?: string; // KI/Werkzeug, mit dem der Output entstanden ist
  autor?: string;
  lizenz?: string;
  // Eigener Startprompt zum Anpassen; ohne Angabe wird ein allgemeiner erzeugt.
  anpassPrompt?: string;
}

export const OUTPUTS: OutputEintrag[] = [
  {
    slug: 'krankenkassen-rechner',
    typ: 'HTML',
    titel: 'Krankenkassen-Rechner: Was kostet mich die Grundversicherung?',
    beschreibung:
      'Interaktiver Rechner für die Schweizer Grundversicherung: Lernende geben ihre Gesundheitskosten ein und sehen, wie Franchise, Versicherungsmodell (Standard, Hausarzt, Telmed, HMO), Kanton, Prämienregion, Versicherer und Unfalldeckung die Jahreskosten verändern. Zeigt den Rechenweg (Franchise, Selbstbehalt, Spitalbeitrag) und ab welchen Kosten sich welche Franchise lohnt. Modellrechnung mit gerundeten Richtwerten, nennt bewusst keine Versicherer.',
    datei: '/outputs/krankenkassen-rechner.html',
    tags: ['krankenkasse', 'versicherung', 'finanzen', 'abu', 'rechner'],
    erstelltMit: 'Claude',
    anpassPrompt: [
      'Im Anhang findest du eine HTML-Datei («Krankenkassen-Rechner»). Alle Zahlen und Texte stehen im Block DATEN am Anfang des Scripts. Passe sie für meinen Unterricht an.',
      '',
      '- Stand der Richtwerte: [z. B. aktuelles Jahr, neue mittlere Prämie gemäss BAG]',
      '- Zielgruppe / Stufe: [z. B. Lernende 1. Lehrjahr]',
      '- Ändern sollen sich: [z. B. eigene Beispieljahre, nur ein Kanton, weitere Kostenposition]',
      '- Gleich bleiben sollen: Rechenlogik, Aufbau und Gestaltung; es werden keine Versicherer namentlich genannt',
      '',
      'Stelle mir zuerst Rückfragen, falls etwas unklar ist. Gib mir danach wieder eine einzige, vollständige HTML-Datei zurück (ohne externe Abhängigkeiten), die ich direkt im Browser öffnen kann.',
    ].join('\n'),
  },
  {
    slug: 'prompt-check',
    typ: 'HTML',
    titel: 'Prompt-Check: Welcher Prompt ist stärker?',
    beschreibung:
      'Kleines Lernspiel in fünf Runden: Zwei Prompts stehen nebeneinander, die Lernenden wählen den stärkeren und erhalten sofort eine Begründung (Zielgruppe, Rolle und Format, Beispiel, Rückfragen, Quellenbezug). Die Inhalte stehen gebündelt am Anfang der Datei und lassen sich leicht austauschen.',
    datei: '/outputs/prompt-check.html',
    tags: ['prompting', 'lernspiel', 'quiz', 'vorlage'],
    erstelltMit: 'Claude',
  },
];

// Allgemeiner Startprompt, um einen Output per Chat-KI oder KI-Agent anzupassen.
export function anpassPromptFuer(eintrag: OutputEintrag): string {
  if (eintrag.anpassPrompt) return eintrag.anpassPrompt;
  const typ = OUTPUT_TYPEN.find(t => t.key === eintrag.typ);
  const dateiArt = typ ? `${typ.label}-Datei` : 'Datei';
  return [
    `Im Anhang findest du eine ${dateiArt} («${eintrag.titel}»). Passe sie für meinen Unterricht an.`,
    '',
    '- Thema / Inhalt: [dein Thema]',
    '- Zielgruppe / Stufe: [z. B. Berufsfachschule, 2. Lehrjahr]',
    '- Gleich bleiben sollen: Aufbau, Bedienung und Gestaltung',
    '- Ändern sollen sich: [z. B. Fragen, Texte, Beispiele, Farben]',
    '',
    'Stelle mir zuerst Rückfragen, falls etwas unklar ist. Gib mir danach wieder eine einzige, vollständige Datei zurück (alles in einer Datei, ohne externe Abhängigkeiten), die ich direkt im Browser öffnen kann.',
  ].join('\n');
}
