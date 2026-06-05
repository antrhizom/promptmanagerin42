import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FirestoreValue,
  toFirestoreValue,
  authHeaders,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';

// Generische KI-Tool-Aktualisierung — nur verifizierte Admins (Bearbeiten, Soft-Delete).
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { toolId, data } = await request.json();
    if (!toolId || !data) {
      return NextResponse.json({ error: 'Missing toolId or data' }, { status: 400 });
    }

    const getRes = await fetch(`${FIRESTORE_URL}/kiTools/${toolId}`, {
      headers: authHeaders(admin.idToken),
    });
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const currentDoc = await getRes.json();
    const updatedFields: Record<string, FirestoreValue> = { ...(currentDoc.fields || {}) };
    for (const [key, value] of Object.entries(data)) {
      updatedFields[key] = toFirestoreValue(value);
    }

    const updateMask = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const patchRes = await fetch(`${FIRESTORE_URL}/kiTools/${toolId}?${updateMask}`, {
      method: 'PATCH',
      headers: authHeaders(admin.idToken),
      body: JSON.stringify({ fields: updatedFields }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/kitools/update] Firestore PATCH error:', errText);
      const status = patchRes.status === 403 ? 403 : 500;
      return NextResponse.json(
        { error: status === 403 ? 'Kein Admin-Zugriff.' : 'Update failed', details: errText },
        { status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/kitools/update] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
