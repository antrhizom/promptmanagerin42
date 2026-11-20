'use client';

// Leichtes, anonymes Tracking für Besucher ohne Login.
// Speichert KEINE personenbezogenen Daten — nur eine zufällige Browser-Nummer
// sowie Seiten-, Funktions- und Aktions-Namen.

// Zufällige, anonyme Nummer pro Browser (bleibt erhalten, bis die Website-Daten
// gelöscht werden). Präfix «b_», damit sie sich von den früheren Nummern pro Tab
// unterscheidet. Wird im bestehenden Feld «session» gespeichert.
const BROWSER_KEY = 'pm_browser_id';
// Fallback, falls der Browser keinen dauerhaften Speicher erlaubt.
const SESSION_KEY = 'pm_session_id';
// Browser der Redaktion: sendet gar nichts (siehe markiereAlsIntern).
const INTERN_KEY = 'pm_intern';
// Seitenaufruf je Seite und Tag nur einmal senden.
const VISIT_PREFIX = 'pm_visit:';

function speicher(): Storage | null {
  try {
    const s = window.localStorage;
    s.setItem('pm_test', '1');
    s.removeItem('pm_test');
    return s;
  } catch {
    return null;
  }
}

function neueId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export function getBrowserId(): string {
  if (typeof window === 'undefined') return '';
  const dauerhaft = speicher();
  if (dauerhaft) {
    let id = dauerhaft.getItem(BROWSER_KEY);
    if (!id) {
      id = `b_${neueId()}`;
      dauerhaft.setItem(BROWSER_KEY, id);
    }
    return id;
  }
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = neueId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

function istIntern(): boolean {
  return speicher()?.getItem(INTERN_KEY) === '1';
}

async function send(payload: Record<string, unknown>, auchIntern = false) {
  if (typeof window === 'undefined') return;
  if (!auchIntern && istIntern()) return;
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, session: getBrowserId() }),
      keepalive: true,
    });
  } catch {
    // Tracking-Fehler sind unkritisch und werden ignoriert.
  }
}

// Diesen Browser als «Redaktion» markieren: Die Auswertung blendet alle Ereignisse
// dieses Browsers aus (auch frühere), und ab jetzt wird nichts mehr gesendet.
// Wird beim Öffnen des Dashboards aufgerufen.
export function markiereAlsIntern() {
  const s = speicher();
  if (!s || s.getItem(INTERN_KEY) === '1') return;
  void send({ type: 'action', name: 'intern' }, true);
  s.setItem(INTERN_KEY, '1');
}

// Seitenaufruf zählen (mit Pfad, z. B. "/" oder "/ki-tools"): höchstens einmal
// pro Browser, Seite und Tag. Die Auswertung zählt zusätzlich serverseitig so.
export function trackVisit(page?: string) {
  if (typeof window === 'undefined') return;
  const name = page || window.location.pathname || '/';
  const s = speicher();
  if (s) {
    const heute = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, lokale Zeit
    const key = `${VISIT_PREFIX}${heute}:${name}`;
    if (s.getItem(key)) return;
    // Einträge früherer Tage aufräumen.
    for (let i = s.length - 1; i >= 0; i--) {
      const k = s.key(i);
      if (k && k.startsWith(VISIT_PREFIX) && !k.startsWith(`${VISIT_PREFIX}${heute}:`)) s.removeItem(k);
    }
    s.setItem(key, '1');
  }
  void send({ type: 'visit', name });
}

// Ein angeklicktes Funktions-Badge (z. B. "Web-Browsing").
export function trackFunction(name: string, plattform?: string) {
  if (!name) return;
  void send({ type: 'function', name, ...(plattform ? { plattform } : {}) });
}

// Eine allgemeine Seiten-Aktion (z. B. "prompt-kopiert", "filter:plattform").
export function trackAction(name: string) {
  if (!name) return;
  void send({ type: 'action', name });
}
