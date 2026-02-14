import { NextRequest, NextResponse } from 'next/server';

const FIRESTORE_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'prompt-managerin';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
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

function toFirestoreValue(val: unknown): FirestoreValue {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(obj)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Add default fields
    const promptData = {
      ...body,
      bewertungen: { '👍': 0, '❤️': 0, '🔥': 0, '⭐': 0, '💡': 0 },
      nutzungsanzahl: 0,
      erstelltAm: new Date().toISOString(),
    };

    // Convert to Firestore format
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, value] of Object.entries(promptData)) {
      if (key === 'erstelltAm') {
        fields[key] = { timestampValue: value as string };
      } else {
        fields[key] = toFirestoreValue(value);
      }
    }

    const url = `${FIRESTORE_URL}/prompts?key=${API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/create] Firestore error:', errText);
      return NextResponse.json({ error: 'Create failed', details: errText }, { status: 500 });
    }

    const result = await res.json();
    const newId = result.name?.split('/').pop();

    return NextResponse.json({ success: true, id: newId });
  } catch (err) {
    console.error('[API/create] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
