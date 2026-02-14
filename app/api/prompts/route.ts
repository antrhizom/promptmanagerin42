import { NextResponse } from 'next/server';

// Server-side Firestore access via REST API
// This runs on the Vercel server, bypassing any client network restrictions
const FIRESTORE_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'prompt-managerin';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents`;

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
  nullValue?: null;
}

function parseFirestoreValue(val: FirestoreValue): unknown {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.nullValue !== undefined) return null;
  if (val.mapValue?.fields) {
    const obj: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(val.mapValue.fields)) {
      obj[key] = parseFirestoreValue(v);
    }
    return obj;
  }
  if (val.arrayValue) {
    return (val.arrayValue.values || []).map(v => parseFirestoreValue(v));
  }
  return null;
}

function parseFirestoreDoc(doc: { name: string; fields?: Record<string, FirestoreValue> }) {
  const id = doc.name.split('/').pop();
  const data: Record<string, unknown> = {};
  if (doc.fields) {
    for (const [key, val] of Object.entries(doc.fields)) {
      data[key] = parseFirestoreValue(val);
    }
  }
  return { id, ...data };
}

export async function GET() {
  try {
    // Fetch all prompts via Firestore REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const url = `${FIRESTORE_URL}/prompts?key=${apiKey}&orderBy=erstelltAm desc&pageSize=200`;

    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      // Fallback: try without orderBy (in case index is missing)
      const fallbackUrl = `${FIRESTORE_URL}/prompts?key=${apiKey}&pageSize=200`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 30 }
      });

      if (!fallbackResponse.ok) {
        const errText = await fallbackResponse.text();
        console.error('[API/prompts] Firestore error:', errText);
        return NextResponse.json(
          { error: 'Firestore Fehler', details: errText },
          { status: 500 }
        );
      }

      const fallbackData = await fallbackResponse.json();
      const prompts = (fallbackData.documents || [])
        .map(parseFirestoreDoc)
        .filter((p: Record<string, unknown>) => !p.deleted);

      return NextResponse.json({ prompts, source: 'api-fallback' });
    }

    const data = await response.json();
    const prompts = (data.documents || [])
      .map(parseFirestoreDoc)
      .filter((p: Record<string, unknown>) => !p.deleted);

    return NextResponse.json({ prompts, source: 'api' });
  } catch (err) {
    console.error('[API/prompts] Server error:', err);
    return NextResponse.json(
      { error: 'Server Fehler', details: String(err) },
      { status: 500 }
    );
  }
}
