// Import-Script für Lernende-Prompts aus Promptbibliothek → Firestore
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// API Key aus .env.local lesen (nicht hardcoden!)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#') && l.includes('=')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const PROJECT_ID = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'prompt-managerin';
const API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!API_KEY) { console.error('NEXT_PUBLIC_FIREBASE_API_KEY nicht in .env.local gefunden!'); process.exit(1); }
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) { fields[k] = toFirestoreValue(v); }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function createPrompt(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === 'erstelltAm') { fields[k] = { timestampValue: v }; }
    else { fields[k] = toFirestoreValue(v); }
  }
  const url = `${BASE_URL}/prompts?key=${API_KEY}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) });
  if (!res.ok) { const err = await res.text(); console.error(`FEHLER bei "${data.titel}":`, err.substring(0, 200)); return false; }
  const doc = await res.json();
  console.log(`OK: "${data.titel}" → ${doc.name.split('/').pop()}`);
  return true;
}

const D = { bewertungen: { '👍': 0, '❤️': 0, '🔥': 0, '⭐': 0, '💡': 0 }, nutzungsanzahl: 0, kommentar: '', erstelltAm: new Date().toISOString(), erstelltVon: 'BIBLIO', erstelltVonRolle: 'Lernende/Schüler*innen' };

const prompts = [

  // ==================== DEUTSCH (Lernende) ====================
  {
    ...D,
    titel: 'Feedback für einen eigenen Text erhalten',
    beschreibung: 'Prompt für Lernende: Eigenen Aufsatz (Erörterung) bewerten lassen mit Bewertungsraster, Verbesserungstabelle und Notenvorschlag.',
    promptText: `Du hast die Rolle einer Deutschlehrperson an einem Gymnasium in der Schweiz. Löse die folgenden Aufgaben:\n1. Erstelle ein Bewertungsraster mit den Bereichen "Sprache" und "Inhalt" für eine freie Erörterung an einem Gymnasium in der Schweiz.\n2. Bewerte anschliessend mit diesem Bewertungsraster den folgenden Aufsatz zum Thema [THEMA EINFÜGEN] und sei streng in deiner Bewertung. Die Bewertung erfolgt nur mit Worten, ohne Punkte oder Noten.\n3. Gib am Schluss noch eine Rückmeldung, was noch fehlt für die Höchstnote in den Bereichen "Inhalt" und "Sprache". Mach dabei konkrete Vorschläge in Form einer Tabelle. In der linken Spalte schreibst du die Stelle aus dem Aufsatz und in der rechten Spalte deinen Verbesserungsvorschlag mit Begründung.\n4. Schreib am Schluss noch, was für eine Note du für Sprache und für Inhalt geben würdest.\n\nHier ist der Aufsatz:\n[AUFSATZ EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text', 'Tabelle'],
    anwendungsfaelle: ['Korrekturbot', 'Lernfeedback'],
    tags: ['deutsch', 'aufsatz', 'feedback', 'erörterung', 'lernende', 'selbstbewertung'],
  },
  {
    ...D,
    titel: 'Sprachanalyse eines eigenen Textes',
    beschreibung: 'Prompt für Lernende: Eigenen Aufsatz auf sprachliche Qualität analysieren lassen mit Verbesserungstabelle.',
    promptText: `Du hast die Rolle einer Deutschlehrperson an einem Gymnasium in der Schweiz. Löse die folgenden Aufgaben:\n1. Erstell ein Bewertungsschema für die Sprache in einem Aufsatz.\n2. Analysier die Sprache des folgenden Aufsatzes kritisch und streng.\n3. Erstell eine Tabelle mit zwei Spalten. In die linke Spalte schreibst du alle Stellen aus dem Aufsatz, die man sprachlich verbessern kann. In die rechte Spalte schreibst du die verbesserte Variante und in Klammern eine Begründung. (Hinweis: "ss" statt das deutsche "ß" ist in Wörtern auch zulässig. Das korrigierst du nicht.)\n\nHier ist der Aufsatz:\n[AUFSATZ EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text', 'Tabelle'],
    anwendungsfaelle: ['Korrekturbot', 'Lernfeedback'],
    tags: ['deutsch', 'sprachanalyse', 'lernende', 'aufsatz', 'selbstkorrektur'],
  },

  // ==================== ENGLISCH (Lernende) ====================
  {
    ...D,
    titel: 'Englisch-Vokabeln interaktiv üben',
    beschreibung: 'Interaktiver Prompt zum Üben von englischem Vokabular: Lückensätze, Tipps bei Fehlern, schrittweises Lernen.',
    promptText: `Hilf mir beim Üben von englischem Vokabular. Du bekommst eine Vokabelliste.\n1. Du erstellst einen englischen Satz mit einem Wort aus dem Vokabular, in dem das zu übende Wort als Lücke stehen soll.\n2. Ich antworte, indem ich das Wort schreibe, welches in die Lücke passt.\n3. Du sagst, ob das Wort stimmt oder nicht. Wenn es inhaltlich nicht stimmt, gibst du mir einen Tipp auf Englisch. Nach zwei Hinweisen mit darauf folgender falscher Antwort gibst du mir die Lösung. Wenn es richtig ist, machst du weiter. Wiederhole diese Schritte für alle Wörter.\n\nHier ist die Vokabelliste:\n[VOKABELLISTE EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['englisch', 'vokabeln', 'interaktiv', 'üben', 'lückentext'],
  },
  {
    ...D,
    titel: 'Englisch-Grammatikthemen erklärt',
    beschreibung: 'Prompt für Lernende: Ein Grammatikthema im Kontext einer Prüfungsvorbereitung erklären lassen mit typischen Fehlern und Übungen.',
    promptText: `Erkläre das Grammatikthema [GRAMMATIKTHEMA EINFÜGEN] im Kontext des Cambridge Proficiency Examens. Die Erklärung soll häufig gemachte Fehler umfassen. Gib praktische Tipps und Lernstrategien zur Vorbereitung auf die Prüfung und erstelle anschliessend Übungen, um mein Verständnis zu testen.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['englisch', 'grammatik', 'cambridge', 'prüfungsvorbereitung', 'übungen'],
  },
  {
    ...D,
    titel: 'Buchzusammenfassung Englisch – Umfassende Analyse',
    beschreibung: 'Detaillierte Buchanalyse auf Englisch: Hintergrund, Charaktere, Handlung, Interpretation, Zitate, Erzählperspektive, Konflikte und Kontext.',
    promptText: `Beantworte folgende Fragen zum Buch: [TITEL DES BUCHES EINFÜGEN]\n\n1. Hintergrundinformationen: Autor, Erscheinungsjahr, Genre\n2. Wichtigste Charaktere: Hauptcharakter und Nebencharaktere beschreiben\n3. Wichtigste Handlungen/Höhepunkte: Einleitung, Wendepunkte, Höhepunkt, Schluss\n4. Wichtige Punkte zur Interpretation: Themen, Symbole, Botschaft, Stil\n5. Kurze Zusammenfassung der ganzen Geschichte\n6. Wichtige Zitate und Erklärungen: Mindestens fünf wichtige Stellen wörtlich zitieren und erklären\n7. Erzählperspektive und Struktur: Perspektive, besondere strukturelle Merkmale\n8. Charakterentwicklung: Entwicklung des Hauptcharakters, Beziehungen\n9. Konflikte: Interne und externe Konflikte\n10. Historischer und kultureller Kontext: Zeit, Ort, soziale und politische Hintergründe\n11. Rezeption und Einfluss: Literaturkritik, Einfluss auf andere Werke`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['englisch', 'buchanalyse', 'literatur', 'zusammenfassung', 'interpretation', 'matura'],
  },
  {
    ...D,
    titel: 'Übung Maturaaufsatz Englisch',
    beschreibung: 'Prompt für Lernende: Maturaaufsatz üben – Themen erhalten, Aufsatz schreiben, Bewertung und Korrektur auf Englisch.',
    promptText: `Du bist eine Englischlehrperson an einem Gymnasium in der Schweiz. Du sollst mir dabei helfen, Maturaaufsätze zu üben:\n\n1. Gib mir Themen an, über die ich entweder einen formellen Brief, informellen Brief, einen Aufsatz oder einen Report schreiben kann.\n2. Bewerte den Aufsatz anhand eines Bewertungsrasters, welches du erstellst. Die Bewertung soll auf einer Skala von 1 (sehr schlecht) bis 6 (sehr gut) sein.\n3. Gib mir den korrigierten Aufsatz zurück, indem du die Fehler fett markierst und eine Erklärung hinzufügst.\n4. Am Schluss sollst du mir eine Gesamtnote von 1 bis 6 geben.\n\nGib bitte die Antworten auf Englisch wieder.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot', 'Korrekturbot'],
    tags: ['englisch', 'matura', 'aufsatz', 'schreiben', 'bewertung', 'korrektur'],
  },
  {
    ...D,
    titel: 'Englisch-Textkorrektur auf allen CEFR-Niveaus',
    beschreibung: 'Flexible Textkorrektur für Lernende: CEFR-Level und Textsorte angeben, professionelles Feedback erhalten.',
    promptText: `Du bist eine Englischlehrperson. Korrigiere den folgenden Text und gib professionelles Feedback.\n\nLevel: [A1/A2/B1/B2/C1/C2]\nTextsorte: [letter, article, descriptive essay, 5-paragraph essay, report, review, etc.]\n\nBitte:\n1. Markiere alle Fehler und korrigiere sie in einer Tabelle (Original → Korrektur → Fehlertyp → Erklärung)\n2. Gib eine Gesamtbewertung des Textes auf dem angegebenen CEFR-Level\n3. Schlage konkrete Verbesserungen vor\n\nHier ist der Text:\n[TEXT EINFÜGEN]`,
    bildungsstufe: 'Gymnasium, Berufsfachschule',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text', 'Tabelle'],
    anwendungsfaelle: ['Korrekturbot', 'Lernfeedback'],
    tags: ['englisch', 'textkorrektur', 'CEFR', 'alle-niveaus', 'feedback'],
  },
  {
    ...D,
    titel: 'Englische Zeitformen – Übersicht und Test',
    beschreibung: 'Übersichtstabelle aller englischen Zeitformen mit Erklärung, Signalwörtern und Beispielen, danach interaktiver Test.',
    promptText: `Erstelle eine Tabelle, die alle englischen Zeitformen anschaulich darstellt. Die Tabelle sollte folgende Spalten haben: Tense, How to use the tense?, What are key words?, Example sentence.\n\nJedes Zeitformbeispiel sollte ein alltagsnahes Beispiel verwenden.\n\nNimm danach die Rolle einer Englisch-Lehrperson ein und teste mich entsprechend meinem Englisch-Niveau. Gib mir Übungen, die meinem Niveau gemäss sind.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Tabelle', 'Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['englisch', 'zeitformen', 'tenses', 'übersicht', 'grammatik', 'test'],
  },

  // ==================== FRANZÖSISCH (Lernende) ====================
  {
    ...D,
    titel: 'Französisch-Text korrigieren und bewerten',
    beschreibung: 'Prompt für Lernende: Französischen Text korrigieren, Umformulierungen vorschlagen und nach Schweizer Gymnasium-Niveau bewerten.',
    promptText: `Du bekommst einen Text auf Französisch, mit dem du folgende Schritte durchlaufen sollst:\n1. Verbessere den Text auf allfällige Rechtschreibfehler und gib den verbesserten Text mit den verbesserten Stellen fett markiert. Verbessere auch die Zeitformen und korrigiere sie.\n2. Gib verschiedene Möglichkeiten in einer Tabelle wie der verbesserte Text umformuliert werden kann, dabei sollst du allerdings das genutzte Sprachniveau des ursprünglichen Textes beibehalten. Die Tabelle soll drei Spalten haben: in der ersten der ursprüngliche Satz, in der zweiten die erste Umformulierung und in der dritten die zweite Umformulierung.\n3. Bewerte den Text bezüglich Inhalt und Sprache auf Level eines Gymnasiumschülers/einer Gymnasiumschülerin in der Schweiz. Gib ebenfalls eine Note im schweizerischen Notensystem für Inhalt und Sprache. Füge ebenfalls hinzu, welches Sprachniveau erreicht wurde.\n\nDies ist der Text:\n[TEXT EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text', 'Tabelle'],
    anwendungsfaelle: ['Korrekturbot', 'Lernfeedback'],
    tags: ['französisch', 'korrektur', 'bewertung', 'umformulierung', 'sprachniveau'],
  },
  {
    ...D,
    titel: 'Französisch-Wörter interaktiv lernen',
    beschreibung: 'Interaktiver Vokabel-Trainer für Französisch: Wort-für-Wort abfragen, Tipps bei Fehlern, Wiederholung der falschen Wörter.',
    promptText: `Du bekommst eine Liste mit Vokabular auf Deutsch und befolgst die 3 Schritte:\n1. Geh von oben nach unten durch die Liste und schreibe jeweils ein deutsches Wort. Der Benutzer muss mit der exakten französischen Übersetzung antworten. Gib nur das deutsche Wort und auf keinen Fall die französische Übersetzung an. Das Wort ist auch dann richtig, falls nur eines von zwei Übersetzungen geschrieben wird und wenn Bezeichnungen in Klammern fehlen. Wenn das Wort richtig ist, fragst du das nächste Wort ab und merkst es dir als "Kann ich schon". Wenn es falsch ist, gibst du einen Tipp (z.B. Anfangsbuchstabe). Nach maximal 2 Versuchen gibst du die richtige Lösung und merkst das Wort als "Noch zu lernen".\n2. Am Ende der Liste fragst du die "Noch zu lernen"-Wörter nochmal ab nach dem gleichen Prinzip.\n3. Wiederhole solange, bis alle Wörter korrekt sind.\n\nGeh Wort für Wort vor und warte nach jedem Wort auf eine Antwort.\n\nHier ist die Vokabelliste:\n[VOKABELLISTE EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['französisch', 'vokabeln', 'interaktiv', 'abfragen', 'lernen'],
  },
  {
    ...D,
    titel: 'Französische Verben konjugieren üben',
    beschreibung: 'Interaktiver Prompt zum Üben der französischen Verbkonjugation: Verb wird vorgegeben, Lernende konjugieren alle Personen.',
    promptText: `Wir lernen zusammen, wie man französische Verben konjugiert im Imparfait. Du schreibst ein französisches Verb ohne die deutsche Übersetzung und ich muss die deutsche Übersetzung antworten sowie für jede Person angeben, wie das Verb konjugiert wird. Korrigiere die Konjugationen, wenn sie falsch sind, und gib die richtige Lösung an.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['französisch', 'verben', 'konjugation', 'imparfait', 'interaktiv'],
  },
  {
    ...D,
    titel: 'Französische Zeitform üben – Übersicht und Übung',
    beschreibung: 'Prompt für Lernende: Französische Zeitform erklärt bekommen mit Tabellen, interaktiver Übung und Rückmeldung.',
    promptText: `Du bekommst ein Grammatikthema über eine Zeitform in Französisch. Geh dann mit dem Thema diese Schritte durch:\n1. Erstelle eine Übersicht des Themas: Erstelle eine Tabelle wie die Zeitform bei regelmässigen Verben konjugiert wird und eine Tabelle mit allen Ausnahmen. Erstelle auch eine Übersicht, wann die Zeitform verwendet wird. Frag nach, ob es Fragen dazu gibt – wenn ja, beantworte sie.\n2. Erstelle eine interaktive Übung zu dem Thema, die direkt hier im Chat gelöst werden kann.\n3. Gib eine Rückmeldung, wie gut das Thema bereits beherrscht wird, und sag, welche Teilthemen nochmals angeschaut werden müssen.\n\nDas Thema ist: [ZEITFORM EINFÜGEN, z.B. Imparfait]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text', 'Tabelle'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['französisch', 'zeitformen', 'grammatik', 'interaktiv', 'übung', 'rückmeldung'],
  },

  // ==================== GESCHICHTE (Lernende) ====================
  {
    ...D,
    titel: 'Historische Ereignisse chronologisch aufbereiten',
    beschreibung: 'Prompt für Lernende: Aus einem Text historische Ereignisse chronologisch auflisten mit Datum, Erklärung und Relevanz.',
    promptText: `Liste mir die historischen Ereignisse des folgenden Texts chronologisch auf. Starte jeweils mit dem Datum, wann das Ereignis geschehen ist. Suche nach dem genauen Datum, wenn es nicht im Text geschrieben steht. Beschreibe das Ereignis und erkläre es so einfach und kurz wie möglich. Erläutere zudem die wirtschaftliche, ethnische und politische Relevanz des Ereignisses.\n\nHier ist der Text:\n[TEXT EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['geschichte', 'chronologie', 'ereignisse', 'analyse', 'zusammenfassung'],
  },
  {
    ...D,
    titel: 'Konversation mit einer historischen Person',
    beschreibung: 'Rollenspiel-Prompt: Die KI übernimmt die Rolle einer historischen Persönlichkeit und beantwortet Fragen authentisch.',
    promptText: `Du übernimmst die Rolle von [NAME DER HISTORISCHEN PERSON] und führst mit mir eine Konversation. Ich werde dir Fragen stellen, auf die du danach wie die gesagte Person antwortest. Antworte kurz, ehrlich und im Stil der historischen Person.\n\n[ERSTE FRAGE EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot', 'Gesprächsbot'],
    tags: ['geschichte', 'rollenspiel', 'historische-person', 'konversation', 'interaktiv'],
  },
  {
    ...D,
    titel: 'Geschichte-Prüfungsvorbereitung',
    beschreibung: 'Prompt für Lernende: Chronologische Zusammenfassung eines Geschichtsthemas mit Verständnisfragen und Korrektur.',
    promptText: `Bitte gib mir eine kurze, chronologische Zusammenfassung des Themas [THEMA EINFÜGEN]. Stelle mir danach Fragen dazu, um mein Verständnis zu überprüfen.\n\nNach meinen Antworten: Verbessere meine Antworten inhaltlich. Falls du Fehler erkennst, erkläre sie mit einer verständlichen Erklärung.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['geschichte', 'prüfungsvorbereitung', 'zusammenfassung', 'fragen', 'verständnis'],
  },
  {
    ...D,
    titel: 'Komplexes Geschichtsthema einfach erklärt',
    beschreibung: 'Prompt: Ein komplexes historisches Thema so erklären, dass es auch für jüngere Lernende verständlich ist.',
    promptText: `Stelle dir vor, du sollst einer Gruppe von Grundschülern ein komplexes historisches Thema erklären. Verwende einfache Worte, kurze Sätze und alltägliche Beispiele, damit sie das Thema gut verstehen.\n\nHier ist das Thema:\n[THEMA EINFÜGEN]`,
    bildungsstufe: 'Gymnasium, Berufsfachschule',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['geschichte', 'einfache-sprache', 'erklärung', 'verständlich', 'komplex'],
  },

  // ==================== INFORMATIK (Lernende) ====================
  {
    ...D,
    titel: 'Code Debugger – Fehler finden und beheben',
    beschreibung: 'Prompt für Lernende: Code in Python, C++, JavaScript oder C# debuggen lassen mit Fehlererklärung und Lösungsvorschlägen.',
    promptText: `Bitte hilf mir, den folgenden Code in [Python/C++/JavaScript/C#] zu debuggen. Der Code enthält Fehler, die ich nicht identifizieren kann.\n\nHier ist der Code:\n[CODE EINFÜGEN]\n\nKannst du die Syntaxfehler und logischen Fehler identifizieren und Lösungsvorschläge machen, damit der Code ohne Fehler durchläuft und korrekt funktioniert?`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Code', 'Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['informatik', 'debugging', 'programmierung', 'python', 'javascript', 'fehlersuche'],
  },
  {
    ...D,
    titel: 'Hardware-Experte – Komponenten und Arduino',
    beschreibung: 'Prompt für Lernende: Hardware-Komponenten erklärt bekommen, Arduino-Anleitung, Limitationen und Alternativen.',
    promptText: `You are a hardware expert with deep knowledge of various electronic components. Your goal is to assist users by explaining a specific hardware component.\n\nPlease perform these tasks:\n1. Explain the Component: Describe the hardware component, its function, working principle, and technical specifications.\n2. Connecting to Arduino: Step-by-step guide on how to connect this component to an Arduino board, including wiring diagrams, code examples, and libraries needed.\n3. Limitations: Detail the limitations or drawbacks of the chosen component.\n4. Alternatives: Suggest alternative components that do not have the same limitations.\n5. Idea to Hardware Mapping: Ask the user to describe their project and suggest a list of appropriate hardware components.\n\n(Please reply in German)\n\nDie Komponente ist: [KOMPONENTE EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text', 'Code'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['informatik', 'hardware', 'arduino', 'elektronik', 'komponenten', 'maker'],
  },
  {
    ...D,
    titel: 'Ideen-Orakel – Projektideen generieren',
    beschreibung: 'Prompt für Lernende: Kreative Software- oder Hardware-Projektideen generieren lassen mit Materialliste und Anleitung.',
    promptText: `You are an expert project ideation assistant with extensive knowledge in both software and hardware. Your goal is to help users come up with creative and detailed project ideas.\n\nPlease:\n1. Gather User Preferences: Ask whether they want a software or hardware project, the field/domain of interest, and any specific libraries, sensors or components.\n2. Generate a Project Idea: Come up with a semi-detailed project idea explaining the core concept and functionality.\n3. Material List: Provide a list of all necessary components, tools, and software.\n4. How It Works: Give a step-by-step overview of how the project functions with relevant code snippets or diagrams.\n5. Challenges: Discuss potential challenges and offer tips to overcome them.\n6. Provide other project options linked with the user's preferences.\n\n(Please reply in German)`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot', 'Custom Prompt'],
    tags: ['informatik', 'projektideen', 'software', 'hardware', 'kreativ', 'maker'],
  },

  // ==================== MATHEMATIK (Lernende) ====================
  {
    ...D,
    titel: 'Mathe-Prüfungsvorbereitung mit Plan und Übungen',
    beschreibung: 'Prompt für Lernende: Vorbereitungsplan für Matheprüfung erstellen lassen mit Übungsaufgaben und Formelzusammenfassung.',
    promptText: `Übernimm die Rolle eines Mathematiklehrers für Gymnasiasten in der Schweiz und unterstütze mich bei der Prüfungsvorbereitung zum Thema [THEMA EINFÜGEN]. Erstelle einen umfassenden Vorbereitungsplan, formuliere Übungsaufgaben und fasse die wichtigsten Informationen und Formeln zusammen.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['mathematik', 'prüfungsvorbereitung', 'übungen', 'formeln', 'plan'],
  },
  {
    ...D,
    titel: 'Mathe-Aufgaben lösen und erklären',
    beschreibung: 'Prompt für Lernende: Beliebige mathematische Aufgabe lösen lassen mit Schritt-für-Schritt-Erklärung und ähnlichen Übungsaufgaben.',
    promptText: `Übernimm die Rolle eines Mathematiklehrers an einem Schweizer Gymnasium. In der nächsten Nachricht wird dir eine beliebige mathematische Aufgabe gestellt. Deine Aufgabe ist es, die Aufgabe zu lösen, den Lösungsweg Schritt für Schritt zu erklären und alle Details oder Formeln zu nennen. Danach sollst du einige ähnliche Aufgaben zum Üben erstellen.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['mathematik', 'aufgaben', 'lösungsweg', 'erklärung', 'übung'],
  },
  {
    ...D,
    titel: 'Mathe-Alltagsproblem erstellen und lösen',
    beschreibung: 'Prompt für Lernende: Realitätsnahes Mathematik-Problem zu einem Thema erstellen lassen, dann eigene Lösung überprüfen.',
    promptText: `Übernimm die Rolle eines Mathematiklehrers an einem Schweizer Gymnasium. Deine Aufgabe ist es, ein Mega-Problem zum Thema [THEMA EINFÜGEN] zu erstellen. Es soll ein Beispielproblem aus dem Alltag sein, das alle notwendigen Konzepte, Formeln usw. enthält. Danach schicke ich dir meine Lösung und du sagst mir, ob sie richtig ist oder nicht.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['mathematik', 'alltagsproblem', 'anwendung', 'realitätsnah', 'überprüfung'],
  },
  {
    ...D,
    titel: 'Mathe-Skript zusammenfassen mit Übungsaufgaben',
    beschreibung: 'Prompt für Lernende: Mathematik-Skript zusammenfassen lassen mit Unterthemen, Beispielaufgaben und Lösungen.',
    promptText: `Erstelle mir eine Zusammenfassung eines Themas in der Mathematik mit Hilfe eines Skripts. Du bekommst gleich ein Skript zu diesem Thema. Unterteile jedes Teilgebiet in diesem Skript und fasse jedes einzeln zusammen. Generiere auch jeweils eine Beispielaufgabe aus dem vorgegebenen Text und den Beispielen.\n\n[SKRIPT/TEXT EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['mathematik', 'zusammenfassung', 'skript', 'teilgebiete', 'beispielaufgaben'],
  },

  // ==================== PHILOSOPHIE (Lernende) ====================
  {
    ...D,
    titel: 'Kritische Analyse eines philosophischen Textes',
    beschreibung: 'Prompt für Lernende: Philosophischen Fachtext analysieren lassen mit Hauptargumenten, Zusammenfassung, Begriffserklärungen und Pro-/Contra-Tabelle.',
    promptText: `ChatGPT, ich benötige Unterstützung bei der kritischen Analyse eines philosophischen Textes. Hilf mir dabei, die Hauptargumente des gesamten Textes zu identifizieren, die Struktur der Argumentation zu analysieren und mögliche Schwachstellen oder Gegenargumente aufzuzeigen.\n\nAußerdem benötige ich eine Zusammenfassung des Textes, der das Thema [THEMA DES TEXTES] behandelt. Die Zusammenfassung soll ungefähr eine A4-Seite umfassen.\n\nErläutere bitte auch die wichtigsten philosophischen Begriffe, die in diesem Text verwendet werden, und illustriere sie mit Beispielen aus dem Text sowie aus anderen philosophischen Werken. Erläutere dazu den Verfasser kurz.\n\nSchliesslich benötige ich eine kritische Stellungnahme, die sowohl Pro- als auch Contra-Argumente zum Text umfasst. Stelle die Pro- und Contra-Argumente bitte auch in einer Tabelle dar.\n\nDie Analyse soll so sein, dass sie eine gute Note im Gymnasium in der Schweiz erreicht.\n\n[TEXT EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text', 'Tabelle'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['philosophie', 'textanalyse', 'argumentation', 'pro-contra', 'kritisch'],
  },
  {
    ...D,
    titel: 'Philosophischen Essay korrigieren und bewerten',
    beschreibung: 'Prompt für Lernende: Eigenen philosophischen Essay analysieren und bewerten lassen mit Verbesserungsvorschlägen.',
    promptText: `Du nimmst die Rolle eines Philosophen ein. Analysiere und bewerte den folgenden Essay zu einem beliebigen philosophischen Thema im philosophischen Sinne. Achte dabei besonders auf die philosophischen Hintergründe sowie auf den Aspekt der Gerechtigkeit, falls zutreffend. Berücksichtige verschiedene philosophische Argumentationen, die relevant für das Thema sind.\n\nGib dem Schüler abschliessend Verbesserungsvorschläge und mögliche alternative Lösungen. Deine Analyse sollte auf der Stufe eines Gymnasiasten sein.\n\nText des Schülers:\n[ESSAY EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Korrekturbot', 'Lernfeedback'],
    tags: ['philosophie', 'essay', 'bewertung', 'korrektur', 'verbesserung'],
  },
  {
    ...D,
    titel: 'Moralische Analyse eines philosophischen Textes',
    beschreibung: 'Prompt für Lernende: Einen philosophischen Fachtext auf moralische und ethische Hintergründe analysieren lassen.',
    promptText: `Du nimmst die Rolle als Philosoph an einer Kantonsschule in der Schweiz ein. Analysiere den folgenden Text, erläutere die moralischen und ethischen Hintergründe und begründe schlussendlich, ob man handeln sollte oder nicht. Formuliere deine Ergebnisse auf einem Kantonsschulniveau und nicht auf einem universitären Niveau.\n\n[TEXT EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['philosophie', 'moral', 'ethik', 'analyse', 'kantonsschule'],
  },
  {
    ...D,
    titel: 'Philosophische Probleme analysieren',
    beschreibung: 'Prompt für Lernende: Ein philosophisches Problem (z.B. "Was war zuerst – das Huhn oder das Ei?") analysieren und verschiedene Perspektiven darstellen.',
    promptText: `Nimm die Rolle als Philosophielehrer an einer Kantonsschule in der Schweiz ein. Philosophiere über das folgende Thema/Problem: [PROBLEM EINFÜGEN, z.B. "Was war zuerst – das Huhn oder das Ei?"]\n\nPräsentiere mir schlussendlich verschiedene Perspektiven und beantworte eventuell aufkommende Fragen. Bring dies alles auf ein Niveau, welches einer Kantonsschule entspricht und nicht auf Universitätsniveau.`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['philosophie', 'probleme', 'perspektiven', 'denken', 'diskussion'],
  },

  // ==================== PSYCHOLOGIE (Lernende) ====================
  {
    ...D,
    titel: 'Psychologische Theorie zusammenfassen',
    beschreibung: 'Prompt für Lernende: Psychologische Theorie auf Gymnasialniveau zusammenfassen mit Experimenten, Alltagsbeispielen und moderner Bedeutung.',
    promptText: `Bitte gib mir eine Zusammenfassung einer psychologischen Theorie oder Errungenschaft auf Gymnasialniveau, bei der ich nur den Namen des Begründers angebe.\n\nDie Zusammenfassung sollte umfassen:\n- Eine Erklärung der Theorie oder Errungenschaft\n- Zwei Beispiele: ein bewiesenes Experiment und ein untypisches Alltagsbeispiel\n- Die Bedeutung oder den Einfluss der Theorie im modernen Kontext\n\nVerwende Fachwörter, aber erkläre sie einfach.\n\nDer Begründer ist: [NAME EINFÜGEN]`,
    bildungsstufe: 'Gymnasium',
    plattformenUndModelle: { 'ChatGPT / OpenAI': ['GPT-4o'], 'Claude / Anthropic': ['Claude Sonnet 4'] },
    outputFormate: ['Text'],
    anwendungsfaelle: ['Lern-Bot'],
    tags: ['psychologie', 'theorie', 'zusammenfassung', 'experiment', 'alltagsbeispiel'],
  },
];

async function main() {
  console.log(`Importiere ${prompts.length} neue Lernende-Prompts...\n`);
  let ok = 0, fail = 0;
  for (const p of prompts) {
    const success = await createPrompt(p);
    if (success) ok++; else fail++;
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\nFertig! ${ok} erfolgreich, ${fail} fehlgeschlagen.`);
}
main().catch(console.error);
