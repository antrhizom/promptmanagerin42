import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FirestoreValue,
  toFirestoreValue,
  authHeaders,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';

// Generische Prompt-Aktualisierung — ausschließlich für verifizierte Admins
// (Bearbeiten, Soft-Delete, Kommentare verwalten usw.).
// Die anonyme Kopier-Zählung läuft NICHT hierüber, sondern über /api/prompts/use.
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { promptId, data } = body;

    if (!promptId || !data) {
      return NextResponse.json({ error: 'Missing promptId or data' }, { status: 400 });
    }

    // Aktuelles Dokument laden (mit Admin-Token).
    const getUrl = `${FIRESTORE_URL}/prompts/${promptId}`;
    const getRes = await fetch(getUrl, { headers: authHeaders(admin.idToken) });
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const currentDoc = await getRes.json();
    const currentFields = currentDoc.fields || {};

    const updatedFields: Record<string, FirestoreValue> = { ...currentFields };
    for (const [key, value] of Object.entries(data)) {
      updatedFields[key] = toFirestoreValue(value);
    }

    const updateMask = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const patchUrl = `${FIRESTORE_URL}/prompts/${promptId}?${updateMask}`;

    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: authHeaders(admin.idToken),
      body: JSON.stringify({ fields: updatedFields }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/update] Firestore PATCH error:', errText);
      const status = patchRes.status === 403 ? 403 : 500;
      return NextResponse.json(
        { error: status === 403 ? 'Kein Admin-Zugriff.' : 'Update failed', details: errText },
        { status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/update] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
