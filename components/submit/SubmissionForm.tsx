'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { PLATTFORMEN_MIT_MODELLEN, ABO_VARIANTEN, OUTPUT_MAX_BYTES } from '@/lib/constants';

type SubmissionType = 'prompt' | 'kitool' | 'output';

interface OutputDatei {
  name: string;
  html: string;
  groesse: number;
}

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

interface SubmissionFormProps {
  type: SubmissionType;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  border: '1px solid var(--color-gray-200, #e5e7eb)',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: 'var(--text-base, 1rem)',
  background: 'var(--color-white, #fff)',
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem',
  color: 'var(--color-gray-700, #374151)',
};
const field: React.CSSProperties = { marginBottom: '0.9rem' };

export function SubmissionForm({ type, onClose }: SubmissionFormProps) {
  // gemeinsame Felder
  const [autorEmail, setAutorEmail] = useState('');
  const [emailOeffentlich, setEmailOeffentlich] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Prompt-Felder (schlank)
  const [titel, setTitel] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [promptText, setPromptText] = useState('');
  const [plattform, setPlattform] = useState('');
  const [aboVariante, setAboVariante] = useState('');
  const [tags, setTags] = useState('');

  // KI-Tool-Beispiel-Felder
  const [tools, setTools] = useState<{ id: string; name: string }[]>([]);
  const [toolId, setToolId] = useState('');
  const [exLink, setExLink] = useState('');
  const [exTags, setExTags] = useState('');

  // Output-Felder (HTML-Datei)
  const [datei, setDatei] = useState<OutputDatei | null>(null);
  const [erstelltMit, setErstelltMit] = useState('');

  const plattformen = Object.keys(PLATTFORMEN_MIT_MODELLEN);

  const waehleDatei = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setDatei(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      setError('Bitte eine HTML-Datei (.html) wählen.');
      return;
    }
    if (file.size > OUTPUT_MAX_BYTES) {
      setError(`Die Datei ist zu gross (${kb(file.size)}). Erlaubt sind höchstens ${kb(OUTPUT_MAX_BYTES)}.`);
      return;
    }
    const html = await file.text();
    setDatei({ name: file.name, html, groesse: file.size });
    if (!titel.trim()) {
      const ausHtml = html.match(/<title[^>]*>([^<]{1,150})<\/title>/i)?.[1]?.trim();
      if (ausHtml) setTitel(ausHtml);
    }
  };

  // Bestehende KI-Tools für die Auswahl laden.
  useEffect(() => {
    if (type !== 'kitool') return;
    fetch('/api/kitools')
      .then(r => r.json())
      .then(d => setTools((d.tools || []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name }))))
      .catch(() => {});
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!autorEmail.includes('@')) { setError('Bitte eine gültige E-Mail angeben.'); return; }

    let data: Record<string, unknown>;
    if (type === 'prompt') {
      if (!titel.trim() || !promptText.trim()) { setError('Titel und Prompt-Text sind erforderlich.'); return; }
      data = {
        titel: titel.trim(),
        beschreibung: beschreibung.trim(),
        promptText: promptText.trim(),
        plattform: plattform.trim(),
        aboVariante: aboVariante.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };
    } else if (type === 'output') {
      if (!datei) { setError('Bitte eine HTML-Datei auswählen.'); return; }
      if (!titel.trim()) { setError('Bitte einen Titel angeben.'); return; }
      data = {
        titel: titel.trim(),
        beschreibung: beschreibung.trim(),
        erstelltMit: erstelltMit.trim(),
        dateiname: datei.name,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        html: datei.html,
      };
    } else {
      if (!toolId) { setError('Bitte einen Generator auswählen.'); return; }
      if (!titel.trim()) { setError('Bitte einen Titel für das Beispiel angeben.'); return; }
      if (!exLink.trim() && !promptText.trim()) {
        setError('Bitte einen Link ODER einen Prompt-Text zum Beispiel angeben.'); return;
      }
      const tool = tools.find(t => t.id === toolId);
      data = {
        toolId,
        toolName: tool?.name || '',
        titel: titel.trim(),
        beschreibung: beschreibung.trim(),
        link: exLink.trim(),
        promptText: promptText.trim(),
        tags: exTags.split(',').map(t => t.trim()).filter(Boolean),
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, autorEmail: autorEmail.trim(), emailOeffentlich }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Einreichung fehlgeschlagen.');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Einreichung fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  const titelText = type === 'prompt'
    ? 'Prompt vorschlagen'
    : type === 'output'
      ? 'Output vorschlagen (HTML-Datei)'
      : 'Beispiel / Aufgabe für einen Generator vorschlagen';

  if (done) {
    return (
      <Modal onClose={onClose}>
        <h2 style={{ marginTop: 0 }}>Danke! ✅</h2>
        <p style={{ color: 'var(--color-gray-600, #4b5563)' }}>
          Deine Einreichung wurde übermittelt und erscheint nach einer kurzen Prüfung durch die
          Redaktion. {emailOeffentlich
            ? 'Deine E-Mail wird beim freigeschalteten Eintrag angezeigt.'
            : 'Deine E-Mail wird nicht öffentlich angezeigt.'}
        </p>
        <button onClick={onClose} style={{ padding: '0.55rem 1.1rem', background: 'var(--color-navy, #1e3a8a)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer', fontWeight: 600 }}>
          Schließen
        </button>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginTop: 0, fontSize: 'var(--text-xl, 1.25rem)' }}>{titelText}</h2>
      <p style={{ color: 'var(--color-gray-500, #6b7280)', fontSize: '0.85rem', marginTop: 0 }}>
        Wird nach Prüfung freigeschaltet.
      </p>

      <form onSubmit={handleSubmit}>
        {type === 'output' ? (
          <>
            <div style={field}>
              <label style={labelStyle} htmlFor="output-datei">HTML-Datei *</label>
              <input
                id="output-datei"
                type="file"
                accept=".html,.htm,text/html"
                onChange={waehleDatei}
                style={{ ...inputStyle, padding: '0.45rem' }}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500, #6b7280)', margin: '0.3rem 0 0' }}>
                {datei
                  ? `Ausgewählt: ${datei.name} (${kb(datei.groesse)})`
                  : `Eine einzige Datei, in der alles enthalten ist (Texte, Gestaltung, Scripts, Bilder). Höchstens ${kb(OUTPUT_MAX_BYTES)}.`}
              </p>
            </div>
            <div style={field}>
              <label style={labelStyle} htmlFor="output-titel">Titel *</label>
              <input id="output-titel" style={inputStyle} value={titel} onChange={e => setTitel(e.target.value)} placeholder="z.B. Quiz zum Kaufvertrag" />
            </div>
            <div style={field}>
              <label style={labelStyle} htmlFor="output-beschreibung">Beschreibung</label>
              <textarea id="output-beschreibung" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Was zeigt der Output, für wen ist er gedacht, wie setzt man ihn ein?" />
            </div>
            <div style={field}>
              <label style={labelStyle} htmlFor="output-ki">Erstellt mit</label>
              <input id="output-ki" style={inputStyle} value={erstelltMit} onChange={e => setErstelltMit(e.target.value)} placeholder="z.B. Claude, ChatGPT, Gemini" />
            </div>
            <div style={field}>
              <label style={labelStyle} htmlFor="output-tags">Tags (kommagetrennt)</label>
              <input id="output-tags" style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="z.B. abu, quiz, recht" />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500, #6b7280)', margin: '-0.3rem 0 0.9rem' }}>
              Bitte keine Personendaten in der Datei. Die Redaktion prüft den Output vor der Freischaltung.
            </p>
          </>
        ) : type === 'prompt' ? (
          <>
            <div style={field}>
              <label style={labelStyle}>Titel *</label>
              <input style={inputStyle} value={titel} onChange={e => setTitel(e.target.value)} placeholder="Kurzer, sprechender Titel" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Beschreibung</label>
              <input style={inputStyle} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Wofür ist der Prompt gut?" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Prompt-Text *</label>
              <textarea style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Der eigentliche Prompt..." />
            </div>
            <div style={field}>
              <label style={labelStyle}>Plattform</label>
              <select style={inputStyle} value={plattform} onChange={e => setPlattform(e.target.value)}>
                <option value="">– bitte wählen –</option>
                {plattformen.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={field}>
              <label style={labelStyle}>Abo-Variante</label>
              <select style={inputStyle} value={aboVariante} onChange={e => setAboVariante(e.target.value)}>
                <option value="">– keine Angabe –</option>
                {ABO_VARIANTEN.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={field}>
              <label style={labelStyle}>Tags (kommagetrennt)</label>
              <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="z.B. deutsch, b1, korrektur" />
            </div>
          </>
        ) : (
          <>
            <div style={field}>
              <label style={labelStyle}>Generator *</label>
              <select style={inputStyle} value={toolId} onChange={e => setToolId(e.target.value)}>
                <option value="">– bitte einen Generator wählen –</option>
                {tools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500, #6b7280)', margin: '0.3rem 0 0' }}>
                Dein Beispiel wird unter diesem Generator einsortiert.
              </p>
            </div>
            <div style={field}>
              <label style={labelStyle}>Titel des Beispiels *</label>
              <input style={inputStyle} value={titel} onChange={e => setTitel(e.target.value)} placeholder="z.B. Kaufvertrag-Arbeitsblatt für die BFS" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Beschreibung</label>
              <input style={inputStyle} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Was zeigt dieses Beispiel?" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Link zum Beispiel</label>
              <input style={inputStyle} value={exLink} onChange={e => setExLink(e.target.value)} placeholder="https://... (z.B. to-teach-Share-Link, fobizz-Remix)" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Prompt-Text (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="Falls das Beispiel ein Prompt ist..." />
            </div>
            <div style={field}>
              <label style={labelStyle}>Tags (kommagetrennt)</label>
              <input style={inputStyle} value={exTags} onChange={e => setExTags(e.target.value)} placeholder="z.B. recht, abu, arbeitsblatt" />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-gray-500, #6b7280)', margin: '-0.4rem 0 0.6rem' }}>
              Mindestens ein Link oder ein Prompt-Text ist nötig.
            </p>
          </>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-gray-100, #f3f4f6)', margin: '0.5rem 0 0.9rem' }} />

        <div style={field}>
          <label style={labelStyle}>Deine E-Mail *</label>
          <input style={inputStyle} type="email" value={autorEmail} onChange={e => setAutorEmail(e.target.value)} placeholder="name@beispiel.ch" />
        </div>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', marginBottom: '1rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={emailOeffentlich} onChange={e => setEmailOeffentlich(e.target.checked)} style={{ marginTop: '0.2rem' }} />
          <span>Meine E-Mail darf beim freigeschalteten Eintrag öffentlich angezeigt werden (sonst bleibt sie nur intern für die Redaktion sichtbar).</span>
        </label>

        {error && <div style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.7rem' }}>
          <button type="submit" disabled={submitting} style={{ padding: '0.6rem 1.25rem', background: 'var(--color-navy, #1e3a8a)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md, 8px)', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Wird gesendet...' : 'Einreichen'}
          </button>
          <button type="button" onClick={onClose} style={{ padding: '0.6rem 1.25rem', background: 'var(--color-white, #fff)', border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer' }}>
            Abbrechen
          </button>
        </div>
      </form>
    </Modal>
  );
}
