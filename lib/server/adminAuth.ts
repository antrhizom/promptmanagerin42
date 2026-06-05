import { NextRequest } from 'next/server';
import { FIRESTORE_API_KEY } from './firestoreRest';
import { ADMIN_EMAILS } from '@/lib/constants';

// Liest das Bearer-Token aus dem Authorization-Header.
export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export interface AdminVerification {
  ok: boolean;
  status: number;
  email?: string;
  idToken?: string;
  error?: string;
}

// Verifiziert das Firebase-ID-Token serverseitig via Firebase-Auth-REST (accounts:lookup)
// und prüft die E-Mail gegen die Admin-Allow-Liste. Liefert das Token zurück, damit es
// als Bearer an die Firestore-REST-API weitergereicht werden kann (Rules werten request.auth aus).
export async function verifyAdmin(req: NextRequest): Promise<AdminVerification> {
  const idToken = getBearerToken(req);
  if (!idToken) {
    return { ok: false, status: 401, error: 'Kein Anmelde-Token. Bitte als Admin anmelden.' };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIRESTORE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      return { ok: false, status: 401, error: 'Token ungültig oder abgelaufen.' };
    }

    const data = await res.json();
    const user = data.users?.[0];
    const email: string | undefined = user?.email;
    const emailVerified: boolean = !!user?.emailVerified;

    const allowed = !!email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
    if (!allowed) {
      return { ok: false, status: 403, error: 'Kein Admin-Zugriff.' };
    }
    // E-Mail-Verifikation wird empfohlen, aber nicht erzwungen (Konto kann unverifiziert sein).
    void emailVerified;

    return { ok: true, status: 200, email, idToken };
  } catch {
    return { ok: false, status: 500, error: 'Token-Verifikation fehlgeschlagen.' };
  }
}
