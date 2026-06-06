'use client';

import { useState } from 'react';
import { KiTool } from '@/lib/types';
import { KI_TOOL_TYPEN, KI_TOOL_KATEGORIEN } from '@/lib/constants';

interface KiToolFormProps {
  editingTool?: KiTool | null;
  onSubmit: (data: Partial<KiTool>) => Promise<void>;
  onCancel: () => void;
}

// Formular-interne Beispiel-Darstellung (Tags als kommagetrennter Text).
interface BeispielForm {
  id: string;
  titel: string;
  beschreibung: string;
  link: string;
  promptText: string;
  tags: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  border: '1px solid var(--color-gray-200, #e5e7eb)',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: 'var(--text-base, 1rem)',
  outline: 'none',
  background: 'var(--color-white, #fff)',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
  marginBottom: '0.35rem',
  color: 'var(--color-gray-700, #374151)',
};
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

export function KiToolForm({ editingTool, onSubmit, onCancel }: KiToolFormProps) {
  const isEditing = !!editingTool;
  const [name, setName] = useState(editingTool?.name || '');
  const [beschreibung, setBeschreibung] = useState(editingTool?.beschreibung || '');
  const [link, setLink] = useState(editingTool?.link || '');
  const [typ, setTyp] = useState(editingTool?.typ || KI_TOOL_TYPEN[0]);
  const [kategorie, setKategorie] = useState(editingTool?.kategorie || '');
  const [plattform, setPlattform] = useState(editingTool?.plattform || '');
  const [tags, setTags] = useState((editingTool?.tags || []).join(', '));
  const [beispiele, setBeispiele] = useState<BeispielForm[]>(
    (editingTool?.beispiele || []).map(b => ({
      id: b.id || '',
      titel: b.titel || '',
      beschreibung: b.beschreibung || '',
      link: b.link || '',
      promptText: b.promptText || '',
      tags: (b.tags || []).join(', '),
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const genId = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `b_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const addBeispiel = () => setBeispiele(prev => [...prev, { id: genId(), titel: '', beschreibung: '', link: '', promptText: '', tags: '' }]);
  const updateBeispiel = (i: number, field: keyof BeispielForm, value: string) =>
    setBeispiele(prev => prev.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)));
  const removeBeispiel = (i: number) => setBeispiele(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !link.trim()) {
      setError('Name und Link sind erforderlich.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        beschreibung: beschreibung.trim(),
        link: link.trim(),
        typ,
        kategorie: kategorie || '',
        plattform: plattform.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        beispiele: beispiele
          .filter(b => b.titel.trim())
          .map(b => {
            const tagList = b.tags.split(',').map(t => t.trim()).filter(Boolean);
            return {
              id: b.id || genId(),
              titel: b.titel.trim(),
              ...(b.beschreibung.trim() && { beschreibung: b.beschreibung.trim() }),
              ...(b.link.trim() && { link: b.link.trim() }),
              ...(b.promptText.trim() && { promptText: b.promptText.trim() }),
              ...(tagList.length > 0 && { tags: tagList }),
            };
          }),
      });
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--color-white, #fff)',
        border: '1px solid var(--color-gray-200, #e5e7eb)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: 'var(--space-6, 1.5rem)',
        marginBottom: 'var(--space-6, 1.5rem)',
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: 'var(--text-xl, 1.25rem)' }}>
        {isEditing ? 'KI-Tool bearbeiten' : 'Neues KI-Tool'}
      </h2>

      <div style={fieldStyle}>
        <label style={labelStyle}>Name *</label>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="z.B. ChatGPT" />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Beschreibung</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Kurzbeschreibung" />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Link (URL) *</label>
        <input style={inputStyle} value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ ...fieldStyle, flex: '1 1 160px' }}>
          <label style={labelStyle}>Typ</label>
          <select style={inputStyle} value={typ} onChange={e => setTyp(e.target.value)}>
            {KI_TOOL_TYPEN.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ ...fieldStyle, flex: '1 1 160px' }}>
          <label style={labelStyle}>Kategorie</label>
          <select style={inputStyle} value={kategorie} onChange={e => setKategorie(e.target.value)}>
            <option value="">– keine –</option>
            {KI_TOOL_KATEGORIEN.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div style={{ ...fieldStyle, flex: '1 1 160px' }}>
          <label style={labelStyle}>Plattform / Anbieter</label>
          <input style={inputStyle} value={plattform} onChange={e => setPlattform(e.target.value)} placeholder="z.B. OpenAI" />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Tags (kommagetrennt)</label>
        <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="z.B. kostenlos, schule, bilder" />
      </div>

      {/* Konkrete Beispiele */}
      <div style={{ ...fieldStyle, borderTop: '1px solid var(--color-gray-200, #e5e7eb)', paddingTop: '1rem' }}>
        <label style={labelStyle}>Konkrete Beispiele</label>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500, #6b7280)', margin: '0 0 0.6rem' }}>
          Konkrete Anwendungs-Beispiele für dieses Tool (z.B. ein to-teach-Arbeitsblatt, ein fobizz-Remix). Titel ist Pflicht, der Rest optional.
        </p>
        {beispiele.map((b, i) => (
          <div key={i} style={{ border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)', padding: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <strong style={{ fontSize: '0.85rem' }}>Beispiel {i + 1}</strong>
              <button type="button" onClick={() => removeBeispiel(i)} style={{ border: 'none', background: 'none', color: 'var(--color-error, #dc2626)', cursor: 'pointer', fontSize: '0.85rem' }}>
                Entfernen
              </button>
            </div>
            <input style={{ ...inputStyle, marginBottom: '0.4rem' }} value={b.titel} onChange={e => updateBeispiel(i, 'titel', e.target.value)} placeholder="Titel des Beispiels *" />
            <input style={{ ...inputStyle, marginBottom: '0.4rem' }} value={b.beschreibung || ''} onChange={e => updateBeispiel(i, 'beschreibung', e.target.value)} placeholder="Kurzbeschreibung (optional)" />
            <input style={{ ...inputStyle, marginBottom: '0.4rem' }} value={b.link || ''} onChange={e => updateBeispiel(i, 'link', e.target.value)} placeholder="Link zum Beispiel (optional, https://...)" />
            <textarea style={{ ...inputStyle, marginBottom: '0.4rem', minHeight: '60px', resize: 'vertical' }} value={b.promptText || ''} onChange={e => updateBeispiel(i, 'promptText', e.target.value)} placeholder="Prompt-Text (optional)" />
            <input style={inputStyle} value={b.tags} onChange={e => updateBeispiel(i, 'tags', e.target.value)} placeholder="Tags des Beispiels (kommagetrennt, optional)" />
          </div>
        ))}
        <button type="button" onClick={addBeispiel} style={{ padding: '0.45rem 0.9rem', background: 'var(--color-white, #fff)', border: '1px dashed var(--color-navy, #1e3a8a)', color: 'var(--color-navy, #1e3a8a)', borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          + Beispiel hinzufügen
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{ padding: '0.6rem 1.25rem', background: 'var(--color-navy, #1e3a8a)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md, 8px)', fontWeight: 600, cursor: 'pointer' }}
        >
          {submitting ? 'Speichern...' : (isEditing ? 'Speichern' : 'Erstellen')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '0.6rem 1.25rem', background: 'var(--color-white, #fff)', border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer' }}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
