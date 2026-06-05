'use client';

// Leichtes, anonymes Tracking für anonyme Besucher.
// Speichert KEINE personenbezogenen Daten — nur eine zufällige Session-ID
// (pro Browser-Tab/Session) sowie Funktions-/Aktions-Namen.

const SESSION_KEY = 'pm_session_id';
const VISIT_KEY = 'pm_visit_tracked';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function send(payload: Record<string, unknown>) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, session: getSessionId() }),
      keepalive: true,
    });
  } catch {
    // Tracking-Fehler sind unkritisch und werden ignoriert.
  }
}

// Einmal pro Session zählen, dass die Seite (ohne Login) genutzt wird.
export function trackVisit() {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(VISIT_KEY)) return;
  sessionStorage.setItem(VISIT_KEY, '1');
  void send({ type: 'visit' });
}

// Eine angewählte KI-Plattform-Funktion (z. B. "Web-Browsing").
export function trackFunction(name: string, plattform?: string) {
  if (!name) return;
  void send({ type: 'function', name, ...(plattform ? { plattform } : {}) });
}

// Eine allgemeine Seiten-Aktion (z. B. "copy", "download", "filter:plattform", "search").
export function trackAction(name: string) {
  if (!name) return;
  void send({ type: 'action', name });
}
