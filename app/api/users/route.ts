import { NextRequest, NextResponse } from 'next/server';

const FIRESTORE_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'prompt-managerin';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/(default)/documents`;

// GET: Check if user exists by code
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const url = `${FIRESTORE_URL}/users/${code}?key=${API_KEY}`;
    const res = await fetch(url);

    if (res.status === 404) {
      return NextResponse.json({ exists: false });
    }

    if (!res.ok) {
      const errText = await res.text();
      // Check if it's a NOT_FOUND error in the response body
      if (errText.includes('NOT_FOUND')) {
        return NextResponse.json({ exists: false });
      }
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    const doc = await res.json();
    const username = doc.fields?.username?.stringValue || '';
    return NextResponse.json({ exists: true, username });
  } catch (err) {
    console.error('[API/users] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: Create or update user
export async function POST(request: NextRequest) {
  try {
    const { code, username } = await request.json();
    if (!code || !username) {
      return NextResponse.json({ error: 'Missing code or username' }, { status: 400 });
    }

    const url = `${FIRESTORE_URL}/users?key=${API_KEY}&documentId=${code}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          username: { stringValue: username },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      })
    });

    if (!res.ok) {
      // If already exists, try PATCH
      const patchUrl = `${FIRESTORE_URL}/users/${code}?key=${API_KEY}&updateMask.fieldPaths=username`;
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            username: { stringValue: username },
            createdAt: { timestampValue: new Date().toISOString() }
          }
        })
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        return NextResponse.json({ error: errText }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/users] POST error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
