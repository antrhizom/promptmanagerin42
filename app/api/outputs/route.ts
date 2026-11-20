import { NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  parseFirestoreDoc,
  FirestoreDoc,
} from '@/lib/server/firestoreRest';

// Felder fuer die Liste. Das (grosse) Feld html wird bewusst NICHT geladen;
// die Datei selbst liefert /api/outputs/[id].
const LISTEN_FELDER = ['typ', 'titel', 'beschreibung', 'tags', 'erstelltMit', 'dateiname', 'groesse', 'autorEmail', 'erstelltAm'];

// GET: oeffentlich — freigeschaltete Community-Outputs, neueste zuerst.
export async function GET() {
  try {
    const maske = LISTEN_FELDER.map(f => `mask.fieldPaths=${f}`).join('&');
    const res = await fetch(`${FIRESTORE_URL}/outputs?pageSize=300&${maske}&key=${FIRESTORE_API_KEY}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      // z. B. Regeln noch nicht veroeffentlicht: die Seite zeigt dann nur die festen Outputs.
      console.error('[API/outputs] list error:', res.status, await res.text());
      return NextResponse.json({ outputs: [] });
    }
    const data = await res.json();
    const outputs = (data.documents || []).map((d: FirestoreDoc) => parseFirestoreDoc(d));
    outputs.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.erstelltAm || '').localeCompare(String(a.erstelltAm || '')));
    return NextResponse.json({ outputs });
  } catch (err) {
    console.error('[API/outputs] GET server error:', err);
    return NextResponse.json({ outputs: [] });
  }
}
