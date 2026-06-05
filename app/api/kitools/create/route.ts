import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FirestoreValue,
  toFirestoreValue,
  authHeaders,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';

// Nur verifizierte Admins dürfen KI-Tools anlegen.
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const toolData = {
      ...body,
      bewertungen: { '👍': 0, '❤️': 0, '🔥': 0, '⭐': 0, '💡': 0 },
      erstelltAm: new Date().toISOString(),
    };

    const fields: Record<string, FirestoreValue> = {};
    for (const [key, value] of Object.entries(toolData)) {
      if (key === 'erstelltAm') {
        fields[key] = { timestampValue: value as string };
      } else {
        fields[key] = toFirestoreValue(value);
      }
    }

    const res = await fetch(`${FIRESTORE_URL}/kiTools`, {
      method: 'POST',
      headers: authHeaders(admin.idToken),
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/kitools/create] Firestore error:', errText);
      const status = res.status === 403 ? 403 : 500;
      return NextResponse.json(
        { error: status === 403 ? 'Kein Admin-Zugriff.' : 'Create failed', details: errText },
        { status }
      );
    }

    const result = await res.json();
    return NextResponse.json({ success: true, id: result.name?.split('/').pop() });
  } catch (err) {
    console.error('[API/kitools/create] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
