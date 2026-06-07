// Direkter E-Mail-Versand via Resend (REST, ohne SDK).
// Best-effort: schlägt nie hart fehl und blockiert keine Einreichung.
// Aktiv, sobald die Env-Variablen gesetzt sind:
//   RESEND_API_KEY      – API-Key von resend.com
//   ADMIN_NOTIFY_EMAIL  – Empfängeradresse (Admin)
//   MAIL_FROM           – Absender (optional; Default: Resend-Testabsender)

export async function sendAdminEmail(subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  const from = process.env.MAIL_FROM || 'Promptmanagerin <onboarding@resend.dev>';

  if (!apiKey || !to) {
    // Noch nicht konfiguriert – still überspringen (Daten sind im Dashboard sichtbar).
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) {
      console.error('[sendAdminEmail] Resend error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[sendAdminEmail] error:', err);
    return false;
  }
}
