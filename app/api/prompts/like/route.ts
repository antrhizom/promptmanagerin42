import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  parseFirestoreValue,
  toFirestoreValue,
  FirestoreValue,
} from '@/lib/server/firestoreRest';
import { EMOJIS } from '@/lib/constants';

// Öffentlicher Endpunkt: erhöht eine Emoji-Bewertung um +1.
// Der neue Wert wird serverseitig aus dem aktuellen Stand berechnet (keine beliebigen Werte).
// Die Firestore-Regel erlaubt anonym nur Änderungen am Feld 'bewertungen'.
export async function POST(request: NextRequest) {
  try {
    const { promptId, emoji } = await request.json();
    if (!promptId || !emoji || !EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid promptId or emoji' }, { status: 400 });
    }

    // Aktuelle Bewertungen lesen (öffentlich via API-Key).
    const getUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${FIRESTORE_API_KEY}&mask.fieldPaths=bewertungen`;
    const getRes = await fetch(getUrl);
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = await getRes.json();
    const current = (doc.fields?.bewertungen
      ? (parseFirestoreValue(doc.fields.bewertungen as FirestoreValue) as Record<string, number>)
      : {}) || {};

    const updated: Record<string, number> = { ...current };
    updated[emoji] = (Number(updated[emoji]) || 0) + 1;

    const patchUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${FIRESTORE_API_KEY}&updateMask.fieldPaths=bewertungen`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { bewertungen: toFirestoreValue(updated) } }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/like] Firestore PATCH error:', errText);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, bewertungen: updated });
  } catch (err) {
    console.error('[API/like] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
