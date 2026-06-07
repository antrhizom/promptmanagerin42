import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  authHeaders,
  parseFirestoreDoc,
  FirestoreDoc,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';
import { sendAdminEmail } from '@/lib/server/sendEmail';

// POST: öffentlich — einen Gestaltungs-Wunsch anlegen.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return NextResponse.json({ error: 'Bitte einen Wunsch eingeben.' }, { status: 400 });
    }
    const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 200) : '';

    const fields: Record<string, unknown> = {
      text: { stringValue: text.slice(0, 2000) },
      createdAt: { timestampValue: new Date().toISOString() },
    };
    if (email) fields.email = { stringValue: email };

    const res = await fetch(`${FIRESTORE_URL}/wuensche?key=${FIRESTORE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      console.error('[API/wuensche] write error:', await res.text());
      return NextResponse.json({ error: 'Senden fehlgeschlagen.' }, { status: 500 });
    }

    // Best-effort Benachrichtigung an Admin (Resend).
    await sendAdminEmail(
      'Neuer Wunsch (Gestalte mit)',
      `Ein neuer Gestaltungs-Wunsch ist eingegangen:\n\n${text}\n\nE-Mail: ${email || '(keine angegeben)'}\n\nAlle Wünsche im Dashboard:\nhttps://promptmanagerin42.vercel.app/admin`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/wuensche] POST server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: nur Admin — alle Wünsche (neueste zuerst).
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  try {
    const res = await fetch(`${FIRESTORE_URL}/wuensche?pageSize=300`, {
      headers: authHeaders(admin.idToken),
    });
    if (!res.ok) return NextResponse.json({ wuensche: [] });
    const data = await res.json();
    const wuensche = (data.documents || []).map((d: FirestoreDoc) => parseFirestoreDoc(d));
    wuensche.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return NextResponse.json({ wuensche });
  } catch (err) {
    console.error('[API/wuensche] GET server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
