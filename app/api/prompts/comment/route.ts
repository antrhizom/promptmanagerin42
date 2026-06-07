import { NextRequest, NextResponse } from 'next/server';
import { FIRESTORE_URL, FIRESTORE_API_KEY, toFirestoreValue } from '@/lib/server/firestoreRest';
import { sendAdminEmail } from '@/lib/server/sendEmail';

// Öffentlicher Endpunkt: legt einen Kommentar als MODERIERTE Einreichung an
// (status 'pending'). Er erscheint erst nach Freigabe durch den Admin beim Prompt.
// So kann niemand mehr fremde Kommentare überschreiben oder Spam sofort sichtbar machen.
export async function POST(request: NextRequest) {
  try {
    const { promptId, text, userName, userCode } = await request.json();

    if (!promptId || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Missing promptId or text' }, { status: 400 });
    }
    if (!userCode || !userName || typeof userName !== 'string') {
      return NextResponse.json({ error: 'Login erforderlich, um zu kommentieren.' }, { status: 401 });
    }
    if (text.length > 1000) {
      return NextResponse.json({ error: 'Kommentar zu lang.' }, { status: 400 });
    }

    // Prompt-Titel für den Kontext im Dashboard holen (best effort).
    let promptTitel = '';
    try {
      const getRes = await fetch(`${FIRESTORE_URL}/prompts/${promptId}?key=${FIRESTORE_API_KEY}&mask.fieldPaths=titel`);
      if (getRes.ok) {
        const doc = await getRes.json();
        promptTitel = doc.fields?.titel?.stringValue || '';
      }
    } catch { /* egal */ }

    const data = {
      promptId: String(promptId),
      promptTitel,
      text: text.trim().slice(0, 1000),
      userName: String(userName).slice(0, 100),
      userCode: String(userCode).slice(0, 40),
    };

    const fields = {
      type: toFirestoreValue('comment'),
      data: toFirestoreValue(data),
      autorEmail: toFirestoreValue(''),
      emailOeffentlich: toFirestoreValue(false),
      status: toFirestoreValue('pending'),
      createdAt: { timestampValue: new Date().toISOString() },
    };

    const res = await fetch(`${FIRESTORE_URL}/submissions?key=${FIRESTORE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      console.error('[API/comment] create error:', await res.text());
      return NextResponse.json({ error: 'Senden fehlgeschlagen.' }, { status: 500 });
    }

    await sendAdminEmail(
      'Neuer Kommentar zur Freischaltung',
      `Ein neuer Kommentar wartet auf Freigabe.\n\nZu Prompt: ${promptTitel || data.promptId}\nVon: ${data.userName}\n\n"${data.text}"\n\nIm Dashboard freischalten:\nhttps://promptmanagerin42.vercel.app/admin`
    );

    return NextResponse.json({ success: true, pending: true });
  } catch (err) {
    console.error('[API/comment] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
