import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  parseFirestoreValue,
  toFirestoreValue,
  FirestoreValue,
} from '@/lib/server/firestoreRest';

interface Kommentar {
  id: string;
  userCode: string;
  userName: string;
  text: string;
  timestamp: string;
}

// Öffentlicher Endpunkt: hängt einen Kommentar an.
// Login-Pflicht wird in der App erzwungen (userCode/userName müssen vorhanden sein).
// Die Firestore-Regel erlaubt anonym nur Änderungen am Feld 'kommentare'.
export async function POST(request: NextRequest) {
  try {
    const { promptId, text, userName, userCode } = await request.json();

    if (!promptId || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Missing promptId or text' }, { status: 400 });
    }
    // Login-Pflicht (serverseitige Mindestprüfung, dass eine Identität mitkommt).
    if (!userCode || !userName || typeof userName !== 'string') {
      return NextResponse.json({ error: 'Login erforderlich, um zu kommentieren.' }, { status: 401 });
    }
    if (text.length > 1000) {
      return NextResponse.json({ error: 'Kommentar zu lang.' }, { status: 400 });
    }

    // Aktuelle Kommentare lesen.
    const getUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${FIRESTORE_API_KEY}&mask.fieldPaths=kommentare`;
    const getRes = await fetch(getUrl);
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const doc = await getRes.json();
    const current = (doc.fields?.kommentare
      ? (parseFirestoreValue(doc.fields.kommentare as FirestoreValue) as Kommentar[])
      : []) || [];

    const neuerKommentar: Kommentar = {
      id: `${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      userCode: String(userCode).slice(0, 40),
      userName: String(userName).slice(0, 100),
      text: text.trim().slice(0, 1000),
      timestamp: new Date().toISOString(),
    };
    const updated = [...current, neuerKommentar];

    const patchUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${FIRESTORE_API_KEY}&updateMask.fieldPaths=kommentare`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { kommentare: toFirestoreValue(updated) } }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/comment] Firestore PATCH error:', errText);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, kommentar: neuerKommentar });
  } catch (err) {
    console.error('[API/comment] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
