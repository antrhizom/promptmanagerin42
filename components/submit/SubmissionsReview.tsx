'use client';

import { useState, useEffect, useCallback } from 'react';
import { Submission } from '@/lib/types';
import { useAuthContext } from '@/components/auth/AuthContext';

export function SubmissionsReview() {
  const { getIdToken } = useAuthContext();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getIdToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('/api/submissions', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSubs(data.submissions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/submissions/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submissionId: id, action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Fehler: ' + (err.error || res.status));
      } else {
        setSubs(prev => prev.map(s => (s.id === id ? { ...s, status: action === 'approve' ? 'approved' : 'rejected' } : s)));
      }
    } finally {
      setBusy(null);
    }
  };

  const pending = subs.filter(s => s.status === 'pending');

  const box: React.CSSProperties = {
    background: 'var(--color-white,#fff)', border: '1px solid var(--color-gray-200,#e5e7eb)',
    borderRadius: 'var(--radius-lg,12px)', padding: '1rem 1.25rem', marginBottom: '1.5rem',
  };

  if (loading) return null;

  return (
    <div style={box}>
      <h2 style={{ marginTop: 0, fontSize: 'var(--text-lg,1.125rem)' }}>
        Freischaltung {pending.length > 0 && <span style={{ background: 'var(--color-error,#dc2626)', color: '#fff', borderRadius: '999px', padding: '0.1rem 0.55rem', fontSize: '0.8rem', marginLeft: '0.4rem' }}>{pending.length}</span>}
      </h2>

      {pending.length === 0 ? (
        <p style={{ color: 'var(--color-gray-500,#6b7280)', margin: 0 }}>Keine offenen Einreichungen.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {pending.map(s => {
            const d = (s.data || {}) as Record<string, string | string[]>;
            const titel = s.type === 'comment'
              ? `Kommentar von ${(d.userName as string) || 'Anonym'}`
              : ((d.titel as string) || (d.name as string) || '(ohne Titel)');
            const typLabel = s.type === 'prompt' ? 'Prompt' : s.type === 'comment' ? 'Kommentar' : 'KI-Tool-Beispiel';
            return (
              <div key={s.id} style={{ border: '1px solid var(--color-gray-100,#f3f4f6)', borderRadius: 'var(--radius-md,8px)', padding: '0.75rem 0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong>{titel}</strong>
                  <span style={{ fontSize: '0.75rem', background: 'var(--color-gray-100,#f3f4f6)', borderRadius: '999px', padding: '0.1rem 0.55rem' }}>
                    {typLabel}
                  </span>
                </div>
                {s.type === 'kitool' && d.toolName && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary-blue,#0050b3)', fontWeight: 600, margin: '0.2rem 0' }}>
                    → für Tool: {d.toolName as string}
                  </div>
                )}
                {s.type === 'comment' && d.promptTitel && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary-blue,#0050b3)', fontWeight: 600, margin: '0.2rem 0' }}>
                    → zu Prompt: {d.promptTitel as string}
                  </div>
                )}
                {s.type === 'comment' && d.text && (
                  <p style={{ margin: '0.35rem 0', color: 'var(--color-gray-800,#1f2937)', fontSize: '0.9rem', fontStyle: 'italic' }}>„{d.text as string}"</p>
                )}
                {d.beschreibung && <p style={{ margin: '0.35rem 0', color: 'var(--color-gray-600,#4b5563)', fontSize: '0.9rem' }}>{d.beschreibung as string}</p>}
                {d.promptText && (
                  <pre style={{ whiteSpace: 'pre-wrap', background: 'var(--color-gray-50,#f9fafb)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', maxHeight: '140px', overflow: 'auto' }}>{d.promptText as string}</pre>
                )}
                {s.type === 'kitool' && d.link && (
                  <a href={d.link as string} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem' }}>↗ {d.link as string}</a>
                )}
                {s.autorEmail && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-gray-500,#6b7280)', marginTop: '0.4rem' }}>
                    Autor-E-Mail: {s.autorEmail} · {s.emailOeffentlich ? 'wird öffentlich angezeigt' : 'bleibt intern'}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                  <button disabled={busy === s.id} onClick={() => review(s.id, 'approve')} style={{ padding: '0.4rem 0.9rem', background: 'var(--color-success,#16a34a)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    {busy === s.id ? '...' : 'Freischalten'}
                  </button>
                  <button disabled={busy === s.id} onClick={() => review(s.id, 'reject')} style={{ padding: '0.4rem 0.9rem', background: 'var(--color-white,#fff)', color: 'var(--color-error,#dc2626)', border: '1px solid var(--color-error,#dc2626)', borderRadius: '6px', cursor: 'pointer' }}>
                    Ablehnen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
