import { NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  parseFirestoreDoc,
  FirestoreDoc,
} from '@/lib/server/firestoreRest';

// GET: öffentliche Liste aller KI-Tools (nicht gelöscht).
export async function GET() {
  try {
    const url = `${FIRESTORE_URL}/kiTools?key=${FIRESTORE_API_KEY}&pageSize=300`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text();
      // Leere Collection liefert evtl. Fehler/leere Liste — sauber als leer behandeln.
      console.warn('[API/kitools] Firestore response not ok:', errText);
      return NextResponse.json({ tools: [] });
    }

    const data = await response.json();
    const tools = (data.documents || [])
      .map((d: FirestoreDoc) => parseFirestoreDoc(d))
      .filter((t: Record<string, unknown>) => !t.deleted);

    return NextResponse.json({ tools });
  } catch (err) {
    console.error('[API/kitools] Server error:', err);
    return NextResponse.json({ error: 'Server Fehler', details: String(err) }, { status: 500 });
  }
}
