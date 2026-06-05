import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  parseFirestoreValue,
  toFirestoreValue,
  FirestoreValue,
} from '@/lib/server/firestoreRest';
import { EMOJIS } from '@/lib/constants';

// Öffentlicher Endpunkt: erhöht eine Emoji-Bewertung eines KI-Tools um +1 (serverkontrolliert).
export async function POST(request: NextRequest) {
  try {
    const { toolId, emoji } = await request.json();
    if (!toolId || !emoji || !EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid toolId or emoji' }, { status: 400 });
    }

    const getUrl = `${FIRESTORE_URL}/kiTools/${toolId}?key=${FIRESTORE_API_KEY}&mask.fieldPaths=bewertungen`;
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

    const patchUrl = `${FIRESTORE_URL}/kiTools/${toolId}?key=${FIRESTORE_API_KEY}&updateMask.fieldPaths=bewertungen`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { bewertungen: toFirestoreValue(updated) } }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/kitools/like] Firestore PATCH error:', errText);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, bewertungen: updated });
  } catch (err) {
    console.error('[API/kitools/like] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
