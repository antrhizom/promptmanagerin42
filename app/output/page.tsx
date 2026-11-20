import fs from 'fs';
import path from 'path';
import { PageLayout } from '@/components/layout/PageLayout';
import { OutputSammlung } from '@/components/output/OutputSammlung';
import { OUTPUTS } from '@/lib/outputs';

export const metadata = {
  title: 'Output – fertige KI-Ergebnisse ansehen, herunterladen und anpassen',
  description:
    'Sammlung konkreter KI-Outputs für den Unterricht: die Umsetzung direkt ansehen, die Datei herunterladen und den Code per Chat-KI oder KI-Agent ans eigene Thema anpassen. Start mit HTML-Seiten.',
};

// Dateigroessen einmal beim Build ermitteln (die Dateien liegen in public/outputs/).
function dateiGroessen(): Record<string, number> {
  const groessen: Record<string, number> = {};
  for (const eintrag of OUTPUTS) {
    try {
      groessen[eintrag.slug] = fs.statSync(path.join(process.cwd(), 'public', eintrag.datei)).size;
    } catch {
      // Datei fehlt: die Karte zeigt dann einfach keine Groesse an.
    }
  }
  return groessen;
}

export default function OutputPage() {
  return (
    <PageLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-2xl, 1.5rem)', fontWeight: 700, marginBottom: '0.25rem' }}>
          Output
        </h1>
        <p style={{ color: 'var(--color-gray-500, #6b7280)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
          Was am Ende eines Prompts herauskommt: fertige Ergebnisse zum{' '}
          <strong>Ansehen</strong>, <strong>Herunterladen</strong> und{' '}
          <strong>Weiterverwenden</strong>. Jeder Output zeigt die konkrete Umsetzung und liefert den
          Code dazu, damit du ihn per Chat-KI oder KI-Agent an dein eigenes Thema anpassen kannst.
        </p>
        <OutputSammlung groessen={dateiGroessen()} />
      </div>
    </PageLayout>
  );
}
