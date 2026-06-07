import { NextRequest, NextResponse } from 'next/server';
import {
  FIRESTORE_URL,
  FirestoreValue,
  toFirestoreValue,
  parseFirestoreDoc,
  authHeaders,
} from '@/lib/server/firestoreRest';
import { verifyAdmin } from '@/lib/server/adminAuth';

const INIT_BEWERTUNGEN = { '👍': 0, '❤️': 0, '🔥': 0, '⭐': 0, '💡': 0 };

function buildPromptFields(data: Record<string, unknown>, autor: string | null, now: string) {
  const plattform = typeof data.plattform === 'string' ? data.plattform : '';
  const obj: Record<string, unknown> = {
    titel: data.titel || '',
    beschreibung: data.beschreibung || '',
    promptText: data.promptText || '',
    plattformenUndModelle: plattform ? { [plattform]: [] } : {},
    outputFormate: [],
    anwendungsfaelle: [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    bewertungen: INIT_BEWERTUNGEN,
    nutzungsanzahl: 0,
    erstelltVon: autor || 'Community',
  };
  if (typeof data.aboVariante === 'string' && data.aboVariante.trim()) obj.aboVariante = data.aboVariante.trim();
  if (autor) obj.autorEmail = autor;
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  fields.erstelltAm = { timestampValue: now };
  return fields;
}

function buildKiToolFields(data: Record<string, unknown>, autor: string | null, now: string) {
  const obj: Record<string, unknown> = {
    name: data.name || '',
    beschreibung: data.beschreibung || '',
    link: data.link || '',
    typ: data.typ || 'Assistent',
    kategorie: data.kategorie || '',
    plattform: data.plattform || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    bewertungen: INIT_BEWERTUNGEN,
    erstelltVon: autor || 'Community',
  };
  if (autor) obj.autorEmail = autor;
  const fields: Record<string, FirestoreValue> = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  fields.erstelltAm = { timestampValue: now };
  return fields;
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { submissionId, action } = await request.json();
    if (!submissionId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing submissionId or invalid action' }, { status: 400 });
    }

    // Einreichung laden (Admin-Token).
    const getRes = await fetch(`${FIRESTORE_URL}/submissions/${submissionId}`, {
      headers: authHeaders(admin.idToken),
    });
    if (!getRes.ok) {
      return NextResponse.json({ error: 'Einreichung nicht gefunden' }, { status: 404 });
    }
    const sub = parseFirestoreDoc(await getRes.json());
    const now = new Date().toISOString();

    if (action === 'approve') {
      const type = sub.type as string;
      const data = (sub.data as Record<string, unknown>) || {};
      const autor = sub.emailOeffentlich ? (sub.autorEmail as string) : null;

      if (type === 'kitool' && data.toolId) {
        // KI-Tool-Einreichung = Beispiel für ein bestehendes Tool → an dessen beispiele anhängen.
        const toolId = String(data.toolId);
        const toolRes = await fetch(`${FIRESTORE_URL}/kiTools/${toolId}`, {
          headers: authHeaders(admin.idToken),
        });
        if (!toolRes.ok) {
          return NextResponse.json({ error: 'Ziel-Tool nicht gefunden' }, { status: 404 });
        }
        const tool = parseFirestoreDoc(await toolRes.json());
        const beispiele = Array.isArray(tool.beispiele) ? (tool.beispiele as Record<string, unknown>[]) : [];
        const neu: Record<string, unknown> = {
          id: `b_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          titel: data.titel || '',
        };
        if (data.beschreibung) neu.beschreibung = data.beschreibung;
        if (data.link) neu.link = data.link;
        if (data.promptText) neu.promptText = data.promptText;
        if (Array.isArray(data.tags) && data.tags.length > 0) neu.tags = data.tags;
        if (autor) neu.autorEmail = autor;
        const updated = [...beispiele, neu];

        const patch = await fetch(`${FIRESTORE_URL}/kiTools/${toolId}?updateMask.fieldPaths=beispiele`, {
          method: 'PATCH',
          headers: authHeaders(admin.idToken),
          body: JSON.stringify({ fields: { beispiele: toFirestoreValue(updated) } }),
        });
        if (!patch.ok) {
          const errText = await patch.text();
          console.error('[API/submissions/review] beispiel append error:', errText);
          return NextResponse.json({ error: 'Veröffentlichen fehlgeschlagen' }, { status: 500 });
        }
      } else {
        // Prompt-Einreichung (oder Legacy-Tool ohne toolId) → neues Dokument anlegen.
        const target = type === 'prompt' ? 'prompts' : 'kiTools';
        const fields = type === 'prompt'
          ? buildPromptFields(data, autor, now)
          : buildKiToolFields(data, autor, now);

        const createRes = await fetch(`${FIRESTORE_URL}/${target}`, {
          method: 'POST',
          headers: authHeaders(admin.idToken),
          body: JSON.stringify({ fields }),
        });
        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error('[API/submissions/review] publish error:', errText);
          return NextResponse.json({ error: 'Veröffentlichen fehlgeschlagen' }, { status: 500 });
        }
      }
    }

    // Status der Einreichung aktualisieren (approved/rejected).
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const patchRes = await fetch(
      `${FIRESTORE_URL}/submissions/${submissionId}?updateMask.fieldPaths=status`,
      {
        method: 'PATCH',
        headers: authHeaders(admin.idToken),
        body: JSON.stringify({ fields: { status: { stringValue: newStatus } } }),
      }
    );
    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error('[API/submissions/review] status update error:', errText);
      return NextResponse.json({ error: 'Statusaktualisierung fehlgeschlagen' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('[API/submissions/review] Server error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
