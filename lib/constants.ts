// Make.com Webhook für Meldungen
export const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/ed4i5281q2cccrryx29kut1ige6ln72u';

// Admin E-Mail für Fallback
export const ADMIN_EMAIL = 'antrhizom@gmail.com';

// Admin-Allow-Liste (UI-Gating im Client).
// WICHTIG: Diese Liste muss mit der Allow-Liste in firestore.rules (Funktion isAdmin)
// übereinstimmen. Die Regeln sind die echte Sicherheitsgrenze; diese Konstante steuert
// nur, ob Admin-Bedienelemente angezeigt werden.
export const ADMIN_EMAILS = ['antrhizom@gmail.com'];

export function istAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

// Rollen
export const ROLLEN = [
  'Lehrpersonen',
  'IKT-Verantwortliche',
  'Lernende/Schüler*innen'
];

// Bildungsstufen
export const BILDUNGSSTUFEN = [
  'Berufsfachschule',
  'Gymnasium',
  'Höhere Fachschule'
];

// Plattformen mit Modellen und Funktionen
export const PLATTFORMEN_MIT_MODELLEN_UND_FUNKTIONEN: {
  [key: string]: {
    modelle: string[];
    funktionen: string[];
  };
} = {
  'ChatGPT / OpenAI': {
    modelle: [
      'GPT-5.2', 'GPT-5.1', 'GPT-4.1', 'GPT-4o',
      'GPT-4o mini', 'o3', 'o3-mini', 'o3-pro'
    ],
    funktionen: [
      'Chat', 'Canvas', 'Custom GPTs', 'Web-Browsing',
      'DALL-E Bildgenerierung', 'Code Interpreter', 'Dateianalyse'
    ]
  },
  'Claude / Anthropic': {
    modelle: [
      'Claude Opus 4.5', 'Claude Sonnet 4.5', 'Claude Opus 4',
      'Claude Sonnet 4', 'Claude Haiku 4.5', 'Claude 4', 'Claude 4.5'
    ],
    funktionen: [
      'Chat', 'Artifacts', 'Projects', 'Recherche',
      'Code-Ausführung', 'Dateianalyse'
    ]
  },
  'Gemini / Google': {
    modelle: [
      'Gemini 3 Pro', 'Gemini 3 Flash',
      'Gemini 2.5 Pro', 'Gemini 2.5 Flash'
    ],
    funktionen: [
      'Chat', 'Deep Research', 'Canvas', 'Bilder erstellen',
      'Lernhilfe', 'Visuelles Layout', 'Websuche',
      'Google Drive Integration', 'GitHub Integration',
      'Vercel Integration', 'Screenshot-Upload'
    ]
  },
  'fobizz': {
    modelle: [
      'Mistral mini', 'Llama 3', 'Llama 3 mini', 'GPT-OSS',
      'GPT-OSS small', 'DeepSeek R1', 'Qwen 3', 'GPT-5',
      'GPT-5 mini', 'GPT-4o', 'GPT-4o mini', 'GPT o3-mini',
      'Claude 4', 'Claude 4.5', 'Mistral'
    ],
    funktionen: ['Chat', 'Bildgenerierung', 'Textanalyse']
  },
  'Copilot / Microsoft': {
    modelle: ['GPT-5', 'GPT-4.1', 'Claude Sonnet 4', 'Phi-4'],
    funktionen: ['Chat', 'Web-Browsing', 'Bildgenerierung', 'Code-Assistance']
  },
  'Perplexity': {
    modelle: ['Sonar', 'Sonar-Pro', 'Sonar-Reasoning'],
    funktionen: ['Recherche', 'Web-Browsing', 'Quellenangaben']
  },
  'DeepL Write': {
    modelle: ['DeepL Write'],
    funktionen: ['Textkorrektur', 'Übersetzung', 'Stilverbesserung']
  },
  'Meta Llama': {
    modelle: [
      'Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3 70B',
      'Llama 3.2 Vision', 'Llama 3.1 405B'
    ],
    funktionen: ['Chat', 'Code-Generierung', 'Bildanalyse (Vision)']
  },
  'Mistral AI': {
    modelle: ['Mistral Large 3', 'Mistral Small 3.2', 'Ministral 3'],
    funktionen: ['Chat', 'Code-Generierung']
  },
  'Qwen / Alibaba': {
    modelle: ['Qwen3-235B', 'Qwen3-Max', 'QwQ-32B', 'Qwen3-VL'],
    funktionen: ['Chat', 'Bildanalyse (VL)']
  },
  'DeepSeek': {
    modelle: ['DeepSeek-V3.2', 'DeepSeek-R1'],
    funktionen: ['Chat', 'Reasoning', 'Code-Generierung']
  },
  'Manus': {
    modelle: ['Manus AI'],
    funktionen: ['Chat']
  },
  'Kimi': {
    modelle: ['Kimi AI'],
    funktionen: ['Chat', 'Lange Kontexte']
  },
  'Video-Plattformen': {
    modelle: ['Synthesia.io', 'HeyGen', 'Krea', 'NotebookLM', 'Sonstige'],
    funktionen: ['Video-Generierung', 'Avatar-Erstellung', 'Text-zu-Video']
  },
  'Audio-Plattformen': {
    modelle: ['ElevenLabs.io', 'Sonstige'],
    funktionen: ['Text-zu-Sprache', 'Voice Cloning', 'Audio-Generierung']
  },
  'to-teach': {
    modelle: ['to-teach'],
    funktionen: ['Arbeitsblatt-Generierung', 'Quiz', 'Übungen', 'Differenzierung']
  }
};

