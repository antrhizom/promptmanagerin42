'use client';

import { useState, useMemo } from 'react';
import { KiTool } from '@/lib/types';
import { useKiTools } from '@/lib/hooks/useKiTools';
import { useAuthContext } from '@/components/auth/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { KiToolCard } from '@/components/kitools/KiToolCard';
import { KiToolForm } from '@/components/kitools/KiToolForm';
import { SubmissionForm } from '@/components/submit/SubmissionForm';
import { KI_TOOL_TYPEN, KI_TOOL_KATEGORIEN } from '@/lib/constants';

export default function KiAssistentenPage() {
  const { isAdmin } = useAuthContext();
  const { tools, loading, error, addTool, updateTool, deleteTool, likeTool } = useKiTools();

  const [showForm, setShowForm] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [editing, setEditing] = useState<KiTool | null>(null);
  const [search, setSearch] = useState('');
  const [filterTyp, setFilterTyp] = useState('');
  const [filterKategorie, setFilterKategorie] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tools.filter(t => {
      if (filterTyp && t.typ !== filterTyp) return false;
      if (filterKategorie && t.kategorie !== filterKategorie) return false;
      if (q) {
        const hay = [t.name, t.beschreibung, t.plattform, t.kategorie, ...(t.tags || [])]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q.replace(/^#/, ''))) return false;
      }
      return true;
    });
  }, [tools, search, filterTyp, filterKategorie]);

  const handleSubmit = async (data: Partial<KiTool>) => {
    if (editing) {
      await updateTool(editing.id, data);
    } else {
      await addTool(data as Omit<KiTool, 'id' | 'erstelltAm' | 'bewertungen'>);
    }
  };

  const handleEdit = (tool: KiTool) => {
    setEditing(tool);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (tool: KiTool) => {
    if (!isAdmin) return;
    if (confirm(`"${tool.name}" wirklich loschen?`)) {
      await deleteTool(tool.id);
    }
  };

  const handleFilterClick = (type: string, value: string) => {
    if (type === 'typ') setFilterTyp(value);
    else if (type === 'kategorie') setFilterKategorie(value);
    else setSearch(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = !!(search || filterTyp || filterKategorie);

  return (
    <PageLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-2xl, 1.5rem)', fontWeight: 700, marginBottom: '0.25rem' }}>
          KI-Tools &amp; Generatoren
        </h1>
        <p style={{ color: 'var(--color-gray-500, #6b7280)', marginBottom: '1.5rem' }}>
          Eine kuratierte Sammlung nützlicher KI-Tools und -Generatoren (inkl. guter to-teach.ai-Aufgaben).
          Liken ist ohne Anmeldung möglich.
        </p>

        {showSubmit && (
          <SubmissionForm type="kitool" onClose={() => setShowSubmit(false)} />
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {isAdmin && !showForm && (
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              style={{ padding: '0.6rem 1.25rem', background: 'var(--color-navy, #1e3a8a)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md, 8px)', fontWeight: 600, cursor: 'pointer' }}
            >
              + Neues KI-Tool
            </button>
          )}
          <button
            onClick={() => setShowSubmit(true)}
            style={{ padding: '0.6rem 1.25rem', background: 'var(--color-white, #fff)', border: '1px solid var(--color-navy, #1e3a8a)', color: 'var(--color-navy, #1e3a8a)', borderRadius: 'var(--radius-md, 8px)', fontWeight: 600, cursor: 'pointer' }}
          >
            + KI-Tool / to-teach-Aufgabe vorschlagen
          </button>
        </div>

        {isAdmin && showForm && (
          <KiToolForm
            editingTool={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen..."
            style={{ flex: '2 1 200px', padding: '0.55rem 0.75rem', border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)' }}
          />
          <select value={filterTyp} onChange={e => setFilterTyp(e.target.value)} style={{ flex: '1 1 140px', padding: '0.55rem 0.75rem', border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)' }}>
            <option value="">Alle Typen</option>
            {KI_TOOL_TYPEN.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterKategorie} onChange={e => setFilterKategorie(e.target.value)} style={{ flex: '1 1 140px', padding: '0.55rem 0.75rem', border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)' }}>
            <option value="">Alle Kategorien</option>
            {KI_TOOL_KATEGORIEN.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setFilterTyp(''); setFilterKategorie(''); }}
              style={{ padding: '0.55rem 1rem', background: 'var(--color-white, #fff)', border: '1px solid var(--color-gray-200, #e5e7eb)', borderRadius: 'var(--radius-md, 8px)', cursor: 'pointer' }}
            >
              Zurücksetzen
            </button>
          )}
        </div>

        {/* Liste */}
        {error ? (
          <div style={{ textAlign: 'center', color: 'var(--color-gray-500, #6b7280)', padding: '2rem' }}>{error}</div>
        ) : loading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-gray-500, #6b7280)', padding: '2rem' }}>KI-Tools werden geladen...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-gray-500, #6b7280)', padding: '2rem' }}>
            {tools.length === 0 ? 'Noch keine KI-Tools hinterlegt.' : 'Keine Treffer für die aktuellen Filter.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filtered.map(tool => (
              <KiToolCard
                key={tool.id}
                tool={tool}
                onLike={(emoji) => likeTool(tool.id, emoji)}
                onEdit={isAdmin ? () => handleEdit(tool) : undefined}
                onDelete={isAdmin ? () => handleDelete(tool) : undefined}
                onFilterClick={handleFilterClick}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
