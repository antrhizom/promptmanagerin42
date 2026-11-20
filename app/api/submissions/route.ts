import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  toFirestoreValue,
  parseFirestoreDoc,
  authHeaders,
  FirestoreDoc,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';
import { sendAdminEmail } from '@/lib/server/sendEmail';
import { OUTPUT_MAX_BYTES } from '@/lib/constants';

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Output-Einreichung: nur bekannte Felder uebernehmen und die HTML-Datei pruefen.
// Liefert entweder die bereinigten Daten oder eine Fehlermeldung.
function pruefeOutput(data: Record<string, unknown>): { daten?: Record<string, unknown>; fehler?: string } {
  const titel = text(data.titel, 150);
  const html = typeof data.html === 'string' ? data.html : '';
  if (!titel) return { fehler: 'Bitte einen Titel angeben.' };
  if (!html.trim()) return { fehler: 'Bitte eine HTML-Datei auswählen.' };
  const groesse = Buffer.byteLength(html, 'utf8');
  if (groesse > OUTPUT_MAX_BYTES) {
    return { fehler: `Die Datei ist zu gross (${Math.round(groesse / 1024)} KB, erlaubt sind ${Math.round(OUTPUT_MAX_BYTES / 1024)} KB).` };
  }
  if (!/<(!doctype\s+html|html|body|head|div|main|section|script|style)\b/i.test(html)) {
    return { fehler: 'Die Datei sieht nicht nach HTML aus.' };
  }
  const tags = Array.isArray(data.tags)
    ? data.tags.map(t => text(t, 40).replace(/^#/, '')).filter(Boolean).slice(0, 10)
    : [];
  return {
    daten: {
      typ: 'HTML',
      titel,
      beschreibung: text(data.beschreibung, 2000),
      erstelltMit: text(data.erstelltMit, 80),
      dateiname: text(data.dateiname, 120),
      tags,
      groesse,
      html,
    },
  };
}

// POST: öffentlich — eine Einreichung anlegen (status immer 'pending').
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = String(body?.type || '');
    if (!['prompt', 'kitool', 'output'].includes(type)) {
      return NextResponse.json({ error: 'Ungültiger Typ.' }, { status: 400 });
    }
    let data = body?.data;
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Fehlende Daten.' }, { status: 400 });
    }
    if (type === 'output') {
      const geprueft = pruefeOutput(data);
      if (geprueft.fehler) return NextResponse.json({ error: geprueft.fehler }, { status: 400 });
      data = geprueft.daten;
    }
    const autorEmail = typeof body?.autorEmail === 'string' ? body.autorEmail.trim().slice(0, 200) : '';
    if (!autorEmail || !autorEmail.includes('@')) {
      return NextResponse.json({ error: 'Bitte eine gültige E-Mail angeben.' }, { status: 400 });
    }
    const emailOeffentlich = !!body?.emailOeffentlich;

    // Pflichtfeld-Minimalprüfung je Typ
    if (type === 'prompt' && (!data.titel || !data.promptText)) {
      return NextResponse.json({ error: 'Titel und Prompt-Text sind erforderlich.' }, { status: 400 });
    }
    if (type === 'kitool' && (!data.toolId || !data.titel)) {
      return NextResponse.json({ error: 'Bitte einen Generator wählen und einen Titel angeben.' }, { status: 400 });
    }
    if (type === 'kitool' && !data.link && !data.promptText) {
      return NextResponse.json({ error: 'Bitte einen Link oder einen Prompt-Text angeben.' }, { status: 400 });
    }

    const fields = {
      type: toFirestoreValue(type),
      data: toFirestoreValue(data),
      autorEmail: toFirestoreValue(autorEmail),
      emailOeffentlich: toFirestoreValue(emailOeffentlich),
      status: toFirestoreValue('pending'),
      createdAt: { timestampValue: new Date().toISOString() },
    };

    const res = await fetch(`${FIRESTORE_URL}/submissions?key=${FIRESTORE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/submissions] create error:', errText);
      return NextResponse.json({ error: 'Einreichung fehlgeschlagen.' }, { status: 500 });
    }

    // Best-effort Benachrichtigung an Admin (Resend).
    const titel = (data.titel as string) || (data.name as string) || '(ohne Titel)';
    const label = type === 'prompt' ? 'Prompt' : type === 'output' ? 'Output (HTML)' : 'KI-Tool-Beispiel';
    const ziel = type === 'kitool' && data.toolName ? `\nFür Tool: ${data.toolName}` : '';
    await sendAdminEmail(
      `Neue Einreichung (${label}): ${titel}`,
      `Es gibt eine neue Einreichung zur Freischaltung.\n\nTyp: ${label}${ziel}\nTitel: ${titel}\nAutor: ${autorEmail}\n\nZum Prüfen und Freischalten:\nhttps://promptmanagerin42.vercel.app/admin`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/submissions] POST server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: nur Admin — alle Einreichungen (neueste zuerst).
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  try {
    const res = await fetch(`${FIRESTORE_URL}/submissions?pageSize=300`, {
      headers: authHeaders(admin.idToken),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/submissions] list error:', errText);
      return NextResponse.json({ submissions: [] });
    }
    const data = await res.json();
    const submissions = (data.documents || []).map((d: FirestoreDoc) => parseFirestoreDoc(d));
    submissions.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return NextResponse.json({ submissions });
  } catch (err) {
    console.error('[API/submissions] GET server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
