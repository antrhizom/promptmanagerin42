import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FIRESTORE_API_KEY,
  toFirestoreValue,
  parseFirestoreDoc,
  authHeaders,
  FirestoreDoc,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';
import { sendAdminEmail } from '@/lib/server/sendEmail';

// POST: öffentlich — eine Einreichung anlegen (status immer 'pending').
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = String(body?.type || '');
    if (!['prompt', 'kitool'].includes(type)) {
      return NextResponse.json({ error: 'Ungültiger Typ.' }, { status: 400 });
    }
    const data = body?.data;
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Fehlende Daten.' }, { status: 400 });
    }
    const autorEmail = typeof body?.autorEmail === 'string' ? body.autorEmail.trim().slice(0, 200) : '';
    if (!autorEmail || !autorEmail.includes('@')) {
      return NextResponse.json({ error: 'Bitte eine gültige E-Mail angeben.' }, { status: 400 });
    }
    const emailOeffentlich = !!body?.emailOeffentlich;

    // Pflichtfeld-Minimalprüfung je Typ
    if (type === 'prompt' && (!data.titel || !data.promptText)) {
      return NextResponse.json({ error: 'Titel und Prompt-Text sind erforderlich.' }, { status: 400 });
    }
    if (type === 'kitool' && (!data.toolId || !data.titel)) {
      return NextResponse.json({ error: 'Bitte einen Generator wählen und einen Titel angeben.' }, { status: 400 });
    }
    if (type === 'kitool' && !data.link && !data.promptText) {
      return NextResponse.json({ error: 'Bitte einen Link oder einen Prompt-Text angeben.' }, { status: 400 });
    }

    const fields = {
      type: toFirestoreValue(type),
      data: toFirestoreValue(data),
      autorEmail: toFirestoreValue(autorEmail),
      emailOeffentlich: toFirestoreValue(emailOeffentlich),
      status: toFirestoreValue('pending'),
      createdAt: { timestampValue: new Date().toISOString() },
    };

    const res = await fetch(`${FIRESTORE_URL}/submissions?key=${FIRESTORE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/submissions] create error:', errText);
      return NextResponse.json({ error: 'Einreichung fehlgeschlagen.' }, { status: 500 });
    }

    // Best-effort Benachrichtigung an Admin (Resend).
    const titel = (data.titel as string) || (data.name as string) || '(ohne Titel)';
    const label = type === 'prompt' ? 'Prompt' : 'KI-Tool-Beispiel';
    const ziel = type === 'kitool' && data.toolName ? `\nFür Tool: ${data.toolName}` : '';
    await sendAdminEmail(
      `Neue Einreichung (${label}): ${titel}`,
      `Es gibt eine neue Einreichung zur Freischaltung.\n\nTyp: ${label}${ziel}\nTitel: ${titel}\nAutor: ${autorEmail}\n\nZum Prüfen und Freischalten:\nhttps://promptmanagerin42.vercel.app/admin`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/submissions] POST server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: nur Admin — alle Einreichungen (neueste zuerst).
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  try {
    const res = await fetch(`${FIRESTORE_URL}/submissions?pageSize=300`, {
      headers: authHeaders(admin.idToken),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[API/submissions] list error:', errText);
      return NextResponse.json({ submissions: [] });
    }
    const data = await res.json();
    const submissions = (data.documents || []).map((d: FirestoreDoc) => parseFirestoreDoc(d));
    submissions.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return NextResponse.json({ submissions });
  } catch (err) {
    console.error('[API/submissions] GET server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