// Backward compatibility
export const PLATTFORMEN_MIT_MODELLEN: { [key: string]: string[] } = Object.entries(
  PLATTFORMEN_MIT_MODELLEN_UND_FUNKTIONEN
).reduce((acc, [plattform, data]) => {
  acc[plattform] = data.modelle;
  return acc;
}, {} as { [key: string]: string[] });

export const EMOJIS = ['👍', '❤️', '🔥', '⭐', '💡'];

// KI-Assistenten / KI-Generatoren (eigenes Register)
export const KI_TOOL_TYPEN = ['Assistent', 'Generator'];

export const KI_TOOL_KATEGORIEN = [
  'Text', 'Bild', 'Audio', 'Video', 'Code', 'Präsentation',
  'Recherche', 'Lernen', 'Produktivität', 'Chatbot', 'Sonstiges'
];

export const OUTPUT_FORMATE = [
  'Text', 'HTML', 'Markdown', 'PDF', 'Bild', 'Video',
  'Audio', 'Präsentation', 'Tabelle', 'Code', 'JSON', 'Quiz'
];

export const ANWENDUNGSFAELLE: { [key: string]: string[] } = {
  'Interaktive Internetseiten': [
    'Formative Lernkontrolle', 'Summative Lernkontrolle',
    'Lernfeedback', 'Visualisierung von Lerninhalten'
  ],
  'Design Office Programme': ['Word', 'Excel', 'Powerpoint'],
  'Lerndossier Text': ['Aufgabenblatt', 'Übungsblatt'],
  'Projektmanagement': ['Aktivitätsdossier', 'Aufgabenübersicht'],
  'Administration': ['E-Mail-Texte', 'Informationsbroschüren', 'Flyer'],
  'Prüfungen': ['Fragenvielfalt', 'Fragenarchiv'],
  'KI-Assistenten': [
    'Custom Prompt', 'Lern-Bot', 'Gesprächsbot',
    'Organisationsbot', 'Korrekturbot'
  ],
  'Fotos': ['Photoshop', 'Fotoreportagen'],
  'Grafik und Infografik/Diagramme': ['HTML-Grafik', 'Bild-Grafik'],
  'Design': ['Internetseite', 'Objekte'],
  'Social Media Inhalte': ['Reel', 'Gif', 'Memes']
};

// KI-Assistenten sind tool-übergreifend definiert → für sie ist KEINE Plattform-Angabe nötig.
// Erkennt sowohl die Hauptkategorie als auch ihre Unterkategorien (Gesprächsbot, Lern-Bot, …).
export const KI_ASSISTENTEN_FAELLE = ['KI-Assistenten', ...ANWENDUNGSFAELLE['KI-Assistenten']];
export const istKiAssistentenFall = (faelle: string[]) =>
  faelle.some(fall => KI_ASSISTENTEN_FAELLE.includes(fall));
