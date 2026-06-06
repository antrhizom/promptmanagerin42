import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  parseFirestoreValue,
  toFirestoreValue,
  FirestoreValue,
} from '@/lib/server/firestoreRest';
import { EMOJIS } from '@/lib/constants';

// Öffentlicher Endpunkt: erhöht eine Emoji-Bewertung eines KONKRETEN BEISPIELS um +1.
// Die Likes liegen in der Map `beispielBewertungen` (pro Beispiel-ID) — getrennt von den
// (admin-kuratierten) Beispielen. Nur dieses Feld wird geändert (Regel erlaubt das anonym).
export async function POST(request: NextRequest) {
  try {
    const { toolId, beispielId, emoji } = await request.json();
    if (!toolId || !beispielId || !emoji || !EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'Invalid toolId, beispielId or emoji' }, { status: 400 });
    }

    const getUrl = `${FIRESTORE_URL}/kiTools/${toolId}?key=${FIRESTORE_API_KEY}&mask.fieldPaths=beispielBewertungen`;
    const getRes = await fetch(getUrl);
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = await getRes.json();
    const current = (doc.fields?.beispielBewertungen
      ? (parseFirestoreValue(doc.fields.beispielBewertungen as FirestoreValue) as Record<string, Record<string, number>>)
      : {}) || {};

    const fuerBeispiel = { ...(current[beispielId] || {}) };
    fuerBeispiel[emoji] = (Number(fuerBeispiel[emoji]) || 0) + 1;
    const updated = { ...current, [beispielId]: fuerBeispiel };

    const patchUrl = `${FIRESTORE_URL}/kiTools/${toolId}?key=${FIRESTORE_API_KEY}&updateMask.fieldPaths=beispielBewertungen`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { beispielBewertungen: toFirestoreValue(updated) } }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/kitools/like] Firestore PATCH error:', errText);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, beispielBewertungen: updated });
  } catch (err) {
    console.error('[API/kitools/like] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
