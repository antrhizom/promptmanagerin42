import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  authHeaders,
  parseFirestoreDoc,
  FirestoreDoc,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';

const ALLOWED_TYPES = ['visit', 'function', 'action'];

// Tages-Schlüssel (YYYY-MM-DD) in Schweizer Zeit, damit der Verlauf zur
// gelebten Nutzung passt und nicht an der UTC-Grenze umspringt.
const DAY_FORMATTER = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Zurich',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toDayKey(iso: unknown): string | null {
  if (typeof iso !== 'string' || !iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return DAY_FORMATTER.format(date);
}

// Lückenlose Tagesreihe vom ersten bis zum letzten Event, damit stille Tage
// im Diagramm als Null sichtbar bleiben.
function fillDayGaps(first: string, last: string): string[] {
  const result: string[] = [];
  const cursor = new Date(`${first}T12:00:00Z`);
  const end = new Date(`${last}T12:00:00Z`);
  while (cursor <= end && result.length < 1000) {
    result.push(DAY_FORMATTER.format(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

// POST: öffentlich — legt ein Analytics-Event an (append-only, via API-Key).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = String(body?.type || '');
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const fields: Record<string, unknown> = {
      type: { stringValue: type },
      ts: { timestampValue: new Date().toISOString() },
    };
    if (typeof body.name === 'string' && body.name.length > 0) {
      fields.name = { stringValue: body.name.slice(0, 120) };
    }
    if (typeof body.plattform === 'string' && body.plattform.length > 0) {
      fields.plattform = { stringValue: body.plattform.slice(0, 120) };
    }
    if (typeof body.session === 'string' && body.session.length > 0) {
      fields.session = { stringValue: body.session.slice(0, 80) };
    }

    const url = `${FIRESTORE_URL}/analytics?key=${FIRESTORE_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/analytics] write error:', errText);
      return NextResponse.json({ error: 'Write failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/analytics] POST server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: nur Admin — liest Events (mit Admin-Bearer) und aggregiert für das Dashboard.
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const docs: Record<string, unknown>[] = [];
    let pageToken: string | undefined;
    const MAX_PAGES = 20; // Schutz-Cap: bis zu ~6000 Events

    for (let page = 0; page < MAX_PAGES; page++) {
      const url =
        `${FIRESTORE_URL}/analytics?pageSize=300` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
      const res = await fetch(url, { headers: authHeaders(admin.idToken) });
      if (!res.ok) {
        const errText = await res.text();
        console.error('[API/analytics] read error:', errText);
        const status = res.status === 403 ? 403 : 500;
        return NextResponse.json(
          { error: status === 403 ? 'Kein Admin-Zugriff.' : 'Read failed' },
          { status }
        );
      }
      const data = await res.json();
      (data.documents || []).forEach((d: FirestoreDoc) => docs.push(parseFirestoreDoc(d)));
      pageToken = data.nextPageToken;
      if (!pageToken) break;
    }

    const sessions = new Set<string>();
    let visitEvents = 0;
    const functionCounts = new Map<string, { name: string; plattform: string; count: number }>();
    const plattformCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();

    // Zeitlicher Verlauf: pro Tag ein Eimer mit den drei Event-Typen und den
    // an diesem Tag gesehenen Sessions.
    interface DayBucket {
      visits: number;
      functions: number;
      actions: number;
      sessions: Set<string>;
    }
    const dayBuckets = new Map<string, DayBucket>();
    const bucketFor = (day: string): DayBucket => {
      let bucket = dayBuckets.get(day);
      if (!bucket) {
        bucket = { visits: 0, functions: 0, actions: 0, sessions: new Set<string>() };
        dayBuckets.set(day, bucket);
      }
      return bucket;
    };

    for (const ev of docs) {
      const type = ev.type as string;
      const session = ev.session as string | undefined;
      const name = (ev.name as string | undefined) || '';
      const plattform = (ev.plattform as string | undefined) || '';

      if (session) sessions.add(session);

      const day = toDayKey(ev.ts);
      if (day) {
        const bucket = bucketFor(day);
        if (session) bucket.sessions.add(session);
        if (type === 'visit') bucket.visits++;
        else if (type === 'function') bucket.functions++;
        else if (type === 'action') bucket.actions++;
      }

      if (type === 'visit') {
        visitEvents++;
      } else if (type === 'function') {
        const key = `${plattform}||${name}`;
        const entry = functionCounts.get(key) || { name, plattform, count: 0 };
        entry.count++;
        functionCounts.set(key, entry);
        if (plattform) plattformCounts.set(plattform, (plattformCounts.get(plattform) || 0) + 1);
      } else if (type === 'action') {
        if (name) actionCounts.set(name, (actionCounts.get(name) || 0) + 1);
      }
    }

    const functions = Array.from(functionCounts.values()).sort((a, b) => b.count - a.count);
    const functionsByPlattform = Array.from(plattformCounts.entries())
      .map(([plattform, count]) => ({ plattform, count }))
      .sort((a, b) => b.count - a.count);
    const actions = Array.from(actionCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const usedDays = Array.from(dayBuckets.keys()).sort();
    const allDays = usedDays.length > 0
      ? fillDayGaps(usedDays[0], usedDays[usedDays.length - 1])
      : [];
    const timeline = allDays.map(date => {
      const bucket = dayBuckets.get(date);
      return {
        date,
        visitors: bucket ? bucket.sessions.size : 0,
        visits: bucket ? bucket.visits : 0,
        functions: bucket ? bucket.functions : 0,
        actions: bucket ? bucket.actions : 0,
      };
    });

    return NextResponse.json({
      visitors: sessions.size,
      visitEvents,
      totalFunctionClicks: functions.reduce((s, f) => s + f.count, 0),
      totalActions: actions.reduce((s, a) => s + a.count, 0),
      functions,
      functionsByPlattform,
      actions,
      timeline,
    });
  } catch (err) {
    console.error('[API/analytics] GET server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
