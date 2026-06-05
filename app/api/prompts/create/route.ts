import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FirestoreValue,
  toFirestoreValue,
  authHeaders,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';

export async function POST(request: NextRequest) {
  // Nur verifizierte Admins dürfen Prompts anlegen.
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();

    // Standardfelder ergänzen
    const promptData = {
      ...body,
      bewertungen: { '👍': 0, '❤️': 0, '🔥': 0, '⭐': 0, '💡': 0 },
      nutzungsanzahl: 0,
      erstelltAm: new Date().toISOString(),
    };

    const fields: Record<string, FirestoreValue> = {};
    for (const [key, value] of Object.entries(promptData)) {
      if (key === 'erstelltAm') {
        fields[key] = { timestampValue: value as string };
      } else {
        fields[key] = toFirestoreValue(value);
      }
    }

    // Schreiben mit dem Admin-ID-Token als Bearer → Firestore-Rules erlauben den Write.
    const url = `${FIRESTORE_URL}/prompts`;
    const res = await fetch(url, {
      method: 'POST',
      headers: authHeaders(admin.idToken),
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/create] Firestore error:', errText);
      const status = res.status === 403 ? 403 : 500;
      return NextResponse.json(
        { error: status === 403 ? 'Kein Admin-Zugriff.' : 'Create failed', details: errText },
        { status }
      );
    }

    const result = await res.json();
    const newId = result.name?.split('/').pop();

    return NextResponse.json({ success: true, id: newId });
  } catch (err) {
    console.error('[API/create] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
