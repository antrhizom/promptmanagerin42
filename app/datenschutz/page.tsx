import { PageLayout } from '@/components/layout/PageLayout';

export const metadata = {
  title: 'Datenschutz – Promptmanagerin',
  description: 'Welche Daten die Promptmanagerin erfasst, wozu und an wen sie weitergegeben werden.',
};

const h2: React.CSSProperties = { fontSize: 'var(--text-xl, 1.25rem)', fontWeight: 700, margin: '1.6rem 0 0.5rem', color: 'var(--color-gray-900, #111827)' };
const p: React.CSSProperties = { color: 'var(--color-gray-700, #374151)', lineHeight: 1.6, margin: '0 0 0.6rem' };
const li: React.CSSProperties = { color: 'var(--color-gray-700, #374151)', lineHeight: 1.6, marginBottom: '0.35rem' };

export default function DatenschutzPage() {
  return (
    <PageLayout>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-2xl, 1.5rem)', fontWeight: 700, marginBottom: '0.5rem' }}>Datenschutz</h1>
        <p style={{ ...p, color: 'var(--color-gray-500, #6b7280)' }}>
          Diese Seite erklärt einfach und ehrlich, welche Daten erfasst werden. Sie ist keine
          Rechtsberatung, sondern eine transparente Information.
        </p>

        <h2 style={h2}>Wer ist verantwortlich?</h2>
        <p style={p}>
          Digital Learning Hub (DLH), Arbeitsgruppe «Team KI». Web:{' '}
          <a href="https://dlh.zh.ch" target="_blank" rel="noopener noreferrer">dlh.zh.ch</a>.
        </p>

        <h2 style={h2}>Welche Daten werden erfasst?</h2>
        <ul>
          <li style={li}><strong>Anonyme Nutzungsdaten:</strong> Pro Browser-Sitzung eine zufällige ID sowie welche Funktionen/Aktionen angeklickt werden. Damit zählen wir Besuche und sehen, was genutzt wird. <strong>Kein Name, keine IP-Speicherung, kein Personenbezug.</strong></li>
          <li style={li}><strong>Freiwillige E-Mail:</strong> Beim Einreichen von Prompts/Beispielen oder beim Absenden eines Wunsches kannst du freiwillig eine E-Mail angeben. Sie ist nur für die Redaktion sichtbar und wird <strong>nur dann öffentlich angezeigt, wenn du das ausdrücklich erlaubst</strong>.</li>
          <li style={li}><strong>Kommentare:</strong> Beim Kommentieren werden dein selbst gewählter Anzeigename und dein Kommentartext gespeichert. Kommentare erscheinen erst nach Prüfung durch die Redaktion.</li>
        </ul>

        <h2 style={h2}>Wozu?</h2>
        <ul>
          <li style={li}>Betrieb und Verbesserung der Plattform.</li>
          <li style={li}>Benachrichtigung der Redaktion über neue Einreichungen, Kommentare und Wünsche.</li>
        </ul>

        <h2 style={h2}>An wen werden Daten weitergegeben?</h2>
        <ul>
          <li style={li}><strong>Hosting:</strong> Vercel (Auslieferung der Website).</li>
          <li style={li}><strong>Datenbank:</strong> Google Firebase / Firestore (Speicherung der Inhalte).</li>
          <li style={li}><strong>E-Mail-Versand:</strong> Resend (versendet die Benachrichtigungen an die Redaktion).</li>
        </ul>
        <p style={p}>Eine darüber hinausgehende Weitergabe oder ein Verkauf von Daten findet nicht statt.</p>

        <h2 style={h2}>Wichtiger Hinweis</h2>
        <p style={p}>
          Gib in Prompts, Beispielen, Kommentaren oder Wünschen <strong>keine echten Personendaten</strong>
          {' '}oder vertraulichen Inhalte ein (weder von dir noch von Dritten, z. B. Lernenden).
        </p>

        <h2 style={h2}>Auskunft & Löschung</h2>
        <p style={p}>
          Du möchtest deine eingereichten Daten einsehen oder löschen lassen? Melde dich beim
          Digital Learning Hub (DLH) – wir kümmern uns darum.
        </p>
      </div>
    </PageLayout>
  );
}
