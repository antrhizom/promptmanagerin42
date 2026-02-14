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
    // Check if it's a Firestore timestamp-like object
    const obj = val as Record<string, unknown>;
    if (obj.seconds && obj.nanoseconds !== undefined) {
      const seconds = Number(obj.seconds);
      const nanos = Number(obj.nanoseconds);
      const date = new Date(seconds * 1000 + nanos / 1000000);
      return { timestampValue: date.toISOString() };
    }
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
    const { promptId, data } = body;

    if (!promptId || !data) {
      return NextResponse.json({ error: 'Missing promptId or data' }, { status: 400 });
    }

    // First get the current document
    const getUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${API_KEY}`;
    const getRes = await fetch(getUrl);
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const currentDoc = await getRes.json();
    const currentFields = currentDoc.fields || {};

    // Merge updates into current fields
    const updatedFields = { ...currentFields };
    for (const [key, value] of Object.entries(data)) {
      updatedFields[key] = toFirestoreValue(value);
    }

    // Update the document via PATCH
    const updateMask = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const patchUrl = `${FIRESTORE_URL}/prompts/${promptId}?key=${API_KEY}&${updateMask}`;

    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: updatedFields })
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/update] Firestore PATCH error:', errText);
      return NextResponse.json({ error: 'Update failed', details: errText }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/update] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
