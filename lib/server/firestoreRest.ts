// Gemeinsame Helfer für den serverseitigen Firestore-REST-Zugriff.
// Wird von allen API-Routes genutzt, um Code-Duplizierung zu vermeiden.

export const FIRESTORE_PROJECT =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'prompt-managerin';
export const FIRESTORE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
export const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents`;

export interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
  nullValue?: null;
}

export interface FirestoreDoc {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

export function toFirestoreValue(val: unknown): FirestoreValue {
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
    // Firestore-Timestamp-ähnliches Objekt {seconds, nanoseconds}
    if (obj.seconds !== undefined && obj.nanoseconds !== undefined) {
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

export function parseFirestoreValue(val: FirestoreValue): unknown {
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

export function parseFirestoreDoc(doc: FirestoreDoc): Record<string, unknown> {
  const id = doc.name.split('/').pop();
  const data: Record<string, unknown> = {};
  if (doc.fields) {
    for (const [key, val] of Object.entries(doc.fields)) {
      data[key] = parseFirestoreValue(val);
    }
  }
  return { id, ...data };
}

// Authentifizierungs-Header für privilegierte Writes (Admin-ID-Token) bzw.
// öffentliche, regelgeprüfte Writes (API-Key).
export function authHeaders(idToken?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  return headers;
}
