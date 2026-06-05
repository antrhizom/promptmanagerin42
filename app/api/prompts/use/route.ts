import { NextRequest, NextResponse } from 'next/server';
import { FIRESTORE_URL, FIRESTORE_API_KEY } from '@/lib/server/firestoreRest';

// Öffentlicher Endpunkt: erhöht den Kopier-Zähler (nutzungsanzahl) um exakt +1.
// Der neue Wert wird serverseitig aus dem aktuellen Stand berechnet, damit Clients
// keine beliebigen Zahlen setzen können. Die Firestore-Regel erlaubt anonym genau diese
// +1-Änderung an nutzungsanzahl (und kein anderes Feld).
export async function POST(request: NextRequest) {
  try {
    const { promptId } = await request.json();
    if (!promptId) {
      return NextResponse.json({ error: 'Missing promptId' }, { status: 400 });
    }

    // Aktuellen Zähler lesen (öffentlich via API-Key).
    const getUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${FIRESTORE_API_KEY}&mask.fieldPaths=nutzungsanzahl`;
    const getRes = await fetch(getUrl);
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = await getRes.json();
    const current = parseInt(doc.fields?.nutzungsanzahl?.integerValue ?? '0', 10) || 0;
    const next = current + 1;

    // Nur das Feld nutzungsanzahl mit +1 patchen (via API-Key; Rule prüft +1).
    const patchUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${FIRESTORE_API_KEY}&updateMask.fieldPaths=nutzungsanzahl`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { nutzungsanzahl: { integerValue: String(next) } } }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/use] Firestore PATCH error:', errText);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, nutzungsanzahl: next });
  } catch (err) {
    console.error('[API/use] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
