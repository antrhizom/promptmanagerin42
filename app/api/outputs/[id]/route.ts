import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  authHeaders,
  parseFirestoreDoc,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';
import { kurzname } from '@/lib/outputs';

type Kontext = { params: Promise<{ id: string }> };

const GUELTIGE_ID = /^[A-Za-z0-9_-]{1,64}$/;

// Gleiche Abschottung wie fuer public/outputs/* (siehe next.config.js): Scripts im
// hochgeladenen HTML laufen, haben aber keinen Zugriff auf Anmeldung, Speicher
// oder Cookies der Promptmanagerin — auch nicht, wenn die Datei direkt im Tab
// geoeffnet wird.
const SANDBOX = 'sandbox allow-scripts allow-forms allow-modals allow-popups allow-downloads';

// GET: oeffentlich — liefert die HTML-Datei eines freigeschalteten Outputs.
// Mit ?download=1 als Datei zum Speichern.
export async function GET(request: NextRequest, { params }: Kontext) {
  const { id } = await params;
  if (!GUELTIGE_ID.test(id)) {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
  }
  try {
    const res = await fetch(`${FIRESTORE_URL}/outputs/${id}?key=${FIRESTORE_API_KEY}`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: 'Output nicht gefunden' }, { status: 404 });
    }
    const doc = parseFirestoreDoc(await res.json());
    const html = typeof doc.html === 'string' ? doc.html : '';
    if (!html) {
      return NextResponse.json({ error: 'Output nicht gefunden' }, { status: 404 });
    }
    const headers: Record<string, string> = {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': SANDBOX,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    };
    if (request.nextUrl.searchParams.get('download') === '1') {
      // Gleicher Dateiname wie im download-Attribut der Karte (Kurzname + ID-Anfang).
      const name = `${kurzname(String(doc.titel || ''))}-${id.slice(0, 6).toLowerCase()}.html`;
      headers['Content-Disposition'] = `attachment; filename="${name}"`;
    }
    return new NextResponse(html, { status: 200, headers });
  } catch (err) {
    console.error('[API/outputs/id] GET server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: nur Admin — entfernt einen freigeschalteten Output.
export async function DELETE(request: NextRequest, { params }: Kontext) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  const { id } = await params;
  if (!GUELTIGE_ID.test(id)) {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
  }
  const res = await fetch(`${FIRESTORE_URL}/outputs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(admin.idToken),
  });
  if (!res.ok) {
    console.error('[API/outputs/id] delete error:', await res.text());
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
