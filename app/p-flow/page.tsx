import { PageLayout } from '@/components/layout/PageLayout';
import { PFlow } from '@/components/pflow/PFlow';

export const metadata = {
  title: 'P-Flow – Welcher KI-Weg passt zu meinem Unterricht?',
  description:
    'Interaktives Flussdiagramm: Klärt Schritt für Schritt, was du mit KI gestalten willst, was im Austausch zwischen KI und Mensch gefordert ist und welches Werkzeug passt – von to-teach über fobizz bis zur Chat-KI.',
};

export default function PFlowPage() {
  return (
    <PageLayout>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-2xl, 1.5rem)', fontWeight: 700, marginBottom: '0.25rem' }}>
          P-Flow
        </h1>
        <p style={{ color: 'var(--color-gray-500, #6b7280)', marginBottom: '1.5rem', lineHeight: 1.55 }}>
          Nicht jede Idee braucht denselben Weg — und nicht alles ist ein KI-Assistent.
          Dieses Flussdiagramm führt dich durch die Klärungsfragen: <strong>Was möchte ich mit KI
          gestalten, welchen Prozess steuern, welchen Output von den Lernenden erreichen?</strong>{' '}
          Danach: Was ist im Austausch zwischen KI und Mensch gefordert — und mit welchem Werkzeug?
          Am Ende landest du beim passenden Ort: erprobte Prompts oder remixbare Beispiele in der Gen Biblio.
        </p>
        <PFlow />
      </div>
    </PageLayout>
  );
}
